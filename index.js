// import keyHandler from "./keyhandler"


let player = {
    x: 200,
    y: 200,
    frame: 0,
    width: 35,
    height: 55,
    moving: false,
    animation: [
        "Jelli-1",
        "Jelli-2",
        "Jelli-3",
        "Jelli-2",
        "Jelli-1",
        "Jelli-4",
        "Jelli-5",
        "Jelli-4",
    ],
    idle_animation: [
        "Jelli-1",
        "Jelli-1",
        "Jelli-1",
        "Jelli-idle",
        "Jelli-idle",
        "Jelli-idle"


    ]
}
const gameScreenCvs = document.getElementById("gamescreen")
const canvas = gameScreenCvs.getContext("2d")

let gameConsts = {
    width: 800,
    height: 450,
    scale: 1
}
let mouseX, mouseY;

let tape = {
    launched: false,
    x: 0,
    y: 0,
    vX: 0,
    vY: 0,
    theta: 0,
    particles: [],
}

window.addEventListener("mousedown", (e) => {
    if (!tape.launched) {

        tape.launched = true
        tape.theta = tape.theta * -1
        console.log(Math.cos(tape.theta))
        tape.vX = Math.cos(tape.theta) * 15
        if (tape.x + 20 < player.x + 30) {
            tape.vX = Math.cos(tape.theta) * -15

        }

        tape.vY = Math.sin(tape.theta) * -5
        if (tape.x + 20 < player.x + 30) {
            tape.vY = Math.sin(tape.theta) * 5

        }
        tape.particles.push([[player.x + 30, player.y + 30], []])
        // tape.x = player.x + 40
        // tape.y = player.y + 50
    }
})
gameScreenCvs.addEventListener("mousemove", (event) => {
    mouseX = event.offsetX / gameConsts.scale * window.devicePixelRatio
    mouseY = event.offsetY / gameConsts.scale * window.devicePixelRatio
})

const TPS = 30
const TIME_PER_TICK = 1000 / TPS
const MAX_TIME_BT_TICKS = TIME_PER_TICK * 2 - 3;

let time = 0;
let _stopGameLoop = false;
let _realTPSCounter = 0;
let realTPS = 0;

let totalTicks = 0;
let animationTicks = 0
_gameLoop()
countTPS()

function animateFrames() {
    drawImage(10, 10, "Jelli-1")
}

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
    screen.fillStyle = "white"
    fillRect(0, 0, 800, 450)
    renderBG()
    if (totalTicks % 3 == 0) {
        animationTicks++
    }
    renderObjects() //render animations etc
}

function drawTape() {
    //calculate tape position
    if (!tape.launched) {
        let circ = 175 * gameConsts.scale * 2 * Math.PI

        canvas.lineWidth = 2 * gameConsts.scale
        canvas.lineCap = "round"
        canvas.setLineDash([circ / 120, circ / 60])
        canvas.strokeStyle = "#ababab"

        canvas.beginPath()
        canvas.ellipse((player.x + 30) * gameConsts.scale, (player.y + 30) * gameConsts.scale, 100 * gameConsts.scale, 100 * gameConsts.scale, 0, 0, (2 * Math.PI))
        canvas.stroke()

        //vector from player to mouse
        //clip at 175 game units
        // draw tape there

        let xComp = (mouseX) - (player.x + 30)
        let yComp = (mouseY) - (player.y + 30)

        let unitX = xComp / Math.pow((xComp * xComp) + (yComp * yComp), .5)
        let unitY = yComp / Math.pow((xComp * xComp) + (yComp * yComp), .5)


        // canvas.beginPath()
        // canvas.moveTo((player.x + 30) * gameConsts.scale, (player.y + 30) * gameConsts.scale)
        // canvas.lineTo((175 * unitX + player.x + 30) * gameConsts.scale, (175 * unitY + player.y + 30) * gameConsts.scale)
        // canvas.stroke()
        tape.x = (100 * unitX + player.x + 30) - 20
        tape.y = (100 * unitY + player.y + 30) - 20
        tape.theta = Math.atan(unitY / unitX)
    } else {
        tape.particles[tape.particles.length - 1][1][0] = tape.x + 10
        tape.particles[tape.particles.length - 1][1][1] = tape.y + 25
        tape.x += tape.vX
        tape.y += tape.vY
        tape.vY += 0.5
        if (tape.y >= 450) {
            tape.launched = false
        }
    }
    drawImage(tape.x, tape.y, 40, 40, "tape")
    //tape collision

    for (let i = 0; i < tape.particles.length; i++) {
        canvas.lineCap = "square"
        canvas.setLineDash([])
        canvas.lineWidth = 20 * gameConsts.scale
        canvas.beginPath()
        canvas.moveTo(tape.particles[i][0][0] * gameConsts.scale, tape.particles[i][0][1] * gameConsts.scale)
        canvas.lineTo(tape.particles[i][1][0] * gameConsts.scale, tape.particles[i][1][1] * gameConsts.scale)
        canvas.stroke()
    }




}

function renderObjects() {

    drawTape()

    // drawImage(100, 100, 100, 100, "Tentacles-" + (animationTicks % 7))
    // drawImage(200, 100, 100, 100, "Tentacles-" + (animationTicks % 7))
    if (player.moving) {
        drawImage(player.x, player.y, 60, 60, player.animation[animationTicks % player.animation.length])

    }
    if (!player.moving) {
        drawImage(player.x, player.y, 60, 60, player.idle_animation[animationTicks % player.idle_animation.length])
    }
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

function sizeCvs() {
    if (window.innerWidth < (window.innerHeight / 450) * 800) {
        gameConsts.width = window.innerWidth
        gameConsts.height = (window.innerWidth / 800) * 450
        gameConsts.scale = window.innerWidth / 800 * window.devicePixelRatio
        gameScreenCvs.height = gameConsts.height * window.devicePixelRatio
        gameScreenCvs.width = gameConsts.width * window.devicePixelRatio
        gameScreenCvs.style.height = gameConsts.height + "px"
        gameScreenCvs.style.width = gameConsts.width + "px"
    }
    else {
        gameConsts.width = (window.innerHeight / 450) * 800
        gameConsts.height = window.innerHeight
        gameConsts.scale = window.innerHeight / 450 * window.devicePixelRatio
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
function drawImage(x, y, w, h, src) {
    if (typeof src === "undefined") {
        return
    }
    try {
        const i = document.getElementById(src)
        canvas.drawImage(i, Math.floor(x * gameConsts.scale), Math.floor(y * gameConsts.scale), Math.ceil(w * gameConsts.scale), Math.ceil(h * gameConsts.scale))
    }
    catch (e) {
        console.log("Image source not found: " + src)
    }
    return;
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
