import { Vec } from "./utils.js"
import { moveRectCollideMovingRect, rectRectOverlaps, rectCircleOverlaps } from "./collisions.js"

import keyHandler from "./keyhandler.js"

keyHandler.setKeyBindings({
    //"moveUp": ["KeyW", "ArrowUp"],
    //"moveDown": ["KeyS", "ArrowDown"],
    "moveLeft": ["KeyA", "ArrowLeft"],
    "moveRight": ["KeyD", "ArrowRight"],
    'jump': ['Space', 'ArrowUp', 'KeyW'],
})
let WON = false

let inGameplay = false
const gameScreenCvs = document.getElementById("gamescreen")
const canvas = gameScreenCvs.getContext("2d")

let buttonEvents = []
let buttonignoresignals = {}
let gameConsts = {
    width: 800,
    height: 450,
    scale: 1
}
let mouseX = 400
let mouseY = 400
const HOWLER_POS_SCALE = 0.02

const footstepSFX = new Howl({
    src: ['/public/footstep.wav'],
    volume: 0.5,
})
const tapeRip = new Howl({
    src: ['/public/tape-rip.m4a'],
    volume: 10,
})

const landSFX = new Howl({
    src: ['/public/land.wav'],
    volume: 1.5,
})

const musicLoop = new Howl({
    src: ['/public/ost-loop.mp3'],
    volume: 0.4,
    loop: true,
    html: true
})

const howlBg = new Howl({
    src: ['/public/howl-bg.mp3'],
    volume: 0.1,
    loop: true,
    html: true
})

const musicStart = new Howl({
    src: ['/public/ost-start.mp3'],
    volume: 0.4,
    html: true,
    onend: () => {
        musicLoop.play();
        howlBg.play();
    }
})

musicStart.play()

