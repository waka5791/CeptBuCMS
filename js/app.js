
let roomIndex = {};
let tourInfo = {};
let roomInfo = {};

$(async function () {

    await loadRoomIndex();

    renderTours();

});

async function loadRoomIndex() {

    roomIndex =
        await $.getJSON(
            "data/room.json"
        );

    const tours =
        Object.keys(roomIndex);

    for (const tour of tours) {

        try {

            const confText =
                await $.get(
                    `room/${tour}/conf`
                );

            const conf =
                parseConf(confText);

            tourInfo[tour] = conf

        }
        catch (e) {

            tourInfo[tour] = {

                room_nickname:
                    tour

            };

        }

    }

}
function renderTours() {

    let html = `
        <div
            id="tourList"
            class="list-group">
    `;

    Object.keys(roomIndex).forEach(function (tour) {
        let maps = "";

        if (tourInfo[tour].use_maps != undefined) {
            tourInfo[tour].use_maps.forEach(function (m) {
                maps += `<img src="data/img/map/${m}.gif" style="height:20px">`
            });
        }
        else if (tourInfo[tour].map != undefined) {
            maps = `<img src="data/img/map/${tourInfo[tour].map}.gif" style="height:20px">`;
        }
        let winner = "";
        if (tourInfo[tour].tour_winner != "") {
            winner = `／ 優勝： ${tourInfo[tour].tour_winner}`;
        }
        html += `

                <a
                    href="#"
                    class="
                        list-group-item
                        list-group-item-action
                        tour-link
                    "
                    data-tour="${tour}">
                    (${tour})
                    ${decodeComment(
            tourInfo[tour]?.room_nickname || tour
        )}
                    ${maps}
                    ${winner}
                </a>
            `;

    });

    html += `
        </div>
    `;

    $("#paneA").html(html);

}
$(document).on(
    "click",
    ".tour-link",
    function (e) {

        e.preventDefault();

        $("#tourList .tour-link")
            .removeClass("active");

        $(this)
            .addClass("active");

        renderRooms(
            $(this).data("tour")
        );

    }
);

function renderRooms(tour) {

    let html =
        "<h5>ルーム一覧</h5>";

    roomIndex[tour]
        .forEach(function (room) {

            html += `
                <button
                    class="btn btn-secondary btn-sm room-link"
                    data-tour="${tour}"
                    data-room="${room}">
                    ${room}
                </button>
            `;

        });

    $("#paneB").html(html);

}

$(document).on(
    "click",
    ".room-link",
    function () {

        loadRoomInfo(
            $(this).data("tour"),
            $(this).data("room")
        );

    }
);

function escapeHtml(text) {

    return $("<div>")
        .text(text)
        .html();

}

function decodeComment(text) {

    try {

        return decodeURIComponent(
            text.replace(/\+/g, " ")
        );

    }
    catch (e) {

        return text;

    }

}
function parseConf(text) {

    const result = {};

    text.split(/\r?\n/)
        .forEach(function (line) {

            line = line.trim();

            if (!line) {
                return;
            }

            const m =
                line.match(
                    /^@conf\['(.+?)'\]\s*=\s*(.+)$/
                );

            if (!m) {
                return;
            }

            const key =
                m[1];

            let value =
                m[2].trim();

            try {

                if (
                    value.startsWith('"')
                    &&
                    value.endsWith('"')
                ) {

                    result[key] =
                        value.slice(
                            1,
                            -1
                        );

                }
                else if (
                    value.startsWith("[")
                    &&
                    value.endsWith("]")
                ) {

                    const json =
                        value
                            .replace(
                                /=>/g,
                                ":"
                            )
                            .replace(
                                /'/g,
                                '"'
                            );

                    result[key] =
                        JSON.parse(
                            json
                        );

                }
                else if (
                    value === "true"
                ) {

                    result[key] =
                        true;

                }
                else if (
                    value === "false"
                ) {

                    result[key] =
                        false;

                }
                else if (
                    /^-?\d+(\.\d+)?$/
                        .test(value)
                ) {

                    result[key] =
                        Number(
                            value
                        );

                }
                else {

                    result[key] =
                        value;

                }

            }
            catch (e) {

                result[key] =
                    value;

            }

        });

    return result;

}

