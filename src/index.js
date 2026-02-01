import { Vec } from "./utils.js"
import { moveRectCollideMovingRect, rectRectOverlaps, rectCircleOverlaps } from "./collisions.js"

import keyHandler from "./keyhandler.js"

keyHandler.setKeyBindings({
    //"moveUp": ["KeyW", "ArrowUp"],
    //"moveDown": ["KeyS", "ArrowDown"],
    "moveLeft": ["KeyA", "ArrowLeft"],
    "moveRight": ["KeyD", "ArrowRight"],
    "throw": ["MouseLeft"],
    'jump': ['Space', 'ArrowUp', 'KeyW'],
})

const gameScreenCvs = document.getElementById("gamescreen")
const canvas = gameScreenCvs.getContext("2d")

let buttonEvents = {}
let buttonignoresignals = {}
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

let tape = {
    launched: false,
    x: 0,
    y: 0,
    vX: 0,
    vY: 0,
    theta: 0,
    particles: [],
    radius: 20,
}

const TPS = 30
const TIME_PER_TICK = 1000 / TPS
const MAX_TIME_BT_TICKS = TIME_PER_TICK * 2 - 3;

let time = 0;
let _stopGameLoop = false;
let _realTPSCounter = 0;
let realTPS = 0;

let totalTicks = 0;

let animationTicks = 0
let templatePlatform = {
    src: "platform-rock-large-2",
    pos: { x: 300, y: 300 },
    vel: { x: 0, y: 0 },
    size: { x: 165, y: 65 },
    imgSize: { x: 175, y: 75 }
}

let templateLevel = {
    eyePositions: [[200, 200, 0], [150, 100, 3]],
    platforms: [templatePlatform],
    backgroundSRC: "",
    features: []
}

let platforms = [
    templatePlatform
]

let levelStorage = [
    templateLevel
]

let level = {
    ID: 0,
    backgroundOffset: 0,
    data: {}
};

const COYOTE_TIME = 5

const JUMP_VEL = 400

const AIR_FRICTION = 0.8
const GROUND_FRICTION = 0.95

const GRAVITY_ACCEL = 900
const MOVE_ACCEL = 200

let player = {
    direction: 1,

    pos: { x: 300, y: 200 }, // CENTER
    vel: { x: 0, y: 0 },
    size: { x: 35, y: 55 },

    jumpTime: 0, // stores coyote time

    frame: 0,
    maxFrames: 5,

    frame: 0,
    width: 35,
    height: 55,
    moveState: 0,
    moveStates: {
        idle: 0,
        moving: 1,
        slide: 2,
        jump: 3
    },
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

window.addEventListener("mousedown", (e) => {
    if (!tape.launched) {

        tape.launched = true
        tape.theta = tape.theta * -1
        tape.vX = Math.cos(tape.theta) * 15
        if (tape.x + 20 < player.pos.x + 30) {
            tape.vX = Math.cos(tape.theta) * -15

        }

        tape.vY = Math.sin(tape.theta) * -5
        if (tape.x + 20 < player.pos.x + 30) {
            tape.vY = Math.sin(tape.theta) * 5
        }
        tape.particles.push([[player.pos.x + 30, player.pos.y + 30], []])
        // tape.x = player.pos.x + 40
        // tape.y = player.pos.y + 50
    }
})
_gameLoop()
countTPS()


initGame()

gameScreenCvs.addEventListener("mousemove", (event) => {
    mouseX = event.offsetX / gameConsts.scale * window.devicePixelRatio
    mouseY = event.offsetY / gameConsts.scale * window.devicePixelRatio
})

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
        //console.debug(realTPS)
        _realTPSCounter = 0;
    }, 1000)
}

function update(dt) {
    updatePlayer(dt)

    renderBG()
    if (totalTicks % 3 == 0) {
        animationTicks++
    }
    canvas.fillStyle = "#ffffff"
    fillRect(0, 0, 800, 450)
    renderBG()

    renderObjects() //render animations etc
    renderWorld()

    updatePlayer(dt)
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
        canvas.ellipse((player.pos.x + 30) * gameConsts.scale, (player.pos.y + 30) * gameConsts.scale, 100 * gameConsts.scale, 100 * gameConsts.scale, 0, 0, (2 * Math.PI))
        canvas.stroke()

        //vector from player to mouse
        //clip at 175 game units
        // draw tape there

        let xComp = (mouseX) - (player.pos.x + 30)
        let yComp = (mouseY) - (player.pos.y + 30)

        let unitX = xComp / Math.pow((xComp * xComp) + (yComp * yComp), .5)
        let unitY = yComp / Math.pow((xComp * xComp) + (yComp * yComp), .5)

        tape.x = (100 * unitX + player.pos.x + 30) - 20
        tape.y = (100 * unitY + player.pos.y + 30) - 20
        if (isNaN(tape.x)) {
            tape.x = (100 + player.pos.x + 30) - 20
            tape.y = player.pos.y + 30 - 20
        }
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

        // COLLISION

        const colliding = platforms.some(platform => rectCircleOverlaps(platform.pos, platform.size, 
            { x: tape.x, y: tape.y }, tape.radius));

        if (colliding) {
            tape.launched = false;
        }
    }
    drawImage(tape.x, tape.y, 40, 40, "tape")
    //tape collision
    canvas.strokeStyle = "#b8ab88"

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

