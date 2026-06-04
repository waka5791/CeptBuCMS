
const url = location.origin + location.pathname;
const params = new URLSearchParams(window.location.search);

const argT = params.get("t");
const argR = params.get("r");

let roomIndex = {};
let tourInfo = {};
let roomInfo = {};
let goalResultHash = { "goal": "達成", "round_over": "ラウンドオーバー", "sudden_death": "サドンデス", undefined: "", "": "" };

$(async function () {
    await loadRoomIndex();
    renderTours();
});

function waitAndClick(selector, callback) {
    const target = document.querySelector(selector);

    if (target) {
        //target.click();
        //if (callback) callback();
        //return;
    }

    const observer = new MutationObserver(() => {
        const target = document.querySelector(selector);

        if (target) {
            target.click();
            observer.disconnect();

            if (callback) callback();
        }
    });

    $(function () {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

waitAndClick(`[data-tour="${argT}"]`, () => {
    waitAndClick(`[data-room="${argR}"]`, () => {
        requestAnimationFrame(() => {
            waitAndClick(`[data-room="${argR}"]`);//念入り
        });
    });
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
        currentTour =
            $(this).data("tour");

        currentRoom =
            -1;
        loadRoomInfo(
            currentTour,
            currentRoom
        );
    }
);

function renderRooms(tour) {

    let html = "";

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
let currentTour = null;
let currentRoom = null;
$(document).on(
    "click",
    ".room-link",
    function (e) {

        e.preventDefault();

        currentTour =
            $(this).data("tour");

        currentRoom =
            $(this).data("room");

        $(".room-link")
            .removeClass("btn-primary");
        $(".room-link")
            .addClass("btn-secondary");
        $(this)
            .removeClass("btn-secondary");
        $(this)
            .addClass("btn-primary");

        loadRoomInfo(
            currentTour,
            currentRoom
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
function formatDateTime(str) {
    if (str.length > 14) {
        return str;
    }
    const date = new Date(
        +str.substr(0, 4),
        +str.substr(4, 2) - 1,
        +str.substr(6, 2),
        +str.substr(8, 2),
        +str.substr(10, 2)
    );

    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${weekdays[date.getDay()]}） ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
async function loadRoomInfo(
    tour,
    room
) {

    let tourConfText = "";
    let confText = "";
    let rankText = "";
    let commentText = "";

    try {
        if (room > 0) {
            tourConfText = await $.get(`room/${tour}/conf`);
            confText = await $.get(`room/${tour}/${room}/conf`);
        } else {
            tourConfText = await $.get(`room/${tour}/conf`);
            confText = await $.get(`room/${tour}/conf`);
        }
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
    const tourConf = parseConf(tourConfText);
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

    //const tourMap = conf.map;

    let tourMap = "";
    if (conf.use_maps != undefined) {
        conf.use_maps.forEach(function (m) {
            tourMap += `<img src="data/img/map/${m}.gif" title="${m}">`
        });
    }
    else if (conf.map != undefined) {
        tourMap = `<img src="data/img/map/${conf.map}.gif" title="${conf.map}">`;
    }
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
                        cols[2] || 6543210
                    )

            });

        });


    if (rankText == "" && conf.rank != undefined) {
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
            if (!comment.includes("DO_")) {
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
                ${userId ? `(${escapeHtml(userId)})` : ""}

            </td>

            <td>

                ${escapeHtml(comment).replace(":blue_start:", '<span class="text-primary">').replace(":blue_end:", '</span>')
                        .replace(":red_start:", '<span class="text-danger">').replace(":red_end:", '</span>')
                    }

            </td>

            <td>

                ${escapeHtml(formatDateTime(date))}

            </td>

        </tr>
        `;
            }
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
            ${decodeComment(tourInfo[tour]?.room_nickname || tour)}
        </div>
        <div>
        共有用URL
        <span onclick="copyUrl()" style="cursor:pointer;">📋</span>
        <code id="url">
          ${url + `?t=${tour}` + `${room > 0 ? `&r=${room}` : ``}`}
        </code>
        </div>
        <div class="card-body">

            <div class="mb-3">
                ${tourMap}
                <div>
                ${formatDateTime(tourConf.tour_spanS)} ～ ${formatDateTime(tourConf.tour_spanE)}
                </div>
                <div>
                ${tourConf.hatena_user_name}
                ${tourConf.sponsorship_partner}
                </div>
                <div>
                ${tourConf.gain}G
                ${tourConf.round}R
                ${tourConf.sudden_death == "o" ? "サドンデスあり" : "サドンデスなし"}
                ${tourConf.point_in_tour_vs4}
                ${tourConf.point_in_tour_vs4_ov}
                </div>
            </div>

            <div>

                <strong>
                    大会内容
                </strong>

                <div>
                    ${tourComment.replace(/^/m, "<div>").replace(/$/m, "</div>")}
                </div>

            </div>

        </div>

    </div>

    `;
    if (room > 0) {
        html += `
        <div class="card mb-3">

            <div class="card-header">
                    【${room}】
                    ${escapeHtml(tourName) || "-"}
                    <div>
                    ${formatDateTime(conf.regist_time)}
                    ${goalResultHash[conf.goal_result]}
                    ${conf.goal_round}
                    ${conf.now_doing}
                    </div>
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

        if (ranks.length > 0) {
            ranks.forEach(function (r) {
                if (r.score == 6543210) { r.score = "-" }
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
        }
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
    }
    $("#paneC").html(html);

}

async function copyUrl() {
    const url = document.getElementById("url").textContent;
    await navigator.clipboard.writeText(url);
    alert(`${url}` + " Copied.");
}