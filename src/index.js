import { Vec } from "./utils.js"
import { moveRectCollideMovingRect, rectRectOverlap } from "./collisions.js"

import keyHandler from "./keyhandler.js"

keyHandler.setKeyBindings({
    //"moveUp": ["KeyW", "ArrowUp"],
    //"moveDown": ["KeyS", "ArrowDown"],
    "moveLeft": ["KeyA", "ArrowLeft"],
    "moveRight": ["KeyD", "ArrowRight"],
    'jump': ['Space'],
    "throw": ["MouseLeft"],
})

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

let templateLevel = {
    eyePositions: [],
    platforms: [],
    backgroundSRC: "",
    features: []
}
let templatePlatform = {
    src: "",

    pos: { x: 300, y: 300 },
    vel: { x: 0, y: 0 },
    size: { x: 100, y: 60 },
}

let platforms = [ 
    templatePlatform 
]

let level;

const COYOTE_TIME = 5

const JUMP_VEL = 300

const AIR_FRICTION = 0.8
const GROUND_FRICTION = 0.95

const GRAVITY_ACCEL = 200
const MOVE_ACCEL = 200

let player = {
    pos: { x: 300, y: 200 }, // CENTER
    vel: { x: 0, y: 0 },
    size: { x: 35, y: 55 },

    jumpTime: 0, // stores coyote time

    frame: 0,
    maxFrames: 5,
}

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

    render()
}

function render() {
    renderBG()

    fillRect(player.pos.x - player.size.x/2, player.pos.y - player.size.y/2, 
        player.size.x, player.size.y)

    for (const platform of platforms) {
        fillRect(platform.pos.x - platform.size.x/2, platform.pos.y - platform.size.y/2, 
            platform.size.x, platform.size.y)
    }
}


function updatePlayer(dt) {
    // check if grounded (check collision rect below player)
    const groundedHitboxPos = Vec.copy(player.pos)
    groundedHitboxPos.y += player.size.y/2 + 1

    const grounded = platforms.some(platform => rectRectOverlap(
        groundedHitboxPos, { x: player.size.x - 2, y: 1 }, 
        platform.pos, platform.size)
    )

    if (grounded) player.jumpTime = COYOTE_TIME;

    // apply impulses/update velocity

    // moving 
    let moveX = 0;
    if (keyHandler.keyStates.has('moveLeft')) moveX--;
    if (keyHandler.keyStates.has('moveRight')) moveX++; 

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
    if (!grounded) player.vel.y += GRAVITY_ACCEL * dt

    // friction
    player.vel = Vec.scale(player.vel, Math.pow(1 - (grounded? GROUND_FRICTION : AIR_FRICTION), dt))

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
    if (platforms.some(platform => rectRectOverlap(player.pos, player.size, platform.pos, platform.size))) {
        // kill player
    }
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
window.addEventListener("resize", sizeCvs)


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

export { fillRect, setFont, drawText, drawImage };