let tape = {
    launched: false,
    x: 0,
    y: 0,
    vX: 0,
    vY: 0,
    theta: 0,
    radius: 20,
    particles: []
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

let platformTypes = {
    large1: 0,
    large2: 1,
    thin: 2
}
// // setFont("20px Lacquer")
// console.log(canvas.measureText("Cover up all of the ").width / gameConsts.scale)

function platform(src, px, py) {
    if (src == platformTypes.large2)
        return {
            src: "platform-rock-large-2",
            pos: { x: px, y: py },
            vel: { x: 0, y: 0 },
            size: { x: 165, y: 65 },
            imgSize: { x: 175, y: 75 }
        }
    if (src == platformTypes.large1) {
        return {
            src: "platform-rock-large-1",
            pos: { x: px, y: py },
            vel: { x: 0, y: 0 },
            size: { x: 165, y: 65 },
            imgSize: { x: 175, y: 75 }
        }
    }
    if (src == platformTypes.thin) {
        return {
            src: "platform-rock-small",
            pos: { x: px, y: py },
            vel: { x: 0, y: 0 },
            size: { x: 165, y: 25 },
            imgSize: { x: 175, y: 30 }
        }
    }
}

let templateLevel = {
    eyePositions: [[200, 200, 0, true], [150, 100, 3, true]],
    platforms: [
        platform(platformTypes.large1, 75, 425),
        platform(platformTypes.large2, 225, 425),
        platform(platformTypes.large1, 375, 425),
        platform(platformTypes.large1, 650, 425),
        platform(platformTypes.large2, 800, 425),
        platform(platformTypes.large1, 800, 360),
        platform(platformTypes.large1, 850, 305),
    ],
    tentacleTraps: [
        [430, 380],
        [500, 380]
    ],
    backgroundSRC: "",
    features: [],
    respawnPosition: [50, 250],
    blockerY: 200,
    initialBlockerY: 200,
    blocked: false,
    text: [
        [250, 100, "Welcome to Tapestry!", "#897e61", 30],
        [250, 130, "Move your mouse to aim your tape!", "#897e61", 20],
        [250, 150, "Click to throw it", "#897e61", 20],
        [250, 170, "Cover up all of the ", "#897e61", 20],
        [450, 170, "Forest Beast's Eyes", "#d005bf", 20],
        [250, 190, "in order to be freed from each level", "#897e61", 20],
    ]

}
let templateLevel2 = {
    eyePositions: [[300, 200, 0, true], [600, 100, 3, true]],
    platforms: [
        platform(platformTypes.large1, 75, 425),
        platform(platformTypes.large2, 225, 425),
        platform(platformTypes.large1, 375, 425),
        platform(platformTypes.large1, 650, 425),
        platform(platformTypes.large2, 800, 425),
        platform(platformTypes.large1, 800, 360),
        platform(platformTypes.large1, 850, 305),
        platform(platformTypes.thin, 75, 0),
        platform(platformTypes.thin, 225, 0),
        platform(platformTypes.thin, 375, 0),
        platform(platformTypes.thin, 500, 0),
        platform(platformTypes.thin, 650, 0),
        platform(platformTypes.thin, 800, 0),

        platform(platformTypes.large1, 850, 150),
        platform(platformTypes.large2, 850, 90),
        platform(platformTypes.large1, 850, 30)

    ],
    tentacleTraps: [
        [430, 380],
        [500, 380]
    ],
    text: [
        [250, 100, "Hold-click to swing with your tape!", "#897e61", 30],
    ],
    backgroundSRC: "",
    features: [],
    respawnPosition: [50, 250],
    blockerY: 200,
    initialBlockerY: 200,
    blocked: false
}

let platforms = [
    templatePlatform
]

let levelStorage = [
    templateLevel, templateLevel2
]

let level = {
    ID: 0,
    backgroundOffset: 0,
    numMaskedEyes: 0,
    data: {},
    blocked: true
};

const COYOTE_TIME = 5

const JUMP_VEL = 500

const AIR_FRICTION = 0.8
const GROUND_FRICTION = 0.95

const GRAVITY_ACCEL = 900
const GRAVITY_DOWNWARDS_ACCEL = 600
const GROUND_MOVE_ACCEL = 200
const AIR_MOVE_ACCEL = 300

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


    ],
    grounded: false
}
window.addEventListener("mousedown", (e) => {
    if (!tape.launched && inGameplay) {

        tape.launched = true
        tapeRip.pos(tape.x, tape.y)
        tapeRip.play()
        // tape.theta = tape.theta * -1
        // tape.vX = Math.cos(tape.theta) * 20
        // if (tape.x + 20 < player.pos.x + 30) {
        //     tape.vX = Math.cos(tape.theta) * -20

        // }

        // tape.vY = Math.sin(tape.theta) * -10
        // if (tape.x + 20 < player.pos.x + 30) {
        //     tape.vY = Math.sin(tape.theta) * 10
        // }
        tape.particles.push([[player.pos.x + 10, player.pos.y + 10], []])
        // tape.x = player.pos.x + 40
        // tape.y = player.pos.y + 50
    }
})
_gameLoop()
countTPS()



gameScreenCvs.addEventListener("mousemove", (event) => {
    mouseX = event.offsetX / gameConsts.scale * window.devicePixelRatio
    mouseY = event.offsetY / gameConsts.scale * window.devicePixelRatio
})

function initGame() {
    nextLevel()
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
        //console.debug(realTPS)
        _realTPSCounter = 0;
    }, 1000)
}