async function loadRoomInfo(
    tour,
    room
) {

    let confText = "";
    let rankText = "";
    let commentText = "";

    try {

        confText =
            await $.get(
                `room/${tour}/${room}/conf`
            );
    }
    catch (e) {

    }

    try {

        rankText =
            await $.get(
                `room/${tour}/${room}/rank`
            );

    }
    catch (e) {

    }

    try {

        commentText =
            await $.get(
                `room/${tour}/${room}/comment`
            );

        commentText =
            decodeComment(
                commentText.trim()
            );

    }
    catch (e) {

    }

    const conf =
        parseConf(confText);

    const tourName =
        decodeComment(
            conf.room_nickname || ""
        );

    const tourComment =
        decodeComment(
            conf.comment || ""
        );

    const tourMap =
        conf.map;

    const ranks = [];

    rankText
        .split(/\r?\n/)
        .forEach(function (line) {

            line = line.trim();

            if (!line) {
                return;
            }

            const cols =
                line.split(",");

            ranks.push({

                rank:
                    parseInt(
                        cols[0]
                            .replace(
                                "rank",
                                ""
                            )
                    ),

                player:
                    (cols[1] || "")
                        .trim(),

                score:
                    parseInt(
                        cols[2] || 0
                    )

            });

        });


    if (rankText == "") {
        //@conf['rank'] = [["2", "ichigo-go", "5871", ""], ["4", "groovetube", "2753", ""], ["1", "flareons", "7996", ""], ["3", "nununu1", "5169", ""]]
        conf.rank.forEach(function (ranksArray) {
            rankText += "hoge";
            ranks.push({

                rank:
                    parseInt(
                        ranksArray[0]
                    ),

                player:
                    ranksArray[1],

                score:
                    ranksArray[2]

            });
        });
    }


    ranks.sort(function (a, b) {

        return a.rank - b.rank;

    });

    let commentsHtml = `
        <table class="table table-striped table-sm align-middle">

        <thead>
        <tr>
            <th>アイコン</th>
            <th>ユーザー</th>
            <th>コメント</th>
            <th>日時</th>
        </tr>
        </thead>

        <tbody>
    `;

    if (commentText) {

        const commentCsv =
            Papa.parse(
                commentText,
                {
                    skipEmptyLines: true
                }
            );

        commentCsv.data.forEach(function (cols) {

            const name =
                (cols[0] || "")
                    .trim();

            const comment =
                (cols[1] || "")
                    .trim();

            const date =
                (cols[2] || "")
                    .trim();

            const imageUrl =
                (cols[3] || "")
                    .trim();

            const userId =
                (cols[4] || "")
                    .trim();

            commentsHtml += `
        <tr>

            <td>

                ${imageUrl
                    ? `
                    <img
                        src="${escapeHtml(imageUrl)}"
                        alt="アイコン"
                        width="48"
                        height="48"
                        style="
                            object-fit:cover;
                            border-radius:50%;
                        "
                        onerror="
                            this.style.display='none'
                        ">
                    `
                    : ""
                }

            </td>

            <td>

                ${escapeHtml(name)}
                (${escapeHtml(userId)})

            </td>

            <td>

                ${escapeHtml(comment)}

            </td>

            <td>

                ${escapeHtml(date)}

            </td>

        </tr>
        `;

        });

    }

    commentsHtml += `
        </tbody>
        </table>
    `;

    let html = ``;

    html += `

    <div class="card mb-3">

        <div class="card-header">
                        No. ${tour} 
                        ${decodeComment(
        tourInfo[tour]
            ?.room_nickname
        || tour
    )
        }
        </div>

        <div class="card-body">

            <div class="mb-3">
<img src="data/img/map/${tourMap}.gif" title="${tourMap}">
                <div>
                    【${room}】
                    ${escapeHtml(
            tourName
        ) || "-"

        }

                </div>

            </div>

            <div>

                <strong>
                    大会内容
                </strong>

                <div>

                    ${escapeHtml(
            tourComment
        ) || "-"

        }

                </div>

            </div>

        </div>

    </div>

    `;

    html += `
        <div class="card mb-3">

            <div class="card-header">
                ランキング
            </div>

            <div class="card-body">

                <table
                    class="
                        table
                        table-striped
                        table-sm
                    ">

                    <thead>

                    <tr>

                        <th>
                            順位
                        </th>

                        <th>
                            プレイヤー
                        </th>

                        <th>
                            魔力
                        </th>

                    </tr>

                    </thead>

                    <tbody>
    `;

    ranks.forEach(function (r) {

        html += `
        <tr>

            <td>

                ${r.rank}

            </td>

            <td>

                ${escapeHtml(
            r.player
        )}

            </td>

            <td>

                ${r.score}

            </td>

        </tr>
        `;

    });

    html += `
                    </tbody>

                </table>

            </div>

        </div>
    `;

    html += `
        <div class="card">

            <div class="card-header">
                ルームコメント
            </div>

            <div class="card-body">

                <div class="table-responsive">

                    ${commentsHtml}

                </div>

            </div>

        </div>
    `;

    $("#paneC").html(html);

}