function updatePlayer(dt) {

    player.moveState = player.moveStates.idle

    // check if grounded (check collision rect below player)
    const groundedHitboxPos = Vec.copy(player.pos)
    groundedHitboxPos.y += player.size.y / 2 + 1

    const grounded = platforms.some(platform => rectRectOverlaps(
        groundedHitboxPos, { x: player.size.x - 2, y: 1 },
        platform.pos, platform.size)
    )

    if (grounded) player.jumpTime = COYOTE_TIME;

    // apply impulses/update velocity

    // moving 
    let moveX = 0;

    if (Math.abs(player.vel.x) > 20) {
        player.moveState = player.moveStates.slide
    }

    if (keyHandler.keyStates.has('moveLeft')) {
        moveX -= 2
        player.moveState = player.moveStates.moving
        player.direction = -1

    }
    if (keyHandler.keyStates.has('moveRight')) {
        moveX += 2
        player.moveState = player.moveStates.moving
        player.direction = 1

    }

    player.vel.x += moveX * MOVE_ACCEL * dt;

    // jumping
    if (player.jumpTime > 0) {
        player.jumpTime -= dt;

        if (keyHandler.keyStates.has('jump')) {
            player.jumpTime = 0;

            player.vel.y -= JUMP_VEL;
        }
    }

    // gravity
    if (!grounded) {
        player.moveState = player.moveStates.jump

        player.vel.y += GRAVITY_ACCEL * dt
    }

    // friction
    player.vel = Vec.scale(player.vel, Math.pow(1 - (grounded ? GROUND_FRICTION : AIR_FRICTION), dt))

    // update position, handling collisions
    let dPos = Vec.scale(player.vel, dt);

    for (const platform of platforms) {
        const [nPos, collided] = moveRectCollideMovingRect(
            player.pos, dPos, player.size, 
            platform.pos, platform.vel, platform.size
        )

        dPos = Vec.sub(nPos, player.pos)

        // set velocity to zero if collided
        if (collided.x) player.vel.x = 0;
        if (collided.y) player.vel.y = 0;
    }

    player.pos = Vec.add(player.pos, dPos);

    // if still colliding, player has been squished
    if (platforms.some(platform => rectRectOverlaps(player.pos, player.size, platform.pos, platform.size))) {
        // kill player
    }
}



function renderBG() {
    //get random 
    //render background of
    //
    drawImage(0, 0, 800 + level.backgroundOffset, 450, "BG")

    if (level.data.eyePositions != undefined) {
        console.log("eyes")
        for (let i = 0; i < level.data.eyePositions.length; i++) {
            let t = level.data.eyePositions[i]
            drawImage(t[0], t[1], 100, 100, "Eye-" + t[2])
            let xComp = (player.pos.x) - t[0]
            let yComp = (player.pos.y) - t[1]

            let unitX = xComp / Math.pow((xComp * xComp) + (yComp * yComp), .5)
            let unitY = yComp / Math.pow((xComp * xComp) + (yComp * yComp), .5)

            let drawX = (10 * unitX + t[0]) + 50
            let drawY = (10 * unitY + t[1]) + 50

            canvas.fillStyle = "red"
            canvas.beginPath()
            canvas.ellipse(drawX * gameConsts.scale, drawY * gameConsts.scale, 5 * gameConsts.scale, 5 * gameConsts.scale, 0, 0, 2 * Math.PI)
            canvas.fill()
        }
    }
    else {
        console.log(level)
    }
}


function renderHUD() { }
function renderWorld() {

    // for (let i = 0; i < level.eyePositions.length; i++) {
    //     //draw eye based on i's value
    // }
    for (let i = 0; i < platforms.length; i++) {

        let p = platforms[i]
        // canvas.fillStyle = "blue"
        // fillRect(p.pos.x - p.size.x / 2, p.pos.y - p.size.y / 2, p.size.x, p.size.y)

        drawImage(
            p.pos.x - p.imgSize.x / 2,
            p.pos.y - p.imgSize.y / 2,
            platforms[i].imgSize.x,
            platforms[i].imgSize.y,
            platforms[i].src)
    }
}
function nextLevel() {
    level.data = levelStorage[level.ID]
    level.backgroundOffset = Math.floor(Math.random() * 800)
    platforms = level.data.platforms
    console.log(level)
    level.ID++

}

sizeCvs()

window.addEventListener("resize", sizeCvs)


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

function renderObjects() {

    drawTape()

    // drawImage(100, 100, 100, 100, "Tentacles-" + (animationTicks % 7))
    // drawImage(200, 100, 100, 100, "Tentacles-" + (animationTicks % 7))
    let frame
    switch (player.moveState) {
        case player.moveStates.moving:
            frame = player.animation[animationTicks % player.animation.length]
            break;
        case player.moveStates.idle:
            frame = player.idle_animation[animationTicks % player.idle_animation.length]
            break;
        case player.moveStates.slide:
            frame = "Jelli-1"

            break;
        default:
            frame = "Jelli-1"
    }
    // canvas.fillStyle = "blue"
    // fillRect(player.pos.x - player.size.x / 2, player.pos.y - player.size.y / 2, player.size.x, player.size.y)

    if (player.direction == -1) {
        canvas.save()
        canvas.scale(-1, 1)
        drawImage(0 - 60 - player.pos.x + player.size.x, player.pos.y - player.size.y / 2, 60, 60, frame)
        canvas.restore()

    } else {
        drawImage(player.pos.x - player.size.x / 2 - 5, player.pos.y - player.size.y / 2, 60, 60, frame)

    }

}


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
        canvas.filter = "brightness(140%)"
    }

    drawImage(x, y, w, h, src)
    canvas.filter = "none"
}

function mouseInArea(sX, sY, eX, eY) {
    return (mouseX > sX && mouseX < eX && mouseY > sY && mouseY < eY)
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