function update(dt) {

    if (Howler.ctx && Howler.ctx.state === 'running') { // configure sound listener
        Howler.orientation(0, 0, 1, 0, -1, 0); // flip y to make +y down
        Howler.pos(gameConsts.width / 2 * HOWLER_POS_SCALE, gameConsts.height / 2 * HOWLER_POS_SCALE, -5)
    }
    if (WON) {
        drawImage(0 - 350 * (Math.sin(totalTicks / 700) + 1), 0, 1600, 450, "BG")
        drawImage(0, 0, 800, 400, "title")
        setFont("30px Lacquer")
        canvas.fillStyle = "#b8ab88"
        drawText("Congratulations!", 280, 250)
        drawText("You have evaded the ", 150, 300)
        canvas.fillStyle = "#d005bf"
        drawText("Forest Beast", 462, 300)
        return
    }
    if (inGameplay) {
        if (totalTicks % 3 == 0) {
            animationTicks++
        }
        canvas.fillStyle = "#ffffff"
        fillRect(0, 0, 800, 450)
        renderBG()


        renderObjects() //render animations etc
        renderWorld()

        updatePlayer(dt)
        return
    }
    // otherwise, main menu!
    drawImage(0 - 350 * (Math.sin(totalTicks / 700) + 1), 0, 1600, 450, "BG")
    drawImage(0, 0, 800, 400, "title")
    let titleEyes = [[50, 200, 0], [150, 300, 1], [400, 200, 2], [600, 200, 3], [550, 270, 4]]

    for (let i = 0; i < titleEyes.length; i++) {
        let t = titleEyes[i]
        drawImage(t[0], t[1], 100, 100, "Eye-" + t[2])
        let xComp = (mouseX) - t[0]
        let yComp = (mouseY) - t[1]

        let unitX = xComp / Math.pow((xComp * xComp) + (yComp * yComp), .5)
        let unitY = yComp / Math.pow((xComp * xComp) + (yComp * yComp), .5)

        let drawX = (10 * unitX + t[0]) + 50
        let drawY = (10 * unitY + t[1]) + 50
        canvas.fillStyle = "red"
        canvas.beginPath()
        canvas.ellipse(drawX * gameConsts.scale, drawY * gameConsts.scale, 5 * gameConsts.scale, 5 * gameConsts.scale, 0, 0, 2 * Math.PI)
        canvas.fill()
    }
    addButton("#begin", "buttons-begin", 400 - (284 / 2), (300), 285, 85, () => {
        inGameplay = true
        nextLevel()
    })

    setFont("30px Lacquer")
    canvas.fillStyle = "#b8ab88"

    let text = "A normal game about a racoon"

    drawText(text, 400 - (canvas.measureText(text).width / 2 / gameConsts.scale), 150)


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
        canvas.ellipse((player.pos.x) * gameConsts.scale, (player.pos.y) * gameConsts.scale, 100 * gameConsts.scale, 100 * gameConsts.scale, 0, 0, (2 * Math.PI))
        canvas.stroke()

        let xComp = (mouseX) - (player.pos.x)
        let yComp = (mouseY) - (player.pos.y)

        let unitX = xComp / Math.pow((xComp * xComp) + (yComp * yComp), .5)
        let unitY = yComp / Math.pow((xComp * xComp) + (yComp * yComp), .5)

        tape.x = (100 * unitX + player.pos.x) - 20
        tape.y = (100 * unitY + player.pos.y) - 20
        if (isNaN(tape.x)) {
            tape.x = (100 + player.pos.x + 30)
            tape.y = player.pos.y + 30
        }
        tape.vX = unitX * 13
        tape.vY = unitY * 13
    } else {
        tape.particles[tape.particles.length - 1][1][0] = tape.x + 20
        tape.particles[tape.particles.length - 1][1][1] = tape.y + 20
        tape.x += tape.vX
        tape.y += tape.vY
        // tape.vY += 0.5
        if (tape.y >= 450 || tape.y < -20 || tape.x < -20 || tape.y > 800) {
            tape.launched = false
        }

        const colliding = platforms.some(platform => rectCircleOverlaps(platform.pos, platform.size,
            { x: tape.x, y: tape.y }, tape.radius));

        if (colliding) {

            tape.launched = false;
        }
    }
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
    drawImage(tape.x, tape.y, 40, 40, "tape")

}


