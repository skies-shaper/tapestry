// import keyHandler from "./keyhandler"

const gameScreenCvs = document.getElementById("gamescreen")
const canvas = gameScreenCvs.getContext("2d")

let gameConsts = {
    width: 800,
    height: 450,
    scale: 1
}
let mouseX, mouseY;

gameScreenCvs.addEventListener("mousemove", (event) => {
    mouseX = event.offsetX / gameConsts.scale
    mouseY = event.offsetY / gameConsts.scale
})

const TPS = 30
const TIME_PER_TICK = 1000 / TPS
const MAX_TIME_BT_TICKS = TIME_PER_TICK * 2 - 3;

let time = 0;
let _stopGameLoop = false;
let _realTPSCounter = 0;
let realTPS = 0;

let totalTicks = 0;

_gameLoop()
countTPS()

function _gameLoop() {
    if (_stopGameLoop) return;

    let DELTA_TIME = (Date.now() - time);
    if (DELTA_TIME > MAX_TIME_BT_TICKS) DELTA_TIME = MAX_TIME_BT_TICKS;
    time = Date.now();

    _realTPSCounter++;
    totalTicks++;
    update(DELTA_TIME / 1000);

    const updateTime = (Date.now() - time);
    setTimeout(_gameLoop, (TIME_PER_TICK - updateTime - 4));
}

function countTPS() {
    return setInterval(() => {
        realTPS = _realTPSCounter;
        _realTPSCounter = 0;
    }, 1000)
}

function update(dt) {
    renderBG()
}

let templateLevel = {
    eyePositions: [],
    platforms: [],
    backgroundSRC: "",
    features: []
}
let templatePlatform = {
    src: "",
    width: 0,
    height: 0,
    x: 0,
    y: 0
}
let level
function render() {

}

function updatePhysics() { }
function playerPhysics() {
    //gravity
    //move based on keys?
    //check collision against each platform (use templatePlatform's values for the thingies)


}

function tape() {

}

function renderBG() {
    canvas.fillStyle = "blue"
    fillRect(0, 0, 1000, 450)
    canvas.fillStyle = "black"

    fillRect(50, 50, 35, 55)
    //render background of
    //
}

function renderHUD() { }
function renderWorld() {
    for (let i = 0; i < level.eyePositions.length; i++) {
        //draw eye based on i's value
    }
    for (let i = 0; i < level.platforms.length; i++) {
        //draw image
    }
}

sizeCvs()
window.onresize = sizeCvs

let player = {
    x: 0,
    y: 0,
    frame: 0,
    maxFrames: 5,
    width: 35,
    height: 55
}


function sizeCvs() {
    if (window.innerWidth < (window.innerHeight / 450) * 800) {
        gameConsts.width = window.innerWidth
        gameConsts.height = (window.innerWidth / 800) * 450
        gameConsts.scale = window.innerWidth / 800
        gameScreenCvs.height = gameConsts.height * window.devicePixelRatio
        gameScreenCvs.width = gameConsts.width * window.devicePixelRatio
        gameScreenCvs.style.height = gameConsts.height + "px"
        gameScreenCvs.style.width = gameConsts.width + "px"
    }
    else {
        gameConsts.width = (window.innerHeight / 450) * 800
        gameConsts.height = window.innerHeight
        gameConsts.scale = window.innerHeight / 450
        gameScreenCvs.height = gameConsts.height * window.devicePixelRatio
        gameScreenCvs.width = gameConsts.width * window.devicePixelRatio
        gameScreenCvs.style.height = gameConsts.height + "px"
        gameScreenCvs.style.width = gameConsts.width + "px"
    }
}

function fillRect(x, y, w, h) {
    canvas.fillRect(x * gameConsts.scale, y * gameConsts.scale, w * gameConsts.scale, h * gameConsts.scale)
}

function setFont(font) {
    canvas.font = font.substring(0, font.indexOf("p")) * gameConsts.scale + "px Verdana"
}

function drawText(str, x, y, maxWidth) {
    if (typeof maxWidth == 'undefined') {
        canvas.fillText(str, x * gameConsts.scale, y * gameConsts.scale)
    }
    canvas.fillText(str, x * gameConsts.scale, y * gameConsts.scale, maxWidth * gameConsts.scale)
}
function drawImage(x, y, w, h, src, round) {
    if (typeof src === "undefined") {
        return
    }
    if (typeof round !== "undefined") {
        try {
            screen.drawImage(document.getElementById(src), Math.floor(x * gameConsts.scale), Math.floor(y * gameConsts.scale), Math.ceil(w * gameConsts.scale), Math.ceil(h * gameConsts.scale))
        }
        catch (e) {
            console.log("Image source not found: " + src)
        }
        return;
    }
    try {
        screen.drawImage(document.getElementById(src), x * gameConsts.scale, y * gameConsts.scale, w * gameConsts.scale, h * gameConsts.scale)
    }
    catch (e) {
        console.log("Image source not found: " + src + e.stack)
    }
}
let buttonEvents = {}
let buttonignoresignals = {}

function addButton(id, src, x, y, w, h, callback, options) {

    if (buttonEvents.indexOf(id) == -1) {
        buttonignoresignals[id] = false

        buttonEvents.push(id)
        document.getElementById("gamewindow").addEventListener("mouseup", () => {
            if (buttonignoresignals[id]) {
                buttonignoresignals[id] = false
                return
            }
            if (mouseInArea(x, y, (x + w), (y + h))) {
                callback()
            }
            buttonEvents.splice(buttonEvents.indexOf(id), 1)

        }, { once: true })

    }

    if (mouseInArea(x, y, (x + w), (y + h))) {
        screen.filter = "brightness(140%)"
    }

    drawImage(x, y, w, h, src)
    screen.filter = "none"
}

function mouseInArea(sX, sY, eX, eY) {
    return (mouseX > sX && mouseX < eX && mouseY > sY && mouseY < eY)
}
