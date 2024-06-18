let points = 1000;
let username = "Yura";
let pointBtns = document.querySelectorAll('.point');
let game_id;
let level;

pointBtns.forEach(point => {
    point.addEventListener('click', setPoints)
});

function setPoints(event) {
    let userBtn = event.target;
    document.querySelector('.point.active').classList.remove('active');
    userBtn.classList.add('active');
    points = +userBtn.innerHTML;
    console.log(`Points set to: ${points}`);
}

document.querySelector('#gameButton').addEventListener('click', startOrStopGame);

async function sendRequest(url, method, data) {
    url = `https://tg-api.tehnikum.school/tehnikum_course/${url}`;

    try {
        let response;
        if (method == "POST") {
            response = await fetch(url, {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } else if (method == "GET") {
            url = url + "?" + new URLSearchParams(data);
            response = await fetch(url, {
                method: "GET",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let jsonResponse = await response.json();
        return jsonResponse;
    } catch (error) {
        console.error(`Error during ${method} request to ${url}:`, error);
        alert('An error occurred while communicating with the server.');
    }
}

async function getUser() {
    let user = await sendRequest("get_user", "POST", { "username": username });
    if (user.error) {
        alert(user.message);
    } else {
        let userInfo = document.querySelector(".userInfo");
        userInfo.innerHTML = `[Логин: ${user.username}, Баланс ${user.balance}]`;
    }
}
getUser(); // Call getUser to update user info on load

async function newGame() {
    let newGame = await sendRequest("new_game", "POST", {
        "username": username,
        "points": +points,
    });
    if (newGame.error) {
        alert(newGame.message);
        return false;
    } else {
        game_id = newGame.game_id;
        return true;
    }
}

async function stopGame() {
    let stop = await sendRequest("game_win", "POST", {
        "username": username,
        "game_id": game_id,
        "level": level
    });
    if (stop.error) {
        alert(stop.message);
        return false;
    } else {
        getUser();
        cleanArea();
        return true;
    }
}

function startOrStopGame(event) {
    let gameBtn = event.target;
    let action = gameBtn.getAttribute('data-action');
    if (action == "stop") {
        let isWon = stopGame();
        if (isWon) {
            gameBtn.innerHTML = "Играть";
            gameBtn.setAttribute("data-action", "start");
        }
    } else {
        let isStartGame = newGame();
        if (isStartGame) {
            gameBtn.innerHTML = "Закончить игру";
            gameBtn.setAttribute("data-action", "stop");
            level = 1;
            activatedLine();
        }
    }
}

function activatedLine() {
    let gameBlocks = document.querySelectorAll(".line:last-child .gameBlock");
    gameBlocks.forEach((elem, i) => {
        setTimeout(() => {
            elem.classList.add("active");
            elem.setAttribute("data-step", i + 1);
            elem.addEventListener("click", makeStep);
        }, 50 * i);
    });
}

function cleanArea() {
    let gameArea = document.querySelector('.gameArea');
    gameArea.innerHTML = `<div class="line">
        <div class="gameBlock "></div>
        <div class="gameBlock "></div>
        <div class="gameBlock"></div>
        <div class="gameBlock"></div>
        <div class="gameBlock"></div>
        <div class="coef grayText"> x 1.20</div>
    </div>`;
}

async function makeStep(event) {
    let block = event.target;
    let lines = document.querySelectorAll('.line');
    let line = lines.length;
    let step = block.getAttribute("data-step");
    let response = await sendRequest("game_step", "POST", {
        "username": username,
        "game_id": game_id,
        "line": line,
        "step": step
    });
    if (response.error) {
        alert(response.message);
        return false;
    } else {
        showLine(response.bomb1, response.bomb2, response.bomb3);
        if (response.win) {
            setTimeout(() => {
                newLine(response.cf);
                activatedLine();
            }, 300);
        } else {
            alert("You have lost");
            let gameBtn = document.querySelector('#gameButton');
            gameBtn.setAttribute("disabled", true);
            setTimeout(() => {
                cleanArea();
                gameBtn.innerHTML = "Играть";
                gameBtn.setAttribute("data-action", "start");
                gameBtn.removeAttribute("disabled");
            }, 2000);
        }
        return true;
    }
}

function showLine(b1, b2, b3) {
    let gameBlocks = document.querySelectorAll(".line:last-child .gameBlock.active");
    gameBlocks.forEach((elem, i) => {
        if (i + 1 == b1 || i + 1 == b2 || i + 1 == b3) {
            elem.className = "gameBlock skeleton";
        } else {
            elem.className = "gameBlock diamond";
        }
    });
}

function newLine(cf) {
    let gameArea = document.querySelector(".gameArea");
    gameArea.innerHTML += `<div class="line">
        <div class="gameBlock "></div>
        <div class="gameBlock "></div>
        <div class="gameBlock"></div>
        <div class="gameBlock"></div>
        <div class="gameBlock"></div>
        <div class="coef grayText"> ${cf} </div>
    </div>`;
}