function updatePlayer(dt) {
    // console.log(player.pos.x + "," + player.pos.y)
    // console.log(level.blocked)

    player.moveState = player.moveStates.idle

    // check if grounded (check collision rect below player)
    const groundedHitboxPos = Vec.copy(player.pos)
    groundedHitboxPos.y += player.size.y / 2 + 1

    const grounded = platforms.some(platform => rectRectOverlaps(
        groundedHitboxPos, { x: player.size.x - 2, y: 1 },
        platform.pos, platform.size)
    )

    if (grounded) player.jumpTime = COYOTE_TIME;
    const prevGrounded = player.grounded;
    player.grounded = grounded;

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
    player.vel.x += moveX * (grounded ? GROUND_MOVE_ACCEL : AIR_MOVE_ACCEL) * dt;

    if (grounded && moveX != 0) { // play walk sfx
        footstepSFX.pos(groundedHitboxPos.x * HOWLER_POS_SCALE, groundedHitboxPos.y * HOWLER_POS_SCALE, 0)
        if (!footstepSFX.playing()) footstepSFX.play()
    } else {
        //footstepSFX.stop()
    }
    if (grounded && !prevGrounded && player.vel.y >= 0) { // just landed
        landSFX.pos(groundedHitboxPos.x * HOWLER_POS_SCALE, groundedHitboxPos.y * HOWLER_POS_SCALE, 0)

        landSFX.play()
    }
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
        if (player.vel.y > 0) player.vel.y += GRAVITY_DOWNWARDS_ACCEL * dt
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

    if (player.pos.y > 450) {
        player.pos.x = level.data.respawnPosition[0]
        player.pos.y = level.data.respawnPosition[1]
        return
    }
    if (player.pos.x < 0) {
        player.pos.x = 0
    }

    if (player.pos.x > 760) {
        console.log("over")

        if (level.blocked) {
            console.log("stop")
            player.pos.x = 760
        }
        else {
            nextLevel()
        }
    }
    // if still colliding, player has been squished
    if (platforms.some(platform => rectRectOverlaps(player.pos, player.size, platform.pos, platform.size))) {
        // kill player
    }
}


function renderBG() {
    //get random 
    //render background of
    //
    drawImage(0 - level.backgroundOffset, 0, 1600, 450, "BG")
    applyVignette()

    let numMaskedEyes = 0
    if (level.data.eyePositions != undefined) {
        for (let i = 0; i < level.data.eyePositions.length; i++) {
            let t = level.data.eyePositions[i]
            if (t[3]) {
                numMaskedEyes++
            }
            drawImage(t[0], t[1], 100, 100, "Eye-" + (t[3] ? "" : "faded-") + t[2])
            let xComp = (player.pos.x) - t[0]
            let yComp = (player.pos.y) - t[1]

            let unitX = xComp / Math.pow((xComp * xComp) + (yComp * yComp), .5)
            let unitY = yComp / Math.pow((xComp * xComp) + (yComp * yComp), .5)

            let drawX = (10 * unitX + t[0]) + 50
            let drawY = (10 * unitY + t[1]) + 50

            for (let j = 0; j < tape.particles.length; j++) {

                if (tape.particles[j] === undefined || tape.particles[j][1].length < 1) {
                    continue
                }

                let p = tape.particles[j]

                if (lineCircleIntersect(p, [t[0] + 50, t[1] + 50, 30])) {
                    t[3] = false
                }
            }

            canvas.fillStyle = "red"
            if (t[3]) {
                canvas.beginPath()
                canvas.ellipse(drawX * gameConsts.scale, drawY * gameConsts.scale, 5 * gameConsts.scale, 5 * gameConsts.scale, 0, 0, 2 * Math.PI)
                canvas.fill()
            }

        }
        level.numMaskedEyes = numMaskedEyes
    }
    else {
        console.log(level)
    }

}


