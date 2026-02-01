import { Vec } from "./utils.js"
import { moveRectCollideMovingRect, rectRectOverlaps, rectCircleOverlaps } from "./collisions.js"

import keyHandler from "./keyhandler.js"

keyHandler.setKeyBindings({
    //"moveUp": ["KeyW", "ArrowUp"],
    //"moveDown": ["KeyS", "ArrowDown"],
    "moveLeft": ["KeyA", "ArrowLeft"],
    "moveRight": ["KeyD", "ArrowRight"],
    'jump': ['Space', 'ArrowUp', 'KeyW'],
    'throwTape': ['MouseLeft'],
    'reset': ["KeyR"]
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
const HOWLER_POS_SCALE = 0.01

const publicPath = filename => window.location.pathname + "public/" + filename;

const lowBubble = new Howl({
    src: [publicPath('bubbleloop.m4a')],
    volume: .3,
    rate: .5
})

const tapeHit = new Howl({
    src: ['/public/tape-hit.wav'],
    volume: 3,
    rate: .7
})


const descendingGate = new Howl({
    src: [publicPath('bubbleloop.m4a')],
    volume: 0.6,
    rate: 3.5
})

const footstepSFX = new Howl({
    src: [publicPath('footstep.wav')],
    volume: 0.7,
})
const tapeRip = new Howl({
    src: [publicPath('tape-rip.m4a')],
    volume: 0.2,
})

const landSFX = new Howl({
    src: [publicPath('land.wav')],
    volume: 2,
})

const musicLoop = new Howl({
    src: [publicPath('ost-loop.mp3')],
    volume: 0.4,
    loop: true,
    html: true
})

const howlBg = new Howl({
    src: [publicPath('howl-bg.mp3')],
    volume: 0.15,
    loop: true,
    html: true
})

const musicStart = new Howl({
    src: [publicPath('ost-start.mp3')],
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
    hit: false,
    released: false,
    pos: { x: 0, y: 0 },
    vel: { x: 0, y: 0 },
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
let trickyStairs_lvl = {
    eyePositions: [[100, 75, 1, true], [600, 75, 2, true]],
    platforms: [
        platform(platformTypes.large1, 75, 425),

        platform(platformTypes.large1, 320, 425),
        platform(platformTypes.large2, 320, 375),

        platform(platformTypes.large1, 560, 425),
        platform(platformTypes.large2, 560, 375),
        platform(platformTypes.large1, 560, 310),


        platform(platformTypes.large2, 800, 425),
        platform(platformTypes.large1, 800, 375),

        platform(platformTypes.large2, 850, 30),
        platform(platformTypes.large1, 850, 90),
        platform(platformTypes.large2, 850, 150),
        platform(platformTypes.large1, 850, 210),

        platform(platformTypes.thin, 75, 0),
        platform(platformTypes.thin, 225, 0),
        platform(platformTypes.thin, 375, 0),
        platform(platformTypes.thin, 500, 0),
        platform(platformTypes.thin, 650, 0),
        platform(platformTypes.thin, 800, 0),


    ],
    tentacleTraps: [
        { pos: { x: 570, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 630, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 700, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },


        { pos: { x: 430, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 500, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 360, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 290, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 220, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 150, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },

    ],
    text: [

    ],
    backgroundSRC: "",
    features: [],
    respawnPosition: [50, 250],
    blockerY: 280, // bottom
    blockerSize: { x: 25, y: 150 },
    initialBlockerY: 350,
    blocked: false,
    maxTapes: 2
}
let youonlygottwoshots_lvl = {
    eyePositions: [[300, 200, 1, true], [600, 100, 4, true]],
    platforms: [
        platform(platformTypes.large1, 75, 425),



        platform(platformTypes.thin, 75, 0),
        platform(platformTypes.thin, 225, 0),
        platform(platformTypes.thin, 375, 0),
        platform(platformTypes.thin, 500, 0),
        platform(platformTypes.thin, 650, 0),
        platform(platformTypes.thin, 800, 0),
        platform(platformTypes.large1, 650, 425),
        platform(platformTypes.large2, 650, 375),
        platform(platformTypes.large2, 800, 425),
        platform(platformTypes.large1, 800, 375),
        platform(platformTypes.large1, 800, 310),

        platform(platformTypes.large1, 850, 150),
        platform(platformTypes.large2, 850, 90),
        platform(platformTypes.large1, 850, 30)

    ],
    tentacleTraps: [
        { pos: { x: 430, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 500, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 360, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 290, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 220, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 150, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },

    ],
    text: [

    ],
    backgroundSRC: "",
    features: [],
    respawnPosition: [50, 250],
    blockerY: 280, // bottom
    blockerSize: { x: 25, y: 75 },
    initialBlockerY: 280,
    blocked: false,
    maxTapes: 2
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
        { pos: { x: 430, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 500, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
    ],
    backgroundSRC: "",
    features: [],
    respawnPosition: [50, 250],
    blockerY: 280, // bottom
    blockerSize: { x: 25, y: 150 },
    initialBlockerY: 280, // bottom
    blocked: false,
    text: [
        [250, 100, "Welcome to Tapestry!", "#897e61", 30],
        [250, 130, "Move your mouse to aim your tape!", "#897e61", 20],
        [250, 150, "Click to throw it", "#897e61", 20],
        [250, 170, "Cover up all of the ", "#897e61", 20],
        [450, 170, "Forest Beast's Eyes", "#d005bf", 20],
        [250, 190, "in order to be freed from each level", "#897e61", 20],
    ],
    maxTapes: -1
}
let templateLevel2 = {
    eyePositions: [[300, 200, 0, true], [600, 100, 3, true]],
    platforms: [
        platform(platformTypes.large1, 75, 425),
        platform(platformTypes.large2, 225, 425),
        //platform(platformTypes.large1, 375, 425),
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
        { pos: { x: 290, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 360, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 430, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 500, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 570, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 640, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },

    ],
    text: [
        [250, 100, "Hold-click to swing with your tape!", "#897e61", 20],
        [250, 120, "[R] to reset", "#897e61", 20],

    ],
    backgroundSRC: "",
    features: [],
    respawnPosition: [50, 250],
    blockerY: 280, // bottom
    blockerSize: { x: 25, y: 75 },
    initialBlockerY: 280,
    blocked: false,
    maxTapes: 6
}

let level4 = {
    eyePositions: [[20, 50, 3, true], [650, 50, 4, true]],
    platforms: [
        platform(platformTypes.large1, 75, 425),
        platform(platformTypes.large2, 100, 425),

        platform(platformTypes.large1, 750, 425),
        platform(platformTypes.large2, 800, 425),

        platform(platformTypes.large1, 280, 150),

        platform(platformTypes.large1, 550, 150),
    ],
    tentacleTraps: [
        { pos: { x: 150, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 220, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 290, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 360, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 430, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 500, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 570, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 640, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
    ],
    text: [

    ],
    backgroundSRC: "",
    features: [],
    respawnPosition: [50, 250],
    blockerY: 400, // bottom
    blockerSize: { x: 25, y: 300 },
    initialBlockerY: 400,
    blocked: false,
    maxTapes: 4
}

let level5 = {
    eyePositions: [[200, 180, 1, true], [350, 230, 4, true], [500, 180, 2, true]],
    platforms: [
        platform(platformTypes.large1, 0, 425),
        platform(platformTypes.large2, 50, 425),

        platform(platformTypes.large2, 400, 425),

        platform(platformTypes.large1, 750, 425),
        platform(platformTypes.large2, 850, 425),

        platform(platformTypes.large1, 230, 150),

        platform(platformTypes.large1, 550, 150),
    ],
    tentacleTraps: [
        { pos: { x: 80, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 150, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 220, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 290, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 360, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 430, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 500, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 570, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
        { pos: { x: 640, y: 380 }, size: { x: 70, y: 70 }, axis: 'y', dir: -1 },
    ],
    text: [

    ],
    backgroundSRC: "",
    features: [],
    respawnPosition: [50, 250],
    blockerY: 400, // bottom
    blockerSize: { x: 25, y: 300 },
    initialBlockerY: 400,
    blocked: false,
    maxTapes: 2
}

let level6 = {
    eyePositions: [[230, 20, 3, true]],
    platforms: [
        platform(platformTypes.large1, 75, 425),
        platform(platformTypes.large2, 225, 425),
        platform(platformTypes.large1, 375, 425),
        platform(platformTypes.large2, 480, 425),
        platform(platformTypes.large1, 650, 425),
        platform(platformTypes.large2, 800, 425),


        platform(platformTypes.large1, 75, 200),
        platform(platformTypes.large2, 225, 200),
        platform(platformTypes.large1, 280, 200),
        //platform(platformTypes.large2, 480, 200),
        platform(platformTypes.thin, 550, 200),
        platform(platformTypes.large2, 800, 200),

        platform(platformTypes.large1, 75, 0),
        platform(platformTypes.large2, 225, 0),
        platform(platformTypes.large1, 375, 0),
        platform(platformTypes.large2, 480, 0),
        platform(platformTypes.large1, 650, 0),
        platform(platformTypes.large2, 800, 0),

        platform(platformTypes.large2, 0, 135),
        platform(platformTypes.large1, 0, 70),

        platform(platformTypes.large1, 800, 260),
        platform(platformTypes.large2, 800, 320),
        platform(platformTypes.large1, 800, 380),
    ],
    tentacleTraps: [

    ],
    text: [

    ],
    backgroundSRC: "",
    features: [],
    respawnPosition: [50, 300],
    blockerY: 180, // bottom
    blockerSize: { x: 25, y: 120 },
    initialBlockerY: 180,
    blocked: false,
    maxTapes: 1
}

let platforms = [
    templatePlatform
]

let levelStorage = [
    templateLevel, templateLevel2, youonlygottwoshots_lvl, trickyStairs_lvl, level4, level5, level6
]

let level = {
    ID: 0,
    backgroundOffset: 0,
    numMaskedEyes: 0,
    data: {},
    blocked: true
};

const COYOTE_TIME = 0.1
const JUMP_BUFFER = 0.1

const JUMP_VEL = 900

const AIR_FRICTION = 0.98
const GROUND_FRICTION = 0.999999

const GRAVITY_ACCEL = 600
const GRAVITY_DOWNWARDS_ACCEL = 600
const GROUND_MOVE_ACCEL = 1000
const AIR_MOVE_ACCEL = 300

let player = {
    direction: 1,
    pos: { x: 300, y: 200 }, // CENTER
    vel: { x: 0, y: 0 },
    size: { x: 35, y: 55 },

    jumpTime: 0, // stores coyote time
    jumpBuffer: 0, // buffer that allows jumping if space was pressed early
    numTapes: 0,
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
        jump: 3,
        swing: 4
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

keyHandler.onInputDown('jump', () => {
    player.jumpBuffer = JUMP_BUFFER
})

keyHandler.onInputDown('throwTape', () => {
    if (!tape.launched && inGameplay) {
        if (player.numTapes == 0) {
            return
        }
        player.numTapes--
        tape.launched = true

        tape.released = false
        tapeRip.pos(tape.pos.x * HOWLER_POS_SCALE, tape.pos.y * HOWLER_POS_SCALE)
        tapeRip.play()

        tape.particles.push({ start: Vec.copy(player.pos), end: null })
    }
})
_gameLoop()
countTPS()



gameScreenCvs.addEventListener("mousemove", (event) => {
    mouseX = event.offsetX / gameConsts.scale * window.devicePixelRatio
    mouseY = event.offsetY / gameConsts.scale * window.devicePixelRatio
})

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

        const listenerPos = [
            gameConsts.width / gameConsts.scale / 2 * HOWLER_POS_SCALE,
            gameConsts.height / gameConsts.scale / 2 * HOWLER_POS_SCALE,
            -5
        ]

        Howler.pos(...listenerPos)
        //console.log("LISTENER", ...listenerPos)
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


        renderObjects(dt) //render animations etc
        renderWorld()

        updatePlayer(dt)

        drawTapeHUD()
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
        resetLevel()
    })

    setFont("30px Lacquer")
    canvas.fillStyle = "#b8ab88"

    let text = "A normal game about a racoon"

    drawText(text, 400 - (canvas.measureText(text).width / 2 / gameConsts.scale), 150)


}
function drawTapeHUD() {
    if (level.data.maxTapes == -1) {
        drawImage(10, 10, 40, 40, "tape")
        drawImage(46, 10, 40, 40, "tape")
        return
    }
    for (let i = 0; i < level.data.maxTapes; i++) {
        if (i >= player.numTapes) {
            drawImage(6 + (i * 46), 6, 40, 40, "tape-empty")
            continue

        }
        drawImage(6 + (i * 46), 6, 40, 40, "tape")
    }


}

function drawTape(dt) {
    //calculate tape position
    if (!tape.launched) {
        const RADIUS = 60

        let circ = 175 * gameConsts.scale * 2 * Math.PI

        canvas.lineWidth = 2 * gameConsts.scale
        canvas.lineCap = "round"
        canvas.setLineDash([circ / 120, circ / 60])
        canvas.strokeStyle = "#ababab"

        canvas.beginPath()
        canvas.ellipse((player.pos.x) * gameConsts.scale, (player.pos.y) * gameConsts.scale, RADIUS * gameConsts.scale, RADIUS * gameConsts.scale, 0, 0, (2 * Math.PI))
        canvas.stroke()

        const throwDelta = Vec.sub({ x: mouseX, y: mouseY }, player.pos)
        const unitThrowDelta = Vec.unit(throwDelta)

        tape.pos = Vec.add(player.pos, Vec.scale(unitThrowDelta, RADIUS))

        if (isNaN(tape.pos.x)) {
            tape.pos = { x: RADIUS + player.pos.x + 30, y: player.pos.y + 30 }
        }

        const THROW_VEL = 600

        tape.vel = Vec.scale(unitThrowDelta, THROW_VEL)

    } else {
        const curParticle = tape.particles[tape.particles.length - 1];
        if (!curParticle) {
            tape.launched = false;
            tape.hit = false
            tape.released = true;
            return;
        }

        if (!tape.released) {
            if (!keyHandler.keyStates.has('throwTape')) tape.released = true;
            curParticle.start = Vec.copy(player.pos)
        }

        if (!tape.hit) {
            curParticle.end = Vec.copy(tape.pos)

            tape.pos = Vec.add(tape.pos, Vec.scale(tape.vel, dt))

            if (tape.pos.y >= 450 || tape.pos.y < -20 || tape.pos.x < -20 || tape.pos.y > 800) {
                tape.launched = false
            }

            const colliding = platforms.some(platform => rectCircleOverlaps(platform.pos, platform.size,
                tape.pos, tape.radius));

            if (colliding) {
                console.log("collided!")
                // tapeHit.play()
                tape.hit = true;
            }
        } else { // hit! start grapple
            if (tape.released) { // stop grappling
                tape.launched = false;
                tape.hit = false
            } else {
                player.moveState = player.moveStates.swing
                const GRAPPLE_FORCE = 2000
                player.vel = Vec.add(player.vel, Vec.scale(
                    Vec.unit(Vec.sub(curParticle.end, curParticle.start)),
                    GRAPPLE_FORCE * dt
                ))
            }
        }
    }
    //tape collision
    canvas.strokeStyle = "#b8ab88"

    const TAPE_WIDTH = 20

    for (let i = 0; i < tape.particles.length; i++) {
        canvas.lineCap = "square"
        canvas.setLineDash([])
        canvas.lineWidth = TAPE_WIDTH * gameConsts.scale
        canvas.beginPath()
        canvas.moveTo(tape.particles[i].start.x * gameConsts.scale, tape.particles[i].start.y * gameConsts.scale)
        canvas.lineTo(tape.particles[i].end.x * gameConsts.scale, tape.particles[i].end.y * gameConsts.scale)
        canvas.stroke()
    }
    if (player.numTapes == 0) {
        drawImage(tape.pos.x - 20, tape.pos.y - 20, 40, 40, "tape-empty")
        return

    }
    drawImage(tape.pos.x - 20, tape.pos.y - 20, 40, 40, "tape")
}

keyHandler.onInputDown('reset', () => {
    if (inGameplay) resetLevel();
})


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

        //console.log(groundedHitboxPos.x * HOWLER_POS_SCALE, groundedHitboxPos.y * HOWLER_POS_SCALE)

        landSFX.play()
    }
    // jumping
    if (player.jumpTime > 0) {
        player.jumpTime -= dt;
        if (player.jumpBuffer > 0) {
            player.jumpTime = 0;
            player.jumpBuffer = 0;

            player.vel.y -= JUMP_VEL;
        }
    }

    if (player.jumpBuffer > 0) player.jumpBuffer -= dt;

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
        resetLevel()

        return
    }
    if (player.pos.x < 0) {
        player.pos.x = 0
    }

    if (player.pos.x > 760) {
        console.log("over")

        if (level.blocked) {
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
            drawImage(t[0], t[1], 100, 100, "Eye-" + (t[3] ? "" : "faded-") + Math.min(t[2], 4))
            let xComp = (player.pos.x) - t[0]
            let yComp = (player.pos.y) - t[1]

            let unitX = xComp / Math.pow((xComp * xComp) + (yComp * yComp), .5)
            let unitY = yComp / Math.pow((xComp * xComp) + (yComp * yComp), .5)

            let drawX = (10 * unitX + t[0]) + 50
            let drawY = (10 * unitY + t[1]) + 50

            t[3] = !tape.particles.some(
                particle => particle !== undefined && particle.end !== null &&
                    lineCircleIntersect(
                        [[particle.start.x, particle.start.y], [particle.end.x, particle.end.y]],
                        [t[0] + 50, t[1] + 50, 30]
                    )
            )

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
            drawImage(t[i].pos.x, t[i].pos.y, t[i].size.x, t[i].size.y,
                `Tentacles-${t[i].axis}-(${t[i].dir})-${animationTicks % 5}`)

            const colliderPos = Vec.add(t[i].pos, Vec.div(t[i].size, 2))
            colliderPos[t[i].axis] -= t[i].dir * 3 / 8 * t[i].size[t[i].axis]

            const colliderSize = Vec.copy(t[i].size)
            colliderSize[t[i].axis] /= 4;

            if (rectRectOverlaps(player.pos, { x: player.size.x * 0.4, y: player.size.y }, colliderPos, colliderSize)) {
                // died
                resetLevel()
            }

            if (t[i].soundID === undefined) t[i].soundID = lowBubble.play();
            lowBubble.pos(
                (t[i].pos.x + t[i].size.x / 2) * HOWLER_POS_SCALE,
                (t[i].pos.y + t[i].size.y / 2) * HOWLER_POS_SCALE,
                0,
                t[i].soundID
            )
            if (!lowBubble.playing(t[i].soundID)) { lowBubble.play(t[i].soundID) }
        }
    }

    drawImage(775, level.data.blockerY - level.data.blockerSize.y,
        level.data.blockerSize.x, level.data.blockerSize.y,
        "Door-" + (animationTicks % 5))

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
        level.data.blockerY += 0.03 * level.data.blockerSize.y
        if (!descendingGate.playing()) {
            descendingGate.seek(2.5);
            descendingGate.pos(780 * HOWLER_POS_SCALE,
                (level.data.blockerY - level.data.blockerSize.y / 2) * HOWLER_POS_SCALE, 0)
            descendingGate.play()
        }
    } else {
        level.data.blockerY = level.data.initialBlockerY
        descendingGate.stop()
    }
    if (level.data.blockerY - level.data.initialBlockerY > level.data.blockerSize.y) {
        level.blocked = false
        descendingGate.stop()
    }
}


function resetLevel() {
    console.log("Reset level", level.ID)

    console.log(level)

    level.data = levelStorage[level.ID]
    platforms = level.data.platforms

    player.pos.x = level.data.respawnPosition[0]
    player.pos.y = level.data.respawnPosition[1]
    level.numMaskedEyes = level.data.eyePositions.length
    tape.particles = []

    level.blocked = true
    if (level.data.numTapes != -1) {
        player.numTapes = level.data.maxTapes
    }
}

function nextLevel() {
    console.log(":DD")
    level.ID++
    level.backgroundOffset = Math.floor(Math.random() * 800)

    if (level.ID >= levelStorage.length) {
        WON = true
        return
    }

    resetLevel()
}

sizeCvs()
//window.onresize = sizeCvs
window.addEventListener('resize', sizeCvs)


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
function renderObjects(dt) {

    drawTape(dt)
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
        case player.moveStates.swing:
            frame = "Jelli-swing"
            break;
        default:
            frame = "Jelli-idle"
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