function renderHUD() { }
function renderWorld() {
    if (level.data.tentacleTraps != undefined) {
        for (let i = 0; i < level.data.tentacleTraps.length; i++) {
            let t = level.data.tentacleTraps
            drawImage(t[i][0], t[i][1], 70, 70, "Tentacles-" + (animationTicks % 5))
        }
    }
    drawImage(775, level.data.blockerY, 25, 75, "Door-" + (animationTicks % 5))

    for (let i = 0; i < platforms.length; i++) {

        let p = platforms[i]
        drawImage(
            p.pos.x - p.imgSize.x / 2,
            p.pos.y - p.imgSize.y / 2,
            platforms[i].imgSize.x,
            platforms[i].imgSize.y,
            platforms[i].src)
    }
    if (level.numMaskedEyes == 0) {
        level.data.blockerY += 2
    }
    if (level.data.blockerY - level.data.initialBlockerY > 75) {
        level.blocked = false
    }
}
function nextLevel() {
    if (level.ID >= levelStorage.length) {
        WON = true
        return
    }
    console.log(":DD")
    level.data = levelStorage[level.ID]
    level.backgroundOffset = Math.floor(Math.random() * 800)
    platforms = level.data.platforms
    console.log(level)
    level.ID++
    player.pos.x = level.data.respawnPosition[0]
    player.pos.y = level.data.respawnPosition[1]
    level.numMaskedEyes = level.data.eyePositions.length
    tape.particles = []
    level.blocked = true
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
function renderObjects() {

    drawTape()
    if (level.data.text != undefined) {
        for (let i = 0; i < level.data.text.length; i++) {
            let t = level.data.text[i]
            canvas.fillStyle = t[3]
            setFont(t[4] + "px Lacquer")
            drawText(t[2], t[0], t[1])

        }
    }
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
        gameScreenCvs.addEventListener("mouseup", () => {
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
    canvas.font = font.substring(0, font.indexOf("p")) * gameConsts.scale + "px Lacquer"
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

function lineCircleIntersect(line, circle) {
    // MANY THANKS to https://stackoverflow.com/questions/1073336/circle-line-segment-collision-detection-algorithm#1084899
    // (copied from there and modified to use JS)

    //line == [[ax, ay],[bx,by]]
    //circle == [x,y,r]
    let d = { x: line[1][0] - line[0][0], y: line[1][1] - line[0][1] }
    let f = { x: line[0][0] - circle[0], y: line[0][1] - circle[1] }

    let a = Vec.dot(d, d);
    let b = 2 * Vec.dot(d, f);
    let c = Vec.dot(f, f) - circle[2] * circle[2];

    let discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
        return false
        // no intersection
    }
    else {
        // ray didn't totally miss sphere,
        // so there is a solution to
        // the equation.

        discriminant = Math.sqrt(discriminant);

        // either solution may be on or off the ray so need to test both
        // t1 is always the smaller value, because BOTH discriminant and
        // a are nonnegative.
        let t1 = (-b - discriminant) / (2 * a);
        let t2 = (-b + discriminant) / (2 * a);

        // 3x HIT cases:
        //          -o->             --|-->  |            |  --|->
        // Impale(t1 hit,t2 hit), Poke(t1 hit,t2>1), ExitWound(t1<0, t2 hit), 

        // 3x MISS cases:
        //       ->  o                     o ->              | -> |
        // FallShort (t1>1,t2>1), Past (t1<0,t2<0), CompletelyInside(t1<0, t2>1)

        if (t1 >= 0 && t1 <= 1) {
            // t1 is the intersection, and it's closer than t2
            // (since t1 uses -b - discriminant)
            // Impale, Poke
            return true;
        }

        // here t1 didn't intersect so we are either started
        // inside the sphere or completely past it
        if (t2 >= 0 && t2 <= 1) {
            // ExitWound
            return true;
        }

        // no intn: FallShort, Past, CompletelyInside
        return false;
    }
}
function applyVignette() {
    // radial gradient centered at canvas center
    var gradient = canvas.createRadialGradient(
        400 * gameConsts.scale, 400 * gameConsts.scale, 0,  // Inner circle (center, radius 0)
        400 * gameConsts.scale, 400 * gameConsts.scale, Math.max(800 * gameConsts.scale, 400 * gameConsts.scale) / 2
        // Outer circle (center, radius half of max dimension)
    );

    // color stops for the gradient
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); // center: fully transparent

    gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0)'); // inner area: fully transparent
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)'); // edges: semi-transparent dark color

    // 4. Apply the gradient
    canvas.fillStyle = gradient;
    fillRect(0, 0, 800, 400);
}

export { fillRect, setFont, drawText, drawImage };
