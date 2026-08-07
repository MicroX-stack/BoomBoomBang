// อ้างอิงอิลิเมนต์ต่างๆ จากหน้าเว็บ
const btnStart = document.getElementById('btn-start')
const video = document.getElementById('webcam')
const errorCard = document.getElementById('error-message')
const errorText = document.getElementById('error-text')
const cameraSelectContainer = document.getElementById('camera-select-container')
const cameraSelect = document.getElementById('camera-select')

// อิลิเมนต์สำหรับตรวจจับมือ (Hand Tracking)
const handCanvas = document.getElementById('hand-canvas')
const handCtx = handCanvas.getContext('2d')
const handTrackingContainer = document.getElementById('hand-tracking-container')
const toggleHandTracking = document.getElementById('toggle-hand-tracking')

// ==========================================
// ระบบเสียง Background Music (BGM)
// ==========================================
const bgmMenu = new Audio('music/menu.mp3')
bgmMenu.loop = true
bgmMenu.volume = 1.0 // เสียงปกติ
bgmMenu.preload = "auto"

const bgmGame = new Audio('music/game.mp3')
bgmGame.loop = true
bgmGame.volume = 1.0 // เบาๆ เพลินๆ ตามที่ขอ
bgmGame.preload = "auto"

const bgmFinal = new Audio('music/final.mp3')
bgmFinal.loop = true
bgmFinal.volume = 1.0 // เพลงฉลอง
bgmFinal.preload = "auto"

// ==========================================
// ระบบเสียง Effect (SFX)
// ==========================================
const sfxBoom = new Audio('Effect/boom.mp3')
sfxBoom.volume = 1.0 // ดังกว่า BGM

const sfxButton = new Audio('Effect/button-click.mp3')
sfxButton.volume = 0.8

const sfxInterface = new Audio('Effect/interface-click-.mp3')
sfxInterface.volume = 0.7

const sfxVineBoom = new Audio('Effect/vine-boom.mp3')
sfxVineBoom.volume = 1.0

const sfxAnswer = new Audio('Effect/answer.mp3')
sfxAnswer.volume = 1.0

const sfxError = new Audio('Effect/error.mp3?v=2')
sfxError.volume = 1.0

const sfxPop = new Audio('Effect/pop.mp3')
sfxPop.volume = 1.0

const sfxCorrect = new Audio('Effect/correct.mp3')
sfxCorrect.volume = 1.0

function playSFX(audioObj) {
    if (!audioObj) return
    const clone = audioObj.cloneNode()
    clone.volume = audioObj.volume
    const p = clone.play()
    if (p !== undefined) p.catch(() => {})
}

// เพิ่มเสียงปุ่มกดทั่วไปทั้งระบบ
document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, .category-btn, #btn-score-next, #btn-score-reset, #btn-skip-to-question-p1, #btn-skip-to-question-p2, #btn-skip-question-ui, #btn-play-same-category, #btn-back-home')
    if (btn) {
        playSFX(sfxButton)
    }
})

// เพิ่มเสียง pop เมื่อเอาเมาส์ชี้กล่องเริ่มเกม, ตั้งค่า, และหมวดหมู่
document.addEventListener('mouseover', (e) => {
    const popTarget = e.target.closest('.home-btn-img-wrapper, .category-btn')
    if (popTarget) {
        if (!popTarget.dataset.isHovered) {
            playSFX(sfxPop)
            popTarget.dataset.isHovered = 'true'
            popTarget.addEventListener('mouseleave', () => {
                popTarget.dataset.isHovered = ''
            }, { once: true })
        }
    }
})

let currentBGM = null

function playBGM(trackType) {
    let nextTrack = null
    if (trackType === 'menu') nextTrack = bgmMenu
    else if (trackType === 'game') nextTrack = bgmGame
    else if (trackType === 'final') nextTrack = bgmFinal

    if (currentBGM === nextTrack) return

    if (currentBGM) {
        currentBGM.pause()
        currentBGM.currentTime = 0
    }

    currentBGM = nextTrack
    if (currentBGM) {
        const playPromise = currentBGM.play()
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Autoplay was prevented by browser. User interaction needed.", error)
            })
        }
    }
}

// พยายามเล่นเพลงทันทีที่โหลดเสร็จ
window.addEventListener('load', () => {
    if (['start-screen', 'category-screen', 'settings-screen'].includes(currentScreen)) {
        playBGM('menu')
    }
})

// ปลดล็อกเสียงทั้งหมดสำหรับ Safari (แก้ปัญหาเสียงไม่ดัง)
let audioUnlocked = false
function unlockAudio() {
    if (audioUnlocked) return
    const allAudio = [bgmMenu, bgmGame, bgmFinal, sfxBoom, sfxButton, sfxInterface, sfxVineBoom, sfxAnswer, sfxError, sfxPop, sfxCorrect]
    allAudio.forEach(audio => {
        if (audio) {
            audio.volume = 0 // ปิดเสียงชั่วคราว
            const p = audio.play()
            if (p !== undefined) {
                p.then(() => {
                    audio.pause()
                    audio.currentTime = 0
                    // คืนค่า volume (bgmGame, bgmFinal, bgmMenu เป็น 1.0)
                    if (audio === bgmMenu || audio === bgmGame || audio === bgmFinal) audio.volume = 1.0
                    else if (audio === sfxButton) audio.volume = 0.8
                    else if (audio === sfxInterface) audio.volume = 0.7
                    else audio.volume = 1.0
                }).catch(() => {})
            }
        }
    })
    audioUnlocked = true
}

// เล่นเพลงเมื่อมีการคลิกครั้งแรก
document.addEventListener('click', () => {
    unlockAudio()
    if (!currentBGM && ['start-screen', 'category-screen', 'settings-screen'].includes(currentScreen)) {
        playBGM('menu')
    }
}, { once: true })

// Game and countdown elements
const p1IceBlock = document.getElementById('p1-ice-block')
const p2IceBlock = document.getElementById('p2-ice-block')
const p1HpFill = document.getElementById('p1-hp-fill')
const p2HpFill = document.getElementById('p2-hp-fill')

// อิลิเมนต์หน้าต่างตอบคำถามและพอยน์เตอร์
const p1QuestionContainer = document.getElementById('p1-question-container')
const p2QuestionContainer = document.getElementById('p2-question-container')
const p1Pointer = document.getElementById('p1-pointer')
const p2Pointer = document.getElementById('p2-pointer')
const btnScoreNext = document.getElementById('btn-score-next')
const btnScoreReset = document.getElementById('btn-score-reset')

const btnPlaySameCategory = document.getElementById('btn-play-same-category')
const btnBackHome = document.getElementById('btn-back-home')

// สถานะการสตรีมกล้องและระบบจับมือ
let mediaStream = null
let webcamTimeout = null
let isHandTrackingActive = false
let handsModel = null
let particleList = []

// สถานะตัวกรองความเรียบเนียน (Pointer Smoothing & Dead Zone)
const pointerHistory = { x: [], y: [] }
const SMOOTHING_FRAMES = 5 // ลดเฟรมเฉลี่ยลงมาเพื่อให้ตอบสนองนิ้วไวขึ้น ไม่หน่วง/ค้าง
const DEAD_ZONE = 0 // ปิด Dead Zone ไปเลยเพื่อให้ขยับได้ลื่นไหลแบบไม่ติดขัด
let lastRenderedX = null
let lastRenderedY = null

// สถานะการชี้ปุ่มตัวเลือกคำตอบแบบค่อยๆ ลดลง (Progress Decay)
let lastHoverUpdateTime = null
let optionProgress = { A: 0, B: 0, C: 0, D: 0 }

// ตัวควบคุมความเร็วมือ และ Debounce สำหรับจับการ "ทุบลง"
const SMASH_THRESHOLD = 0.15 // ความเร็วการทุบแนวตั้งแกน Y (ความสูงจอต่อวินาที) (ปรับให้อ่อนลงเพื่อให้ทุบติดง่ายสำหรับคนยืนไกลๆ)
const SMASH_COOLDOWN = 120 // ลด Cooldown เพื่อให้ทุบได้รัวขึ้นสะใจ (120ms)
const MAX_SMASHES = 50 // จำนวนการทุบทั้งหมดตามภาพวิธีเล่นกึ่งกลางจอ (50 ครั้ง)

// ประวัติจำมือสำหรับ Player 1 และ Player 2
// เปลี่ยนเป็นเก็บสถานะแยกเป็น "รายมือ" (hands array) แทนตัวแปรเดี่ยว
// เพื่อให้ผู้เล่นแต่ละคนใช้ได้ทั้ง 2 มือพร้อมกันโดยไม่เขียนทับสถานะกันเอง
const playerStates = {
    p1: { hands: [], missingFrames: 0 },
    p2: { hands: [], missingFrames: 0 }
}

function getHandState(playerKey, handIndex) {
    const list = playerStates[playerKey].hands
    if (!list[handIndex]) {
        list[handIndex] = { prevY: null, prevTime: null, lastSmashTime: 0 }
    }
    return list[handIndex]
}

// สถานะเกม
let currentScreen = 'start-screen'
let isGameOver = false
let winner = null // 'p1' หรือ 'p2'
let p1Hp = 100
let p2Hp = 100
let p1Smashes = 0
let p2Smashes = 0

// คะแนนสะสมรวม (Overall scores)
let p1OverallScore = 0
let p2OverallScore = 0

// ตัวแปรสำหรับคำถาม
let isQuestionActive = false
let isQuestionFinished = false
let timerInterval = null
let scoreCountdownInterval = null // ตัวจับเวลาสำหรับหน้าสรุปคะแนน
let countdownInterval = null // ตัวจับเวลา for 3 2 1 countdown
let timeLeft = 120 // 2 นาที

// รอบปัจจุบันของเกม ใช้กำหนดว่าจะเล่นด่านที่ 1 (ง่าย) หรือด่านที่ 2 (ยาก/ซูมภาพ)
let currentRound = 1


// ==========================================
// ด่านโบนัส: จิ๊กซอว์
// ==========================================
const questionsListBonus = [
    {
        image: 'Level2/Capybara.PNG',
        text: 'Reveal squares to guess the animal!',
        options: {
            A: 'Capybara',
            B: 'Rabbit',
            C: 'Squirrel'
        },
        correct: 'A',
        maxReveals: 3
    },
    {
        image: 'Level2/Deer.PNG',
        text: 'Reveal squares to guess the animal!',
        options: {
            A: 'Horse',
            B: 'Deer',
            C: 'Goat'
        },
        correct: 'B',
        maxReveals: 3
    },
    {
        image: 'Level2/Red_panda.PNG',
        text: 'Reveal squares to guess the animal!',
        options: {
            A: 'Raccoon',
            B: 'Red panda',
            C: 'Fox'
        },
        correct: 'B',
        maxReveals: 3
    }
]

// Helper function to shuffle an array!
function shuffleArray(array) {
    // Force cache bust to ensure shuffling works properly
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
}

let currentQuestion = null
let shuffledOptions = []
let correctOptionKey = ''

const TOTAL_LEVELS = 3
const BONUS_POINTS = 3
const BONUS_MAX_REVEALS = 3

// ติดตามคำถามที่ใช้แล้วเพื่อไม่ให้ซ้ำ และ index ของคำถามปัจจุบัน
let currentLevel = 1 // 1-3, 0 = bonus
let questionsAnsweredLevel1 = 0
let questionsAnsweredLevel2 = 0
let questionsAnsweredLevel3 = 0
let questionsAnsweredBonus = 0
let totalQuestionsAnswered = 0
let bonusRevealsRemaining = 0
let revealedSquares = []
let isBonusLevel = false
let isFirstRound = true // Track if this is the very first game!
let selectedCategory = null // 'animal', 'object', 'fruit'
let gameQuestionPool = []
let gameQuestionIndex = 0
let bonusQuestionPool = []
let bonusQuestionIndex = 0
let p1JigsawCount = 0
let p2JigsawCount = 0
let lastFirstQuestionByCategory = {}

// สถานะปุ่มสำหรับตัวเลือก
let hoveredOptionBtn = null
let lastTimeOnButton = 0

const categoryMeta = {
    animal: { label: 'สัตว์', emoji: '🐾' },
    object: { label: 'สิ่งของ', emoji: '🧸' },
    fruit: { label: 'ผลไม้', emoji: '🍎' }
}

function buildAiImage(prompt, imageSize = 'square_hd') {
    return `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${imageSize}`
}

function makeOptions(correct, wrong1, wrong2) {
    return { A: correct, B: wrong1, C: wrong2 }
}

function buildLocalImageQuestion(image, text, correct, wrong1, wrong2, extra = {}) {
    return {
        image,
        text,
        options: makeOptions(correct, wrong1, wrong2),
        correct: 'A',
        ...extra
    }
}

function buildAiImageQuestion(prompt, text, correct, wrong1, wrong2, extra = {}) {
    return buildLocalImageQuestion(
        buildAiImage(prompt, extra.imageSize || 'square_hd'),
        text,
        correct,
        wrong1,
        wrong2,
        extra
    )
}

function shuffleQuestionsForLevel(questions, categoryKey, level, avoidFirstQuestionId = null) {
    let shuffled = shuffleArray(
        questions.map((q, index) => {
            const correctText = q.options['A']
            const otherQuestions = questions.filter(other => other.options['A'] !== correctText)
            const randomWrong = shuffleArray(otherQuestions)
            
            let wrong1 = randomWrong.length > 0 ? randomWrong[0].options['A'] : q.options['B']
            let wrong2 = randomWrong.length > 1 ? randomWrong[1].options['A'] : q.options['C']

            return {
                ...q,
                options: makeOptions(correctText, wrong1, wrong2),
                level,
                questionId: `${categoryKey}-l${level}-${index}`
            }
        })
    )

    if (avoidFirstQuestionId && shuffled.length > 1 && shuffled[0].questionId === avoidFirstQuestionId) {
        const swapIndex = 1 + Math.floor(Math.random() * (shuffled.length - 1))
            ;[shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]]
    }

    return shuffled
}

function buildQuestionPools(categoryKey, resetBonus = true) {
    const category = categoryQuestions[categoryKey]
    const lastFirstQuestionId = lastFirstQuestionByCategory[categoryKey] || null
    const level1Pool = shuffleQuestionsForLevel(category.level1, categoryKey, 1, lastFirstQuestionId)
    const level2Pool = shuffleQuestionsForLevel(category.level2, categoryKey, 2)
    const level3Pool = shuffleQuestionsForLevel(category.level3, categoryKey, 3)

    gameQuestionPool = [
        ...level1Pool,
        ...level2Pool,
        ...level3Pool
    ]
    gameQuestionIndex = 0
    lastFirstQuestionByCategory[categoryKey] = level1Pool[0]?.questionId || null

    if (resetBonus) {
        let shuffledBonus = shuffleArray(
            category.bonus.map((q, index) => {
                const correctText = q.options['A']
                
                // ดึงตัวเลือกผิดแบบสุ่มจากทุก Level ของหมวดหมู่นี้ เพื่อไม่ให้คำตอบวนอยู่แค่ 3 ตัวเดิม!
                const allCategoryQuestions = [...category.level1, ...category.level2, ...category.level3, ...category.bonus]
                const otherQuestions = allCategoryQuestions.filter(other => other.options['A'] !== correctText)
                const randomWrong = shuffleArray(otherQuestions)
                
                let wrong1 = randomWrong.length > 0 ? randomWrong[0].options['A'] : q.options['B']
                let wrong2 = randomWrong.length > 1 ? randomWrong[1].options['A'] : q.options['C']

                return {
                    ...q,
                    options: makeOptions(correctText, wrong1, wrong2),
                    level: 0,
                    isBonus: true,
                    questionId: `${categoryKey}-bonus-${index}`
                }
            })
        )

        const lastBonusIds = lastFirstQuestionByCategory[`${categoryKey}-bonus-ids`] || []
        
        if (shuffledBonus.length >= 2 && lastBonusIds.length >= 2) {
            let attempts = 0
            while ((shuffledBonus[0].questionId === lastBonusIds[0] || shuffledBonus[1].questionId === lastBonusIds[1]) && attempts < 10) {
                shuffledBonus = shuffleArray(shuffledBonus)
                attempts++
            }
        }

        lastFirstQuestionByCategory[`${categoryKey}-bonus-ids`] = shuffledBonus.map(q => q.questionId)
        bonusQuestionPool = shuffledBonus
        bonusQuestionIndex = 0
        p1JigsawCount = 0
        p2JigsawCount = 0
    }
}

function getTotalNormalQuestions() {
    if (!selectedCategory || !categoryQuestions[selectedCategory]) return 0
    const category = categoryQuestions[selectedCategory]
    return category.level1.length + category.level2.length + category.level3.length
}

// ==========================================
// คลังคำถามแยกตามหมวดหมู่และระดับ Level 1-3 + Bonus Jigsaw
// Level 1: ดูรูปแล้วตอบ
// Level 2: ดูรูปแล้วทาย
// Level 3: อ่านคำใบ้ยาวอย่างเดียว
// Bonus: Jigsaw เปิดได้ 3 ช่องตามตำแหน่งที่ผู้เล่นเลือก
// ==========================================
const categoryQuestions = {
    animal: {
        level1: [
            buildLocalImageQuestion('animals/Level1/Cat.JPG', 'What animal is this in English?', 'Cat', 'Dog', 'Rabbit'),
            buildLocalImageQuestion('animals/Level1/Cow.jpg', 'What animal is this in English?', 'Cow', 'Horse', 'Pig'),
            buildLocalImageQuestion('animals/Level1/Dog.jpg', 'What animal is this in English?', 'Dog', 'Cat', 'Duck'),
            buildLocalImageQuestion('animals/Level1/Duck.jpg', 'What animal is this in English?', 'Duck', 'Chicken', 'Bird'),
            buildLocalImageQuestion('animals/Level1/Pig.jpg', 'What animal is this in English?', 'Pig', 'Cow', 'Sheep')
        ],
        level2: [
            buildLocalImageQuestion('animals/Level2/Batterfly.png', 'What animal is this in English?', 'Butterfly', 'Bee', 'Bird'),
            buildLocalImageQuestion('animals/Level2/Crocodile.png', 'What animal is this in English?', 'Crocodile', 'Snake', 'Lizard'),
            buildLocalImageQuestion('animals/Level2/Geraffe.png', 'What animal is this in English?', 'Giraffe', 'Horse', 'Camel'),
            buildLocalImageQuestion('animals/Level2/Rat.png', 'What animal is this in English?', 'Rat', 'Mouse', 'Hamster'),
            buildLocalImageQuestion('animals/Level2/Zebra.png', 'What animal is this in English?', 'Zebra', 'Horse', 'Panda')
        ],
        level3: [
            buildLocalImageQuestion('', 'It has a long tail, loves to swing on trees, and eats bananas. What is it?', 'A monkey', 'A dog', 'A cat'),
            buildLocalImageQuestion('', 'It is very big, has a long nose, and has big ears. What is it?', 'An elephant', 'A bird', 'A fish'),
            buildLocalImageQuestion('', 'It has long ears, a short tail, and loves to eat carrots. What is it?', 'A rabbit', 'A tiger', 'A duck'),
            buildLocalImageQuestion('', 'It lives in the sea, is very smart, and likes to jump out of the water. What is it?', 'A dolphin', 'A lion', 'A pig'),
            buildLocalImageQuestion('', 'It has four legs, wags its tail, and says \'woof woof\'. What is it?', 'A dog', 'A frog', 'A horse')
        ],
        bonus: [
            buildLocalImageQuestion('animals/Jigsaw/Owl.jpg', 'What animal is this in English?', 'Owl', 'Eagle', 'Penguin', { bonusPoints: BONUS_POINTS }),
            buildLocalImageQuestion('animals/Jigsaw/Panda.jpg', 'What animal is this in English?', 'Panda', 'Bear', 'Koala', { bonusPoints: BONUS_POINTS }),
            buildLocalImageQuestion('animals/Jigsaw/Lion.jpg', 'What animal is this in English?', 'Lion', 'Tiger', 'Monkey', { bonusPoints: BONUS_POINTS })
        ]
    },
    object: {
        level1: [
            buildLocalImageQuestion('Objects/Level1/Book.jpg', 'What object is this?', 'Book', 'Notebook', 'Paper'),
            buildLocalImageQuestion('Objects/Level1/Smartphone.jpg', 'What object is this?', 'Smartphone', 'Tablet', 'Radio'),
            buildLocalImageQuestion('Objects/Level1/Scissors.jpg', 'What object is this?', 'Scissors', 'Knife', 'Pen'),
            buildLocalImageQuestion('Objects/Level1/pencil.jpg', 'What object is this?', 'pencil', 'pen', 'ruler'),
            buildLocalImageQuestion('Objects/Level1/bag.png', 'What object is this?', 'bag', 'box', 'hat')
        ],
        level2: [
            buildLocalImageQuestion('Objects/Level2/Ruler.png', 'What object is this?', 'Ruler', 'Stick', 'Pencil'),
            buildLocalImageQuestion('Objects/Level2/Eraser.png', 'What object is this?', 'Eraser', 'Soap', 'Sponge'),
            buildLocalImageQuestion('Objects/Level2/Paintbrush.png', 'What object is this?', 'Paintbrush', 'Toothbrush', 'Pencil'),
            buildLocalImageQuestion('Objects/Level2/Clock.png', 'What object is this?', 'Clock', 'Watch', 'Compass'),
            buildLocalImageQuestion('Objects/Level2/Pencil sharpener.png', 'What object is this?', 'Pencil sharpener', 'Eraser', 'Box')
        ],
        level3: [
            buildLocalImageQuestion('', 'You sleep on this soft thing every night.', 'Bed', 'Sofa', 'Chair'),
            buildLocalImageQuestion('', 'You use this to clean your teeth.', 'Toothbrush', 'Comb', 'Spoon'),
            buildLocalImageQuestion('', 'People wear these to see better.', 'Glasses', 'Hat', 'Headphones'),
            buildLocalImageQuestion('', 'You use this to open a locked door.', 'Key', 'Coin', 'Ring'),
            buildLocalImageQuestion('', 'You look in this to see your own face.', 'Mirror', 'Window', 'Picture')
        ],
        bonus: [
            buildLocalImageQuestion('Objects/Jigsaw/rubbish bin.jpg', 'What object is this?', 'rubbish bin', 'basket', 'bucket', { bonusPoints: BONUS_POINTS }),
            buildLocalImageQuestion('Objects/Jigsaw/Computer.jpg', 'What object is this?', 'Computer', 'TV', 'Tablet', { bonusPoints: BONUS_POINTS }),
            buildLocalImageQuestion('Objects/Jigsaw/Water bottle.jpg', 'What object is this?', 'Water bottle', 'Cup', 'Glass', { bonusPoints: BONUS_POINTS })
        ]
    },
    fruit: {
        level1: [
            buildLocalImageQuestion('Fruits/Level1/Cherry.jpg', 'What fruit is this?', 'Cherry', 'Apple', 'Strawberry'),
            buildLocalImageQuestion('Fruits/Level1/Orange.jpg?v=3', 'What fruit is this?', 'Orange', 'Lemon', 'Peach'),
            buildLocalImageQuestion('Fruits/Level1/Grapes.jpg', 'What fruit is this?', 'Grapes', 'Blueberry', 'Plum'),
            buildLocalImageQuestion('Fruits/Level1/Apple.jpg', 'What fruit is this?', 'Apple', 'Tomato', 'Pear'),
            buildLocalImageQuestion('Fruits/Level1/Banana.jpg', 'What fruit is this?', 'Banana', 'Mango', 'Corn')
        ],
        level2: [
            buildLocalImageQuestion('Fruits/Level2/Papaya.png', 'What fruit is this?', 'Papaya', 'Mango', 'Melon'),
            buildLocalImageQuestion('Fruits/Level2/Pineapple.png', 'What fruit is this?', 'Pineapple', 'Durian', 'Jackfruit'),
            buildLocalImageQuestion('Fruits/Level2/Watermelon.png', 'What fruit is this?', 'Watermelon', 'Papaya', 'Apple'),
            buildLocalImageQuestion('Fruits/Level2/Mangosteen.png', 'What fruit is this?', 'Mangosteen', 'Grape', 'Lychee'),
            buildLocalImageQuestion('Fruits/Level2/Kiwi.png', 'What fruit is this?', 'Kiwi', 'Avocado', 'Lime')
        ],
        level3: [
            buildLocalImageQuestion('', 'It is hard and brown, with sweet water inside.', 'Coconut', 'Melon', 'Pear'),
            buildLocalImageQuestion('', 'It is a small red fruit with seeds on the outside.', 'Strawberry', 'Raspberry', 'Blueberry'),
            buildLocalImageQuestion('', 'It is soft and sweet, with a big hard seed inside.', 'Peach', 'Plum', 'Apricot'),
            buildLocalImageQuestion('', 'It is round and full of many tiny red seeds.', 'Pomegranate', 'Passion fruit', 'Guava'),
            buildLocalImageQuestion('', 'It is pink on the outside with white flesh and black seeds.', 'Dragon fruit', 'Melon', 'Lychee')
        ],
        bonus: [
            buildLocalImageQuestion('Fruits/Jigsaw/Lime.jpg', 'What fruit is this?', 'Lime', 'Lemon', 'Apple', { bonusPoints: BONUS_POINTS }),
            buildLocalImageQuestion('Fruits/Jigsaw/Starfruit.jpg', 'What fruit is this?', 'Starfruit', 'Banana', 'Mango', { bonusPoints: BONUS_POINTS }),
            buildLocalImageQuestion('Fruits/Jigsaw/Avocado.jpg', 'What fruit is this?', 'Avocado', 'Kiwi', 'Guava', { bonusPoints: BONUS_POINTS })
        ]
    },
    occupation: {
        level1: [
            buildLocalImageQuestion('Occupations/Level1/Teacher.png', 'What occupation is this?', 'Teacher', 'Student', 'Doctor'),
            buildLocalImageQuestion('Occupations/Level1/Soldier.png', 'What occupation is this?', 'Soldier', 'Police', 'Firefighter'),
            buildLocalImageQuestion('Occupations/Level1/Chef.png', 'What occupation is this?', 'Chef', 'Waiter', 'Baker'),
            buildLocalImageQuestion('Occupations/Level1/Nurse.png', 'What occupation is this?', 'Nurse', 'Doctor', 'Dentist'),
            buildLocalImageQuestion('Occupations/Level1/football player .png', 'What occupation is this?', 'football player ', 'tennis player', 'runner')
        ],
        level2: [
            buildLocalImageQuestion('Occupations/Level2/Dentist.JPG', 'What occupation is this?', 'Dentist', 'Doctor', 'Nurse'),
            buildLocalImageQuestion('Occupations/Level2/Pilot.png', 'What occupation is this?', 'Pilot', 'Driver', 'Captain'),
            buildLocalImageQuestion('Occupations/Level2/Singer.JPG', 'What occupation is this?', 'Singer', 'Actor', 'Dancer'),
            buildLocalImageQuestion('Occupations/Level2/Lawyer.JPG', 'What occupation is this?', 'Lawyer', 'Judge', 'Police'),
            buildLocalImageQuestion('Occupations/Level2/Firefighter.JPG', 'What occupation is this?', 'Firefighter', 'Police', 'Soldier')
        ],
        level3: [
            buildLocalImageQuestion('', 'This person travels in a spaceship to the moon.', 'Astronaut', 'Pilot', 'Scientist'),
            buildLocalImageQuestion('', 'This person grows food and takes care of animals.', 'Farmer', 'Chef', 'Gardener'),
            buildLocalImageQuestion('', 'This person uses a camera to take pictures.', 'Photographer', 'Artist', 'Reporter'),
            buildLocalImageQuestion('', 'This person delivers letters and boxes to your house.', 'Postman', 'Driver', 'Police'),
            buildLocalImageQuestion('', 'This person does magic tricks on stage.', 'Magician', 'Clown', 'Actor')
        ],
        bonus: [
            buildLocalImageQuestion('Occupations/Jigsaw/veterinarian.png', 'What occupation is this?', 'veterinarian', 'doctor', 'farmer', { bonusPoints: BONUS_POINTS }),
            buildLocalImageQuestion('Occupations/Jigsaw/Doctor.png', 'What occupation is this?', 'Doctor', 'Nurse', 'Dentist', { bonusPoints: BONUS_POINTS }),
            buildLocalImageQuestion('Occupations/Jigsaw/ Police.png', 'What occupation is this?', ' Police', 'Soldier', 'Guard', { bonusPoints: BONUS_POINTS })
        ]
    }
}

// ==========================================
// ส่วนควบคุมหน้าจอ (Screen Manager)
// ==========================================
function setScreen(screenName) {
    currentScreen = screenName
    const screens = ['start-screen', 'category-screen', 'countdown-screen', 'game-screen', 'question-screen', 'score-screen', 'final-screen', 'settings-screen']

    screens.forEach(s => {
        const el = document.getElementById(s)
        if (s === screenName) {
            el.classList.remove('hidden')
            setTimeout(() => el.classList.add('active'), 50)
        } else {
            el.classList.remove('active')
            el.classList.add('hidden')
        }
    })

    // คืนปุ่มเริ่มเล่นให้กดได้เมื่อย้อนกลับมาหน้าแรก
    if (screenName === 'start-screen' && btnStart) {
        btnStart.disabled = false
        btnStart.innerHTML = ''
    }

    // ซ่อนหรือแสดงกล้องตามหน้าจอเพื่อแยกกันให้ชัดเจน ไม่ให้ทับซ้อนกันในหน้าแรก
    const cameraBg = document.getElementById('camera-bg-container')
    if (cameraBg) {
        if (screenName === 'game-screen' || screenName === 'question-screen' || screenName === 'score-screen' || screenName === 'final-screen') {
            cameraBg.style.display = 'block'
        } else {
            cameraBg.style.display = 'none'
        }
    }

    // ล้างพอยน์เตอร์เมื่อไม่ได้อยู่ในหน้าตอบคำถาม หรือหน้าจบ
    if (screenName !== 'question-screen' && screenName !== 'final-screen') {
        p1Pointer.classList.add('hidden')
        p2Pointer.classList.add('hidden')
        resetOptionHover()
    }

    // ล้างการจับเวลาถอยหลังหน้ารายงานคะแนนหากเปลี่ยนไปหน้าอื่น
    if (screenName !== 'score-screen' && scoreCountdownInterval) {
        clearInterval(scoreCountdownInterval)
        scoreCountdownInterval = null
    }

    // เปลี่ยนเพลง BGM ตามหน้าจอ
    if (['start-screen', 'category-screen', 'settings-screen'].includes(screenName)) {
        playBGM('menu')
    } else if (['countdown-screen', 'game-screen', 'question-screen', 'score-screen'].includes(screenName)) {
        playBGM('game')
    } else if (screenName === 'final-screen') {
        playBGM('final')
    }
}

// ฟังก์ชันสร้างเสียง Beep โดย Web Audio API
function playBeep(freq, duration) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioCtx.destination)

        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime)

        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration)

        oscillator.start(audioCtx.currentTime)
        oscillator.stop(audioCtx.currentTime + duration)
    } catch (e) {
        console.error("Audio Context Error:", e)
    }
}

// ฟังก์ชันตีกลองด้วยไฟล์เสียง boom.mp3
let lastBoomTime = 0
let drumStopTimer = null
function playDrumSound(pitch = 140) {
    const now = Date.now()
    if (now - lastBoomTime < 100) return // กันเสียงรั่ว (จำกัดให้เล่นได้มากสุด 10 ครั้งต่อวินาที)
    lastBoomTime = now
    
    // รีสตาร์ทเสียงเดิมแทนการโคลน เพื่อไม่ให้เสียงซ้อนกันจนดังหนวกหู
    sfxBoom.currentTime = 0
    const p = sfxBoom.play()
    if (p !== undefined) p.catch(() => {})

    // ตัดหางเสียง (Echo) ทิ้ง ทันทีที่ผู้เล่นหยุดตี
    if (drumStopTimer) clearTimeout(drumStopTimer)
    drumStopTimer = setTimeout(() => {
        sfxBoom.pause()
    }, 250) // ถ้าหยุดตีเกิน 0.25 วินาที ให้ตัดเสียงเลย
}

// ==========================================
// Countdown Screen
// ==========================================

function startCountdown() {
    // Clear EXISTING interval FIRST - this is critical!
    if (countdownInterval) {
        clearInterval(countdownInterval)
        countdownInterval = null
    }

    setScreen('countdown-screen')
    const countdownNumberEl = document.getElementById('countdown-number')

    // Reset countdown element text immediately
    let count = 3
    countdownNumberEl.textContent = count
    countdownNumberEl.style.animation = 'none'
    void countdownNumberEl.offsetWidth
    countdownNumberEl.style.animation = 'popIn 0.9s ease-out forwards' // ใช้ 0.9s ป้องกันการซ้อนก่อนรอบถัดไป
    playBeep(440, 0.15) // C4 beep

    // Now start NEW interval
    countdownInterval = setInterval(() => {
        count--

        if (count === 0) {
            countdownNumberEl.textContent = 'START!'
            countdownNumberEl.style.animation = 'none'
            void countdownNumberEl.offsetWidth
            countdownNumberEl.style.animation = 'popIn 0.9s ease-out forwards'
            playBeep(880, 0.3) // High beep
        } else if (count < 0) {
            clearInterval(countdownInterval)
            countdownInterval = null
            isFirstRound = false
            startGameScreen()
        } else {
            countdownNumberEl.textContent = count
            countdownNumberEl.style.animation = 'none'
            void countdownNumberEl.offsetWidth
            countdownNumberEl.style.animation = 'popIn 0.9s ease-out forwards'
            playBeep(440, 0.15)
        }
    }, 1000)
}

// ==========================================
function startGameScreen() {
    setScreen('game-screen')

    // โหลด/เปิดกล้องเว็บแคมหลังจากผ่านหน้านับถอยหลังแล้ว
    if (!mediaStream) {
        startWebcam().catch(e => {
            console.error("ไม่สามารถเริ่มกล้องเว็บแคมได้:", e)
        })
    }

    // รีเซ็ตสถานะและตัวแปร
    p1Hp = 100
    p2Hp = 100
    p1Smashes = 0
    p2Smashes = 0
    isGameOver = false
    winner = null

    // รีเซ็ตตำแหน่งมือเพื่อป้องกันการกดทุบอัตโนมัติ (ล้างสถานะทุกมือของทั้ง 2 ฝั่ง)
    playerStates.p1.hands = []
    playerStates.p1.missingFrames = 0
    playerStates.p2.hands = []
    playerStates.p2.missingFrames = 0

    // เคลียร์แอนิเมชันน้ำแข็ง
    p1IceBlock.className = 'bongo-drums-wrapper ice-block'
    p2IceBlock.className = 'bongo-drums-wrapper ice-block'

    // เคลียร์รอยแตกทั้งหมด
    document.querySelectorAll('.crack-line').forEach(line => {
        line.classList.remove('visible')
    })

    updateGameScreenUI()
}

function updateGameScreenUI() {
    // Both progress independently from 0 to 1 (0 to 100%)
    const p1Factor = Math.min(1, p1Smashes / MAX_SMASHES)
    const p2Factor = Math.min(1, p2Smashes / MAX_SMASHES)

    const p1HpPortion = p1Factor * 100
    const p2HpPortion = p2Factor * 100

    // Update rainbow HP bar portions
    const p1HpEl = document.getElementById('p1-hp-portion')
    const p2HpEl = document.getElementById('p2-hp-portion')
    
    if (p1HpEl) {
        p1HpEl.style.left = '0';
        p1HpEl.style.width = `${p1HpPortion}%`
    }
    if (p2HpEl) {
        p2HpEl.style.right = '0';
        p2HpEl.style.width = `${p2HpPortion}%`
    }

    // Whoever is ahead gets a higher z-index to visually "eat" the other's overlapping space
    if (p1HpEl && p2HpEl) {
        if (p1Smashes > p2Smashes) {
            p1HpEl.style.zIndex = '2'
            p2HpEl.style.zIndex = '1'
        } else if (p2Smashes > p1Smashes) {
            p1HpEl.style.zIndex = '1'
            p2HpEl.style.zIndex = '2'
        } else {
            p1HpEl.style.zIndex = '1'
            p2HpEl.style.zIndex = '1'
        }
    }

    // Update cat positions to their absolute progress
    const p1ProgressCat = document.getElementById('p1-progress-cat')
    const p2ProgressCat = document.getElementById('p2-progress-cat')

    if (p1ProgressCat) {
        // P1 cat is at the end of P1's bar
        p1ProgressCat.style.left = `calc(${p1HpPortion}% - 60px)` 
        p1ProgressCat.style.zIndex = p1Smashes >= p2Smashes ? '12' : '11'
    }
    if (p2ProgressCat) {
        // P2 cat is at the end of P2's bar
        p2ProgressCat.style.right = `calc(${p2HpPortion}% - 60px)`
        p2ProgressCat.style.zIndex = p2Smashes > p1Smashes ? '12' : '11'
    }
}

// เอฟเฟกต์การแสดงผล 💥 ตรงตแหน่งมือทุบ
function showSmashBoom(x, y) {
    const boom = document.createElement('div')
    boom.className = 'smash-boom-effect'
    boom.textContent = '💥'
    boom.style.left = `${x}px`
    boom.style.top = `${y}px`
    document.body.appendChild(boom)

    setTimeout(() => {
        boom.remove()
    }, 600)
}

// อัปเดตการแสดงผลเส้นรอยแตกร้าวบนก้อนน้ำแข็ง
function updateIceCracks(playerKey, currentHp) {
    const crackOverlay = document.getElementById(playerKey + '-cracks')
    if (!crackOverlay) return

    const lines = crackOverlay.querySelectorAll('.crack-line')

    // กำหนดการแสดงผลรอยแตกตามระดับ HP (ลดลงทีละ 10% จากการทุบ 10 ครั้งแตก)
    // มีรอยแตกทั้งหมด 10 เส้น โชว์ตามจำนวนการทุบเลย (เช่น HP 90% โชว์ 1 เส้น, HP 80% โชว์ 2 เส้น)
    const visibleCount = Math.round(10 - (currentHp / 10))

    lines.forEach((line, index) => {
        if (index < visibleCount) {
            line.classList.add('visible')
        } else {
            line.classList.remove('visible')
        }
    })

    // กำหนดการสั่นเบาๆ เมื่อ HP เหลือต่ำกว่าหรือเท่ากับ 20% (ทุบไปแล้ว 8 ครั้งขึ้นไป)
    const iceBlock = (playerKey === 'p1') ? p1IceBlock : p2IceBlock
    if (currentHp > 0 && currentHp <= 20) {
        iceBlock.classList.add('vibrate-gentle')
    } else {
        iceBlock.classList.remove('vibrate-gentle')
    }
}

// ฟังก์ชันควบคุมการทุบน้ำแข็งสำเร็จ
function triggerSmash(playerKey, x, y, wristLandmark) {
    if (currentScreen !== 'game-screen' || isGameOver) return

    // ปิดเอฟเฟกต์ 💥 และฝุ่นสะเก็ดวิเศษตามที่ผู้ใช้ขอให้เอาออก
    // showSmashBoom(x, y);
    // spawnSmashParticles(wristLandmark, playerKey === 'p1' ? '#ffd700' : '#00f0ff'); // โทนเหลืองทอง / นีออนฟ้า

    // เล่นเสียงกลองสังเคราะห์ตามผู้เล่น
    if (playerKey === 'p1') {
        playDrumSound(140) // กลองผู้เล่น 1 (โทนสูงขึ้นเล็กน้อย)
    } else {
        playDrumSound(110) // กลองผู้เล่น 2 (โทนทุ้มต่ำกว่า)
    }

    if (playerKey === 'p1') {
        // They clash! P1 pushes P2 back but not too much so it doesn't drag forever
        if (p1Smashes + p2Smashes >= MAX_SMASHES) {
            p1Smashes += 2
            p2Smashes -= 1
        } else {
            p1Smashes++
        }
        
        // Ensure bounds
        p1Smashes = Math.min(MAX_SMASHES, p1Smashes)
        p2Smashes = Math.max(0, p2Smashes)
        
        p1Hp = Math.max(0, Math.round((1 - (p1Smashes / MAX_SMASHES)) * 100))
        p2Hp = Math.max(0, Math.round((1 - (p2Smashes / MAX_SMASHES)) * 100)) // P2 might have been pushed back
        
        updateGameScreenUI()
        updateIceCracks('p1', p1Hp)
        updateIceCracks('p2', p2Hp)

        // แอนิเมชันรัวกลอง Bongo Cat 🐱 และกลอง Bongo Drums 🥁
        const catContainer = document.getElementById('p1-bongo-cat')
        const catSide = (p1Smashes % 2 === 0) ? 'drumming-left' : 'drumming-right'
        const drumSide = (p1Smashes % 2 === 0) ? 'drum-hit-left' : 'drum-hit-right'

        if (catContainer) {
            catContainer.classList.remove('drumming-left', 'drumming-right')
            void catContainer.offsetWidth
            catContainer.classList.add(catSide)
            setTimeout(() => catContainer.classList.remove('drumming-left', 'drumming-right'), 120)
        }

        if (p1IceBlock) {
            p1IceBlock.classList.remove('drum-hit-left', 'drum-hit-right')
            void p1IceBlock.offsetWidth
            p1IceBlock.classList.add(drumSide)
            setTimeout(() => p1IceBlock.classList.remove('drum-hit-left', 'drum-hit-right'), 100)
        }

        // Animate the bongo drums image!
        const p1BongoImg = p1IceBlock ? p1IceBlock.querySelector('.bongo-drums-img') : null
        if (p1BongoImg) {
            p1BongoImg.classList.remove('drum-hit')
            void p1BongoImg.offsetWidth
            p1BongoImg.classList.add('drum-hit')
            setTimeout(() => {
                p1BongoImg.classList.remove('drum-hit')
            }, 200)
        }
        
        // Animate P1 Progress Cat hitting the health bar!
        const p1ProgressCat = document.getElementById('p1-progress-cat')
        if (p1ProgressCat) {
            p1ProgressCat.src = 'blood/cat2.png'
            if (p1ProgressCat.animTimer) clearTimeout(p1ProgressCat.animTimer)
            p1ProgressCat.animTimer = setTimeout(() => {
                p1ProgressCat.src = 'blood/cat1.png'
            }, 120)
        }

        if (p1Hp === 0) {
            endSmashGame('p1')
        }
    } else {
        // They clash! P2 pushes P1 back but not too much so it doesn't drag forever
        if (p1Smashes + p2Smashes >= MAX_SMASHES) {
            p2Smashes += 2
            p1Smashes -= 1
        } else {
            p2Smashes++
        }
        
        // Ensure bounds
        p2Smashes = Math.min(MAX_SMASHES, p2Smashes)
        p1Smashes = Math.max(0, p1Smashes)
        
        p2Hp = Math.max(0, Math.round((1 - (p2Smashes / MAX_SMASHES)) * 100))
        p1Hp = Math.max(0, Math.round((1 - (p1Smashes / MAX_SMASHES)) * 100)) // P1 might have been pushed back
        
        updateGameScreenUI()
        updateIceCracks('p2', p2Hp)
        updateIceCracks('p1', p1Hp)

        // แอนิเมชันรัวกลอง Bongo Cat 🐱 และกลอง Bongo Drums 🥁
        const catContainer = document.getElementById('p2-bongo-cat')
        const catSide = (p2Smashes % 2 === 0) ? 'drumming-left' : 'drumming-right'
        const drumSide = (p2Smashes % 2 === 0) ? 'drum-hit-left' : 'drum-hit-right'

        if (catContainer) {
            catContainer.classList.remove('drumming-left', 'drumming-right')
            void catContainer.offsetWidth
            catContainer.classList.add(catSide)
            setTimeout(() => catContainer.classList.remove('drumming-left', 'drumming-right'), 120)
        }

        if (p2IceBlock) {
            p2IceBlock.classList.remove('drum-hit-left', 'drum-hit-right')
            void p2IceBlock.offsetWidth
            p2IceBlock.classList.add(drumSide)
            setTimeout(() => p2IceBlock.classList.remove('drum-hit-left', 'drum-hit-right'), 100)
        }

        // Animate the bongo drums image!
        const p2BongoImg = p2IceBlock ? p2IceBlock.querySelector('.bongo-drums-img') : null
        if (p2BongoImg) {
            p2BongoImg.classList.remove('drum-hit')
            void p2BongoImg.offsetWidth
            p2BongoImg.classList.add('drum-hit')
            setTimeout(() => {
                p2BongoImg.classList.remove('drum-hit')
            }, 200)
        }
        
        // Animate P2 Progress Cat hitting the health bar!
        const p2ProgressCat = document.getElementById('p2-progress-cat')
        if (p2ProgressCat) {
            p2ProgressCat.src = 'blood/cat2.png'
            if (p2ProgressCat.animTimer) clearTimeout(p2ProgressCat.animTimer)
            p2ProgressCat.animTimer = setTimeout(() => {
                p2ProgressCat.src = 'blood/cat1.png'
            }, 120)
        }

        if (p2Hp === 0) {
            endSmashGame('p2')
        }
    }
}

// ฟังก์ชันแสดงเอฟเฟกต์สะเก็ดโน้ตดนตรี 🎵🎶 ตอนกลองถูกเคาะครบ
function showShatterExplosion(playerKey) {
    const iceBlock = (playerKey === 'p1') ? p1IceBlock : p2IceBlock
    const rect = iceBlock.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    for (let i = 0; i < 20; i++) {
        const emoji = document.createElement('div')
        emoji.className = 'shatter-emoji-particle'
        const musicEmojis = ['🎵', '🎶', '🥁', '✨', '⭐']
        emoji.textContent = musicEmojis[Math.floor(Math.random() * musicEmojis.length)]
        emoji.style.left = `${centerX}px`
        emoji.style.top = `${centerY}px`
        emoji.style.position = 'absolute'

        const angle = Math.random() * Math.PI * 2
        const velocity = 6 + Math.random() * 10
        const vx = Math.cos(angle) * velocity
        const vy = Math.sin(angle) * velocity - 3

        document.body.appendChild(emoji)

        let posX = centerX
        let posY = centerY
        let alpha = 1
        let scale = 1 + Math.random() * 0.8

        const animate = () => {
            posX += vx
            posY += vy
            alpha -= 0.015
            scale -= 0.01

            emoji.style.left = `${posX}px`
            emoji.style.top = `${posY}px`
            emoji.style.opacity = alpha
            emoji.style.transform = `translate(-50%, -50%) scale(${scale})`

            if (alpha > 0) {
                requestAnimationFrame(animate)
            } else {
                emoji.remove()
            }
        }
        requestAnimationFrame(animate)
    }
}

// จบการทุบน้ำแข็ง
function endSmashGame(winningPlayer) {
    isGameOver = true
    winner = winningPlayer

    const winningIce = (winner === 'p1') ? p1IceBlock : p2IceBlock
    winningIce.classList.add('shatter')

    // แอฟเฟกต์ระเบิดหน้าจอและเสียงระเบิด (ใช้ Vine Boom)
    const explodeSFX = sfxVineBoom.cloneNode()
    explodeSFX.volume = 1.0
    explodeSFX.play().catch(()=>{})

    document.getElementById('game-screen').animate([
        { transform: 'translate(0, 0) rotate(0deg)' },
        { transform: 'translate(20px, 20px) rotate(1deg)' },
        { transform: 'translate(-20px, -20px) rotate(-1deg)' },
        { transform: 'translate(20px, -20px) rotate(1deg)' },
        { transform: 'translate(-20px, 20px) rotate(-1deg)' },
        { transform: 'translate(0, 0) rotate(0deg)' }
    ], { duration: 600, easing: 'ease-out' })
    // showShatterExplosion(winner); // ปิดเอฟเฟกต์ ✨💥 ตามที่ผู้ใช้ขอให้เอาออก

    setTimeout(() => {
        setScreen('question-screen')
        startQuestionPhase()
    }, 1500) // รอให้แอนิเมชันแตกตัวช้าลงเสร็จก่อนค่อยเข้าสู่หน้าคำถาม
}


// ==========================================
// หน้าที่ 4: หน้าตอบคำถาม (QUESTION SCREEN)
// ==========================================
function getOpponentKey(playerKey) {
    return playerKey === 'p1' ? 'p2' : 'p1'
}

function getPlayerScore(playerKey) {
    return playerKey === 'p1' ? p1OverallScore : p2OverallScore
}

function shouldTriggerBonusRound() {
    // ปิดการจำกัดจำนวนครั้งของ Jigsaw เพื่อให้มันสุ่มออกได้เรื่อยๆ
    // if (bonusQuestionIndex >= bonusQuestionPool.length) return false
    
    // ตั้งค่าตัวแปรเก็บว่าโบนัสครั้งล่าสุดออกมาตอนไหน
    if (window.lastBonusAt === undefined) window.lastBonusAt = -99;
    
    // เว้นระยะอย่างน้อย 3 คำถาม ถึงจะมีโอกาสออก Jigsaw อีกครั้ง (ไม่ออกถี่ติดกัน)
    if (totalQuestionsAnswered < 2) return false;
    if (totalQuestionsAnswered - window.lastBonusAt < 3) return false;
    
    // สุ่มโอกาส 30% ที่จะเจอด่าน Jigsaw
    if (Math.random() < 0.30) {
        window.lastBonusAt = totalQuestionsAnswered;
        return true;
    }
    
    return false;
}

function getNextQuestionForRound() {
    isBonusLevel = shouldTriggerBonusRound()
    revealedSquares = []

    if (isBonusLevel) {
        // สุ่มเลือกว่าจะได้ข้อไหนตอบก่อนใน Jigsaw (สุ่มจากคลังโบนัสโดยตรง)
        let availablePool = bonusQuestionPool;
        if (availablePool.length > 1 && window.lastBonusQuestionId) {
            // ไม่ให้สุ่มได้ข้อที่เพิ่งตอบไปรอบที่แล้ว (ป้องกันข้อซ้ำติดกัน)
            availablePool = availablePool.filter(q => q.questionId !== window.lastBonusQuestionId);
        }
        const randomIndex = Math.floor(Math.random() * availablePool.length);
        currentQuestion = availablePool[randomIndex];
        window.lastBonusQuestionId = currentQuestion.questionId;
        
        currentLevel = 0
        bonusRevealsRemaining = BONUS_MAX_REVEALS

        // ตอนนี้เราไม่สุ่มคนตอบแล้ว จะใช้คนที่ชนะตีกลองได้สิทธิ์ตอบเสมอ
        // ค่าตัวแปร winner ถูกตั้งมาแล้วจาก endSmashGame()

        if (winner === 'p1') p1JigsawCount++
        else p2JigsawCount++

        return
    }

    if (gameQuestionIndex >= gameQuestionPool.length) {
        buildQuestionPools(selectedCategory, false)
    }

    currentQuestion = gameQuestionPool[gameQuestionIndex]
    gameQuestionIndex++
    currentLevel = currentQuestion.level || 1
    bonusRevealsRemaining = 0
}

function getRoundBadgeConfig() {
    if (isBonusLevel) {
        return { text: 'Bonus Jigsaw', className: 'bonus-badge' }
    }

    switch (currentLevel) {
        case 1:
            return { text: 'Level 1', className: 'level1-badge' }
        case 2:
            return { text: 'Level 2', className: 'level2-badge' }
        case 3:
            return { text: 'Level 3', className: 'level3-badge' }
        default:
            return { text: 'Level 1', className: 'level1-badge' }
    }
}

function getQuestionModeText() {
    if (isBonusLevel) return 'เลือกเปิดช่องภาพเองได้ 3 ครั้ง แล้วตอบให้ถูกเพื่อรับโบนัส'
    if (currentLevel === 1) return 'ดูรูปภาพแล้วตอบคำศัพท์ภาษาอังกฤษ'
    if (currentLevel === 2) return 'ดูรูปภาพแล้วทายคำศัพท์ภาษาอังกฤษ'
    return 'อ่านคำอธิบายยาวๆ แล้วตอบว่าเป็นคำศัพท์อะไร'
}

function buildJigsawBoardHTML() {
    const squaresHTML = Array.from({ length: 36 }, (_, index) => `
        <button class="jigsaw-square hover-target${revealedSquares.includes(index) ? ' revealed' : ''}" data-hover-key="JIGSAW_${index}" data-square="${index}" ${revealedSquares.includes(index) || bonusRevealsRemaining <= 0 ? 'disabled' : ''}></button>
    `).join('')
    
    let imageStyles = ''
    
    // สุ่มขนาดให้เล็กลงมาก (35% - 50%) เพื่อให้สามารถไปอยู่ตามมุมซ้ายสุด ขวาสุด บนสุด หรือล่างสุดได้แบบอิสระเต็มที่
    // จะได้ไม่มีทางจำตำแหน่งเดิมได้เลย
    const size = 35 + Math.floor(Math.random() * 15)
    const maxPos = 100 - size
    let top = Math.floor(Math.random() * maxPos)
    let left = Math.floor(Math.random() * maxPos)
    
    // ดันไม่ให้อยู่ตรงกลางเป๊ะเกินไป
    if (top > (maxPos/2 - 10) && top < (maxPos/2 + 10)) {
        top = Math.random() > 0.5 ? 0 : maxPos
    }
    if (left > (maxPos/2 - 10) && left < (maxPos/2 + 10)) {
        left = Math.random() > 0.5 ? 0 : maxPos
    }
    
    imageStyles = `width: ${size}%; height: ${size}%; position: absolute; top: ${top}%; left: ${left}%; object-fit: contain;`

    return `
        <div class="bonus-reveal-bar" style="margin-bottom: 5px;">
            <div class="reveals-counter">เลือกเปิดได้อีก <span id="reveals-count">${bonusRevealsRemaining}</span> ช่อง</div>
        </div>
        <div class="jigsaw-container" style="background: #fff;">
            <img src="${currentQuestion.image}" class="jigsaw-image" style="${imageStyles}" alt="Bonus jigsaw image">
            <div class="jigsaw-overlay">
                ${squaresHTML}
            </div>
        </div>
        <div class="jigsaw-reveal-note" style="margin-top: 5px; font-size: 1.1rem;">ใช้นิ้วชี้ค้างบนช่องที่อยากเปิดได้เอง เปิดได้ทั้งหมด 3 ครั้ง</div>
    `
}

function buildQuestionVisualHTML() {
    if (isBonusLevel) {
        return buildJigsawBoardHTML()
    }

    if (!currentQuestion.image || currentLevel === 3) {
        return `<div class="no-image-spacer"></div>`
    }

    return `
        <div class="question-image-box question-image-box-level-${currentLevel}">
            <img src="${currentQuestion.image}" class="question-image-display" alt="Question image">
        </div>
    `
}

function buildAnswerButtonsHTML() {
    return shuffledOptions.map((opt, index) => `
        <button class="option-btn hover-target" data-hover-key="${opt.key}">
            <span class="btn-label">${String.fromCharCode(65 + index)}</span>
            <span class="btn-text">${opt.text}</span>
            <div class="progress-fill"></div>
        </button>
    `).join('')
}

function initializeHoverTargets(container) {
    optionProgress = {}
    hoveredOptionBtn = null
    lastTimeOnButton = 0
    lastHoverUpdateTime = null

    const buttons = container.querySelectorAll('.hover-target')
    buttons.forEach(btn => {
        optionProgress[btn.dataset.hoverKey] = 0
        const progressFill = btn.querySelector('.progress-fill')
        if (progressFill) progressFill.style.width = '0%'
        btn.style.setProperty('--progress', '0%')
    })
}

function startQuestionPhase() {
    isQuestionActive = true
    isQuestionFinished = false
    getNextQuestionForRound()

    shuffledOptions = shuffleArray(
        Object.keys(currentQuestion.options).map(key => ({
            key,
            text: currentQuestion.options[key]
        }))
    )
    correctOptionKey = currentQuestion.correct

    const winnerSideId = (winner === 'p1') ? 'p1-question-container' : 'p2-question-container'
    const loserSideId = (winner === 'p1') ? 'p2-question-container' : 'p1-question-container'

    const winnerContainer = document.getElementById(winnerSideId)
    const loserContainer = document.getElementById(loserSideId)

    const progressText = isBonusLevel
        ? `Bonus ${questionsAnsweredBonus + 1}/3`
        : `Question ${totalQuestionsAnswered + 1}/${getTotalNormalQuestions()}`
        
    const progressBadgeHTML = `<div style="position: absolute; right: 10px; top: 10px; background: rgba(0,0,0,0.6); color: white; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 1.1rem; z-index: 10; font-family: 'Fredoka', sans-serif;">${progressText}</div>`

    loserContainer.innerHTML = `
        <div class="wait-container" style="position: relative;">
            ${progressBadgeHTML}
            <span class="wait-emoji">🥁</span>
            <p class="wait-text">รออีกฝั่งตอบคำถาม</p>
            <p class="wait-subtext">ผู้ที่ชนะตอนตีกลองจะได้สิทธิ์ตอบก่อน</p>
        </div>
    `

    const badgeConfig = getRoundBadgeConfig()
    const categoryInfo = categoryMeta[selectedCategory] || { label: '', emoji: '' }

    winnerContainer.innerHTML = `
        <div class="winner-active-box" style="padding: 10px 20px; position: relative;">
            ${progressBadgeHTML}
            <div class="question-meta-strip" style="margin-bottom: 5px; justify-content: center;">
                <div class="timer-box" style="margin: 0; padding: 4px 12px; font-size: 1.3rem;">⏰ <span class="timer-text">2:00</span></div>
            </div>

            <div class="question-header" style="justify-content: center; margin-bottom: 5px;">
                <div class="question-player-block" style="gap: 10px;">
                    <span class="q-player-label ${winner === 'p1' ? 'p1-tag' : 'p2-tag'}" style="font-size: 1.2rem; padding: 4px 12px; background: ${winner === 'p1' ? '#ffebee' : '#e3f2fd'}; color: ${winner === 'p1' ? '#c62828' : '#1565c0'}; border: 2px solid ${winner === 'p1' ? '#ffcdd2' : '#bbdefb'};">
                        ${winner === 'p1' ? 'Player 1 🔴' : 'Player 2 🔵'}
                    </span>
                    <div class="level-badge ${badgeConfig.className}" style="font-size: 1rem; padding: 4px 10px;">${badgeConfig.text}</div>
                </div>
            </div>
            
            ${buildQuestionVisualHTML()}
            
            <div class="question-text-content ${currentLevel === 3 ? 'question-text-long' : ''}" style="font-size: ${currentLevel === 3 ? '2.2rem' : '1.25rem'}; font-weight: ${currentLevel === 3 ? 'bold' : 'normal'}; margin: ${currentLevel === 3 ? '15px' : '4px'} 0; color: #5c6bc0;">
                ${currentQuestion.text}
            </div>
            
            <div class="options-grid">
                ${buildAnswerButtonsHTML()}
            </div>
        </div>
    `

    initializeHoverTargets(winnerContainer)
    startQuestionTimer()
}

function updateBonusRevealUI() {
    const winnerSideId = (winner === 'p1') ? 'p1-question-container' : 'p2-question-container'
    const container = document.getElementById(winnerSideId)
    if (!container || !isBonusLevel) return

    const revealCountEl = container.querySelector('#reveals-count')
    if (revealCountEl) revealCountEl.textContent = bonusRevealsRemaining
    container.querySelectorAll('.jigsaw-square').forEach(square => {
        const squareIndex = Number(square.dataset.square)
        square.disabled = revealedSquares.includes(squareIndex) || bonusRevealsRemaining <= 0
    })
}

function resetHoverProgressImmediately(container) {
    const targetContainer = container || document.getElementById((winner === 'p1') ? 'p1-question-container' : 'p2-question-container')
    if (!targetContainer) return

    hoveredOptionBtn = null
    lastTimeOnButton = 0
    lastHoverUpdateTime = Date.now()

    targetContainer.querySelectorAll('.hover-target').forEach(btn => {
        const key = btn.dataset.hoverKey
        optionProgress[key] = 0
        btn.classList.remove('hovering')
        const progressFill = btn.querySelector('.progress-fill')
        if (progressFill) progressFill.style.width = '0%'
        btn.style.setProperty('--progress', '0%')
    })
}

function revealJigsawSquare(squareIndex) {
    if (!isBonusLevel || bonusRevealsRemaining <= 0 || revealedSquares.includes(squareIndex)) return

    const winnerSideId = (winner === 'p1') ? 'p1-question-container' : 'p2-question-container'
    const container = document.getElementById(winnerSideId)
    if (!container) return

    const targetSquare = container.querySelector(`[data-square="${squareIndex}"]`)
    if (!targetSquare) return

    revealedSquares.push(squareIndex)
    targetSquare.classList.add('revealed')
    bonusRevealsRemaining = Math.max(0, bonusRevealsRemaining - 1)
    updateBonusRevealUI()
    playSFX(sfxCorrect)
}

function handleHoverTargetActivation(targetKey) {
    if (targetKey === 'final-newgame') {
        const btn = document.getElementById('btn-play-same-category')
        if (btn) btn.click()
        resetOptionHover()
        return
    }
    if (targetKey === 'final-home') {
        const btn = document.getElementById('btn-back-home')
        if (btn) btn.click()
        resetOptionHover()
        return
    }
    if (targetKey.startsWith('JIGSAW_')) {
        revealJigsawSquare(Number(targetKey.replace('JIGSAW_', '')))
        resetHoverProgressImmediately()
        return
    }

    selectOption(targetKey)
}

// ระบบเวลาถอยหลัง 2 นาที
function startQuestionTimer() {
    timeLeft = 120
    updateTimerUI()
    clearInterval(timerInterval)

    timerInterval = setInterval(() => {
        timeLeft--
        updateTimerUI()
        if (timeLeft <= 0) {
            clearInterval(timerInterval)
            onQuestionTimeout()
        }
    }, 1000)
}

function stopQuestionTimer() {
    clearInterval(timerInterval)
}

function updateTimerUI() {
    const min = Math.floor(timeLeft / 60)
    const sec = timeLeft % 60
    const formatted = `${min}:${sec < 10 ? '0' : ''}${sec}`

    const timerEls = document.querySelectorAll('.timer-text')
    timerEls.forEach(el => {
        el.textContent = formatted
    })
}

// ตรวจสอบตำแหน่งการชี้ตัวเลือก
function updateOptionHover(x, y) {
    let container
    if (currentScreen === 'final-screen') {
        container = document.getElementById('final-buttons-container')
    } else {
        const winnerSideId = (winner === 'p1') ? 'p1-question-container' : 'p2-question-container'
        container = document.getElementById(winnerSideId)
    }
    if (!container) return

    const now = Date.now()
    if (!lastHoverUpdateTime) lastHoverUpdateTime = now
    const dt = (now - lastHoverUpdateTime) / 1000 // วินาที
    lastHoverUpdateTime = now

    const buttons = [...container.querySelectorAll('.hover-target:not([disabled])')]
    let physicalHoveredBtn = null

    for (const btn of buttons) {
        const rect = btn.getBoundingClientRect()
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            physicalHoveredBtn = btn
            break
        }
    }

    if (physicalHoveredBtn) {
        hoveredOptionBtn = physicalHoveredBtn
        lastTimeOnButton = now
    } else {
        if (hoveredOptionBtn && (now - lastTimeOnButton < 300)) {
        } else {
            hoveredOptionBtn = null
        }
    }

    const hoveredOption = hoveredOptionBtn ? hoveredOptionBtn.dataset.hoverKey : null
    let activatedTargetKey = null

    buttons.forEach(btn => {
        const opt = btn.dataset.hoverKey
        const progressFill = btn.querySelector('.progress-fill')
        if (typeof optionProgress[opt] !== 'number') optionProgress[opt] = 0

        if (opt === hoveredOption) {
            if (optionProgress[opt] === 0) {
                // เล่นเสียงเอฟเฟกต์ทันทีเมื่อเริ่มชี้ (ตามที่ขอ "พอชี้ปุ๊บเสียงนี้ขึ้นมาเลย")
                playSFX(sfxInterface)
            }
            optionProgress[opt] = Math.min(100, optionProgress[opt] + 50 * dt)
            btn.classList.add('hovering')

            if (optionProgress[opt] >= 100) {
                activatedTargetKey = opt
            }
        } else {
            optionProgress[opt] = Math.max(0, optionProgress[opt] - 50 * dt)
            btn.classList.remove('hovering')
        }

        if (progressFill) {
            progressFill.style.width = `${optionProgress[opt]}%`
        }
        btn.style.setProperty('--progress', `${optionProgress[opt]}%`)
    })

    if (activatedTargetKey) {
        handleHoverTargetActivation(activatedTargetKey)
    }
}

function resetOptionHover() {
    let container
    if (currentScreen === 'final-screen') {
        container = document.getElementById('final-buttons-container')
    } else {
        const winnerSideId = (winner === 'p1') ? 'p1-question-container' : 'p2-question-container'
        container = document.getElementById(winnerSideId)
    }
    if (!container) return

    const now = Date.now()
    const dt = lastHoverUpdateTime ? (now - lastHoverUpdateTime) / 1000 : 0.016
    lastHoverUpdateTime = now

    // ล้างสถานะ Hysteresis ทันทีเมื่อเรียกใช้ฟังก์ชันรีเซ็ตเต็มรูปแบบ
    hoveredOptionBtn = null

    const buttons = container.querySelectorAll('.hover-target')
    buttons.forEach(btn => {
        const opt = btn.dataset.hoverKey
        const progressFill = btn.querySelector('.progress-fill')
        if (typeof optionProgress[opt] !== 'number') optionProgress[opt] = 0

        optionProgress[opt] = Math.max(0, optionProgress[opt] - 50 * dt)
        btn.classList.remove('hovering')

        if (progressFill) {
            progressFill.style.width = `${optionProgress[opt]}%`
        }
        btn.style.setProperty('--progress', `${optionProgress[opt]}%`)
    })
}

function recordQuestionCompletion() {
    if (isBonusLevel) {
        questionsAnsweredBonus++
        return
    }

    totalQuestionsAnswered++
    switch (currentLevel) {
        case 1:
            questionsAnsweredLevel1++
            break
        case 2:
            questionsAnsweredLevel2++
            break
        case 3:
            questionsAnsweredLevel3++
            break
    }
}

function isNormalGameFinished() {
    return totalQuestionsAnswered >= getTotalNormalQuestions()
}

function getFinalWinnerKey() {
    if (p1OverallScore === p2OverallScore) return null // เสมอให้ชนะคู่ไปเลย
    return p1OverallScore > p2OverallScore ? 'p1' : 'p2'
}

function proceedAfterQuestion(outcomeText, roundLabel) {
    if (isNormalGameFinished()) {
        showFinalScreen()
        return
    }

    showScoreScreen(outcomeText, roundLabel)
}

function selectOption(option) {
    if (isQuestionFinished) return
    isQuestionFinished = true
    stopQuestionTimer()

    p1Pointer.classList.add('hidden')
    p2Pointer.classList.add('hidden')

    const winnerSideId = (winner === 'p1') ? 'p1-question-container' : 'p2-question-container'
    const container = document.getElementById(winnerSideId)

    const feedbackOverlay = document.createElement('div')
    feedbackOverlay.className = 'feedback-overlay'

    let outcomeText = ""
    const roundLabel = isBonusLevel ? 'Bonus Jigsaw' : `Level ${currentLevel}`
    const pointValue = isBonusLevel ? (currentQuestion.bonusPoints || BONUS_POINTS) : 1

    if (option === currentQuestion.correct) {
        feedbackOverlay.innerHTML = `
            <span class="feedback-emoji">✅</span>
            <div class="feedback-title feedback-correct">Correct! +${pointValue} ${pointValue > 1 ? 'Points' : 'Point'}</div>
        `
        playSFX(sfxAnswer)

        if (winner === 'p1') {
            p1OverallScore += pointValue
        } else {
            p2OverallScore += pointValue
        }

        outcomeText = `${winner === 'p1' ? 'Player 1 🔴' : 'Player 2 🔵'} answered correctly! +${pointValue} ${pointValue > 1 ? 'Points' : 'Point'} 🎉`
    } else {
        const correctAnswer = currentQuestion.options[currentQuestion.correct]
        feedbackOverlay.innerHTML = `
            <span class="feedback-emoji">❌</span>
            <div class="feedback-title feedback-wrong">Wrong Answer!</div>
            <div style="margin-top:15px; font-size: 1.2rem; font-weight:bold; color:#27ae60;">
                คำตอบที่ถูกคือ: ${correctAnswer}
            </div>
        `
        playSFX(sfxError)
        outcomeText = `${winner === 'p1' ? 'Player 1 🔴' : 'Player 2 🔵'} answered wrong! ❌ (Correct answer was ${correctAnswer})`
    }

    recordQuestionCompletion()

    // Highlight correct and wrong options
    const optionBtns = container.querySelectorAll('.option-btn')
    optionBtns.forEach(btn => {
        btn.classList.remove('hovering')
        if (btn.dataset.hoverKey === currentQuestion.correct) {
            btn.classList.add('correct-choice')
        } else if (btn.dataset.hoverKey === option && option !== currentQuestion.correct) {
            btn.classList.add('wrong-choice')
        }
    })

    // Reveal jigsaw if bonus level
    if (isBonusLevel) {
        container.querySelectorAll('.jigsaw-square').forEach(sq => sq.classList.add('revealed'))
        const jigsawImg = container.querySelector('.jigsaw-image')
        if (jigsawImg) {
            jigsawImg.style.width = '100%'
            jigsawImg.style.height = '100%'
            jigsawImg.style.objectFit = 'contain'
            jigsawImg.style.transition = 'all 0.5s ease'
            jigsawImg.style.top = '0'
            jigsawImg.style.left = '0'
        }
    }

    setTimeout(() => {
        proceedAfterQuestion(outcomeText, roundLabel)
    }, 3000)
}

function onQuestionTimeout() {
    if (isQuestionFinished) return
    isQuestionFinished = true

    stopQuestionTimer()
    p1Pointer.classList.add('hidden')
    p2Pointer.classList.add('hidden')

    const winnerSideId = (winner === 'p1') ? 'p1-question-container' : 'p2-question-container'
    const container = document.getElementById(winnerSideId)

    const feedbackOverlay = document.createElement('div')
    feedbackOverlay.className = 'feedback-overlay'
    feedbackOverlay.innerHTML = `
        <span class="feedback-emoji">⏰</span>
        <div class="feedback-title feedback-timeout">Time's Up! 😢</div>
    `

    playBeep(180, 0.5)

    // feedbackOverlay removed to not block the image

    const outcomeText = `${winner === 'p1' ? 'Player 1 🔴' : 'Player 2 🔵'} ran out of time! ⏰`
    const roundLabel = isBonusLevel ? 'Bonus Jigsaw' : `Level ${currentLevel}`
    recordQuestionCompletion()

    // Highlight correct option on timeout
    const optionBtns = container.querySelectorAll('.option-btn')
    optionBtns.forEach(btn => {
        btn.classList.remove('hovering')
        if (btn.dataset.hoverKey === currentQuestion.correct) {
            btn.classList.add('correct-choice')
        }
    })

    if (isBonusLevel) {
        container.querySelectorAll('.jigsaw-square').forEach(sq => sq.classList.add('revealed'))
        const jigsawImg = container.querySelector('.jigsaw-image')
        if (jigsawImg) {
            jigsawImg.style.width = '100%'
            jigsawImg.style.height = '100%'
            jigsawImg.style.objectFit = 'contain'
            jigsawImg.style.transition = 'all 0.5s ease'
            jigsawImg.style.top = '0'
            jigsawImg.style.left = '0'
        }
    }

    setTimeout(() => {
        proceedAfterQuestion(outcomeText, roundLabel)
    }, 3000)
}

function showScoreScreen(outcomeText, roundLabel = 'Last Round') {
    setScreen('score-screen')

    document.getElementById('p1-overall-score-display').textContent = p1OverallScore
    document.getElementById('p2-overall-score-display').textContent = p2OverallScore

    const badgeEl = document.getElementById('round-result-badge')
    if (badgeEl) badgeEl.textContent = roundLabel
    const detailEl = document.getElementById('round-result-detail')
    if (detailEl) detailEl.textContent = outcomeText

    let countdownVal = 3
    const timerEl = document.getElementById('score-timer-count')
    if (timerEl) timerEl.textContent = countdownVal

    if (scoreCountdownInterval) {
        clearInterval(scoreCountdownInterval)
    }

    scoreCountdownInterval = setInterval(() => {
        countdownVal--
        if (timerEl) timerEl.textContent = countdownVal

        if (countdownVal <= 0) {
            clearInterval(scoreCountdownInterval)
            scoreCountdownInterval = null
            startNextRound()
        }
    }, 1000)
}

function startNextRound() {
    if (scoreCountdownInterval) {
        clearInterval(scoreCountdownInterval)
        scoreCountdownInterval = null
    }
    currentRound++
    startGameScreen()
}

function resetMatchState(preserveCategory = false) {
    if (scoreCountdownInterval) {
        clearInterval(scoreCountdownInterval)
        scoreCountdownInterval = null
    }

    // รีเซ็ตคะแนนรวม
    p1OverallScore = 0
    p2OverallScore = 0

    // Reset all level tracking variables
    currentLevel = 1
    isBonusLevel = false
    questionsAnsweredLevel1 = 0
    questionsAnsweredLevel2 = 0
    questionsAnsweredLevel3 = 0
    questionsAnsweredBonus = 0
    totalQuestionsAnswered = 0
    bonusRevealsRemaining = 0
    revealedSquares = []
    currentRound = 1
    isFirstRound = false
    selectedCategory = preserveCategory ? selectedCategory : null
    gameQuestionPool = []
    gameQuestionIndex = 0
    bonusQuestionPool = []
    bonusQuestionIndex = 0
    p1JigsawCount = 0
    p2JigsawCount = 0
    winner = null
    currentQuestion = null
    correctOptionKey = ''
    shuffledOptions = []
}

function resetGameScores() {
    resetMatchState(false)
    setScreen('start-screen')
}

function showFinalScreen() {
    if (scoreCountdownInterval) {
        clearInterval(scoreCountdownInterval)
        scoreCountdownInterval = null
    }

    const finalWinner = getFinalWinnerKey()
    
    const p1Anim = document.getElementById('p1-final-anim')
    const p2Anim = document.getElementById('p2-final-anim')
    const p1Badge = document.getElementById('p1-final-badge')
    const p2Badge = document.getElementById('p2-final-badge')

    const winAnimHTML = `
        <img class="anim-frame frame1" src="end/win1.png">
        <img class="anim-frame frame2" src="end/win2.png">
    `
    const cryAnimHTML = `
        <img class="anim-frame frame1" src="end/cry1.png">
        <img class="anim-frame frame2" src="end/cry2.png">
        <img class="anim-frame frame3" src="end/cry3.png">
    `

    if (finalWinner === 'p1') {
        if (p1Anim) { p1Anim.className = 'anim-win'; p1Anim.innerHTML = winAnimHTML; }
        if (p2Anim) { p2Anim.className = 'anim-cry'; p2Anim.innerHTML = cryAnimHTML; }
        if (p1Badge) p1Badge.src = 'end/winner-jukebox-bg-removed.png'
        if (p2Badge) p2Badge.src = 'end/Lose.png'
    } else if (finalWinner === 'p2') {
        if (p1Anim) { p1Anim.className = 'anim-cry'; p1Anim.innerHTML = cryAnimHTML; }
        if (p2Anim) { p2Anim.className = 'anim-win'; p2Anim.innerHTML = winAnimHTML; }
        if (p1Badge) p1Badge.src = 'end/Lose.png'
        if (p2Badge) p2Badge.src = 'end/winner-jukebox-bg-removed.png'
    } else {
        if (p1Anim) { p1Anim.className = 'anim-win'; p1Anim.innerHTML = winAnimHTML; }
        if (p2Anim) { p2Anim.className = 'anim-win'; p2Anim.innerHTML = winAnimHTML; }
        if (p1Badge) p1Badge.src = 'end/winner-jukebox-bg-removed.png'
        if (p2Badge) p2Badge.src = 'end/winner-jukebox-bg-removed.png'
    }

    setScreen('final-screen')
}

function playSameCategoryAgain() {
    if (!selectedCategory) {
        resetGameScores()
        return
    }

    resetMatchState(true)
    buildQuestionPools(selectedCategory, true)
    startGameScreen()
}

// ==========================================
// ระบบตรวจจับกล้อง (Webcam & MediaPipe)
// ==========================================
async function getUserMediaWithTimeout(constraints, timeoutMs = 8000) {
    let timeoutId
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error("TimeoutError"))
        }, timeoutMs)
    })

    try {
        const stream = await Promise.race([
            navigator.mediaDevices.getUserMedia(constraints),
            timeoutPromise
        ])
        clearTimeout(timeoutId)
        return stream
    } catch (err) {
        clearTimeout(timeoutId)
        throw err
    }
}

function stopCurrentStream() {
    if (webcamTimeout) {
        clearTimeout(webcamTimeout)
        webcamTimeout = null
    }
    stopHandTracking()
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop())
        mediaStream = null
    }
    video.srcObject = null
}

function startWebcam(targetDeviceId = null) {
    return new Promise(async (resolve, reject) => {
        stopCurrentStream()

        if (window.isSecureContext === false) {
            reject(new Error("InsecureContext"))
            return
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            reject(new Error("NotSupported"))
            return
        }

        try {
            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    ...(targetDeviceId ? { deviceId: { exact: targetDeviceId } } : { facingMode: "user" })
                },
                audio: false
            }

            btnStart.disabled = true
            btnStart.innerHTML = ''

            mediaStream = await getUserMediaWithTimeout(constraints, 8000)
            video.srcObject = mediaStream

            video.onloadedmetadata = () => {
                video.play()

                if (cameraSelectContainer) cameraSelectContainer.classList.remove('hidden')
                if (handTrackingContainer) handTrackingContainer.classList.remove('hidden')

                adjustCanvasSize()

                if (!toggleHandTracking || toggleHandTracking.checked) {
                    startHandTracking()
                }

                updateCameraSelector(targetDeviceId)
                resolve(true)
            }

        } catch (error) {
            console.error("Camera Error:", error)
            stopCurrentStream()
            updateCameraSelector(targetDeviceId)
            btnStart.disabled = false
            btnStart.innerHTML = ''
            reject(error)
        }
    })
}

async function updateCameraSelector(activeDeviceId = null) {
    if (!cameraSelect || !cameraSelectContainer) return
    try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(device => device.kind === 'videoinput')

        cameraSelect.innerHTML = ''

        if (videoDevices.length > 0) {
            videoDevices.forEach(device => {
                const option = document.createElement('option')
                option.value = device.deviceId
                option.textContent = device.label || `กล้องตัวที่ ${cameraSelect.options.length + 1}`
                if (activeDeviceId && device.deviceId === activeDeviceId) {
                    option.selected = true
                }
                cameraSelect.appendChild(option)
            })
            cameraSelectContainer.classList.remove('hidden')
        } else {
            cameraSelectContainer.classList.add('hidden')
        }
    } catch (err) {
        console.error("ไม่สามารถดึงข้อมูลรายการกล้องได้:", err)
    }
}



// ==========================================
// ระบบวิเคราะห์โครงสร้างมือ (MediaPipe Hands)
// ==========================================
function initHandsModel() {
    if (handsModel) return

    if (typeof Hands === 'undefined') {
        console.error("ไม่พบไลบรารี MediaPipe Hands!")
        showError("กรุณาเชื่อมต่ออินเทอร์เน็ต เพื่อดาวน์โหลดโมเดลวิเคราะห์ข้อมือนะจ๊ะ")
        return
    }

    try {
        handsModel = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        })

        handsModel.setOptions({
            maxNumHands: 4,
            modelComplexity: 1,
            minDetectionConfidence: 0.25,
            minTrackingConfidence: 0.25
        })

        handsModel.onResults(onHandResults)
        console.log("โมเดลกระดูกมือ MediaPipe พร้อมใช้งาน!")
    } catch (e) {
        console.error("โมเดลตรวจจับล้มเหลว:", e)
    }
}

function startHandTracking() {
    if (!handsModel) {
        initHandsModel()
    }
    if (!handsModel) return

    isHandTrackingActive = true
    handCanvas.style.display = 'block'

    adjustCanvasSize()
    processVideoFrame()
}

function stopHandTracking() {
    isHandTrackingActive = false
    handCanvas.style.display = 'none'
    handCtx.clearRect(0, 0, handCanvas.width, handCanvas.height)
    particleList = []
}

function adjustCanvasSize() {
    if (video.videoWidth) {
        handCanvas.width = video.videoWidth
        handCanvas.height = video.videoHeight
    }
}

async function processVideoFrame() {
    if (!mediaStream || video.paused || video.ended || !isHandTrackingActive || !handsModel) {
        return
    }
    try {
        await handsModel.send({ image: video })
    } catch (err) {
        console.error("เกิดข้อผิดพลาดขณะส่งเฟรมไปวิเคราะห์:", err)
    }
    if (isHandTrackingActive) {
        requestAnimationFrame(processVideoFrame)
    }
}

// ฟังก์ชันระบายสีและตรวจเช็คมือจากผลลัพธ์
function onHandResults(results) {
    if (!isHandTrackingActive) return

    handCtx.clearRect(0, 0, handCanvas.width, handCanvas.height)

    if (handCanvas.width !== video.videoWidth || handCanvas.height !== video.videoHeight) {
        adjustCanvasSize()
    }

    if (results.multiHandLandmarks) {
        let p1HandsList = []
        let p2HandsList = []

        for (const landmarks of results.multiHandLandmarks) {
            const avgX = landmarks.reduce((sum, lm) => sum + lm.x, 0) / landmarks.length

            // avgX > 0.5 คือซีกซ้ายจอ (Player 1), avgX <= 0.5 คือซีกขวาจอ (Player 2)
            const isPlayer1 = avgX > 0.5

            if (isPlayer1) p1HandsList.push(landmarks)
            else p2HandsList.push(landmarks)

            const handColor = isPlayer1 ? '#ff3b30' : '#007aff'

            // วาดโครงสร้างมือลงในจอแคมพรีวิวขนาดใหญ่
            drawConnectorsCustom(landmarks, handColor)
            drawLandmarksCustom(landmarks, handColor)
            spawnFingertipParticles(landmarks[8], handColor)
        }

        // เรียงมือแต่ละฝั่งตามตำแหน่งแกน X ของข้อมือ เพื่อให้ index 0/1 หมายถึงมือเดิมสม่ำเสมอในแต่ละเฟรม
        // (ลดอาการมือสลับตำแหน่งกันไปมาทำให้คำนวณความเร็วมือผิดพลาด)
        p1HandsList.sort((a, b) => a[0].x - b[0].x)
        p2HandsList.sort((a, b) => a[0].x - b[0].x)

        // เช็คจังหวะทุบลง (Smash) แยกต่อมือ ทำให้ผู้เล่นใช้ 2 มือตีพร้อมกันได้จริง
        if (currentScreen === 'game-screen' && !isGameOver) {
            p1HandsList.forEach((landmarks, idx) => detectSmash(landmarks, 'p1', idx))
            p2HandsList.forEach((landmarks, idx) => detectSmash(landmarks, 'p2', idx))
        }

        // ระบบจำพิกัดมือชั่วคราวเผื่อกรณีมือเบลอตรวจจับหลุดระหว่างทาง (Grace Period 5 เฟรม)
        if (p1HandsList.length === 0) {
            playerStates.p1.missingFrames = (playerStates.p1.missingFrames || 0) + 1
            if (playerStates.p1.missingFrames > 8) {
                playerStates.p1.hands = []
            }
        } else {
            playerStates.p1.missingFrames = 0
        }

        if (p2HandsList.length === 0) {
            playerStates.p2.missingFrames = (playerStates.p2.missingFrames || 0) + 1
            if (playerStates.p2.missingFrames > 8) {
                playerStates.p2.hands = []
            }
        } else {
            playerStates.p2.missingFrames = 0
        }

        // เช็คการควบคุมพอยน์เตอร์ในหน้าตอบคำถามและหน้าจบเกม
        if ((currentScreen === 'question-screen' && isQuestionActive && !isQuestionFinished) || currentScreen === 'final-screen') {
            const pointerEl = (currentScreen === 'final-screen') ? p1Pointer : ((winner === 'p1') ? p1Pointer : p2Pointer)
            const otherPointerEl = (currentScreen === 'final-screen') ? p2Pointer : ((winner === 'p1') ? p2Pointer : p1Pointer)

            otherPointerEl.classList.add('hidden')

            // ดึงข้อมูลมือที่จะควบคุมชี้คำตอบ:
            let winnerHand = null
            if (currentScreen === 'final-screen') {
                if (results.multiHandLandmarks.length > 0) {
                    winnerHand = results.multiHandLandmarks[0]
                }
            } else {
                // ดึงมือจากฝั่งผู้ชนะโดยตรง (ซึ่งถูกเรียงลำดับไว้แล้ว ป้องกันมือสลับกันเวลามีหลายมือ)
                if (winner === 'p1' && p1HandsList.length > 0) {
                    winnerHand = p1HandsList[0]
                } else if (winner === 'p2' && p2HandsList.length > 0) {
                    winnerHand = p2HandsList[0]
                }

                // ลบ Fallback ที่ยอมให้ฝั่งแพ้คุมพอยน์เตอร์ได้ทิ้งไป 
                // เพื่อให้มั่นใจว่า "เฉพาะ" คนที่ชนะตีกลองเท่านั้นที่จะได้คุมพอยน์เตอร์และตอบคำถาม
            }

            if (winnerHand) {
                window.pointerMissingFrames = 0; // รีเซ็ตตัวนับเมื่อเจอมือ
                pointerEl.classList.remove('hidden')
                const indexFinger = winnerHand[8] // ปลายนิ้วชี้

                // สเกลตามขนาดหน้าจอจริง (เนื่องจากเป็นกระจกเงา x -> 1-x)
                const screenX = (1 - indexFinger.x) * window.innerWidth
                const screenY = indexFinger.y * window.innerHeight

                // 1. เฉลี่ย 10 เฟรมล่าสุด (Moving Average)
                pointerHistory.x.push(screenX)
                pointerHistory.y.push(screenY)
                if (pointerHistory.x.length > SMOOTHING_FRAMES) {
                    pointerHistory.x.shift()
                    pointerHistory.y.shift()
                }
                const smoothX = pointerHistory.x.reduce((a, b) => a + b, 0) / pointerHistory.x.length
                const smoothY = pointerHistory.y.reduce((a, b) => a + b, 0) / pointerHistory.y.length

                // 2. ขอบเขต Dead Zone 30px
                let targetX = smoothX
                let targetY = smoothY
                if (lastRenderedX !== null && lastRenderedY !== null) {
                    const dx = smoothX - lastRenderedX
                    const dy = smoothY - lastRenderedY
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < DEAD_ZONE) {
                        targetX = lastRenderedX
                        targetY = lastRenderedY
                    }
                }
                lastRenderedX = targetX
                lastRenderedY = targetY

                pointerEl.style.left = `${targetX}px`
                pointerEl.style.top = `${targetY}px`

                updateOptionHover(targetX, targetY)
            } else {
                window.pointerMissingFrames = (window.pointerMissingFrames || 0) + 1;
                if (window.pointerMissingFrames > 10) { // ลดเวลาการค้างหน้าจอลงเหลือ 10 เฟรม
                    pointerEl.classList.add('hidden')
                    pointerHistory.x = []
                    pointerHistory.y = []
                    lastRenderedX = null
                    lastRenderedY = null
                    resetOptionHover()
                }
            }
        } // ปิด if question-screen
    } else {
        window.pointerMissingFrames = (window.pointerMissingFrames || 0) + 1;
        if (window.pointerMissingFrames > 10) {
            p1Pointer.classList.add('hidden')
            p2Pointer.classList.add('hidden')
            pointerHistory.x = []
            pointerHistory.y = []
            lastRenderedX = null
            lastRenderedY = null
            resetOptionHover()
        }

        // ระบบจำพิกัดมือชั่วคราวเผื่อกรณีมือเบลอตรวจจับหลุดระหว่างทาง (Grace Period เพิ่มขึ้นเป็น 15 เฟรม)
        playerStates.p1.missingFrames = (playerStates.p1.missingFrames || 0) + 1
        if (playerStates.p1.missingFrames > 15) {
            playerStates.p1.hands = []
        }
        playerStates.p2.missingFrames = (playerStates.p2.missingFrames || 0) + 1
        if (playerStates.p2.missingFrames > 15) {
            playerStates.p2.hands = []
        }
    }

    updateAndDrawParticles()
}

function detectSmash(landmarks, playerKey, handIndex) {
    const state = getHandState(playerKey, handIndex)
    const wristLandmark = landmarks[0] // ข้อมือ
    const wristY = wristLandmark.y
    const now = Date.now()

    if (state.prevY !== null && state.prevTime !== null) {
        const dy = wristY - state.prevY
        const dt = (now - state.prevTime) / 1000 // วินาที

        if (dt > 0.001) {
            const velocityY = dy / dt // ความเร็วแนวแกน Y (ความสูงจอต่อวินาที)

            // เมื่อมือเคลื่อนที่ลงเร็วพอ และพ้นช่วง Cooldown (คำนวณ cooldown แยกต่อมือ ทำให้ตีสลับ 2 มือได้ถี่)
            // ตรวจจับการสับมือลงทุบได้ทั่วทั้งซีกฝั่งจอของตนเอง โดยไม่ต้องจำกัดขอบเขตพิกัดเพื่อให้เล่นและทุบได้อย่างเสถียรที่สุด
            if (velocityY > SMASH_THRESHOLD && (now - state.lastSmashTime > SMASH_COOLDOWN)) {
                // แปลงพิกัดข้อมือเพื่อเทียบตำแหน่งการสปอว์นเอฟเฟกต์สะเก็ดบนจอ
                const screenX = (1 - wristLandmark.x) * window.innerWidth
                const screenY = wristLandmark.y * window.innerHeight

                state.lastSmashTime = now
                triggerSmash(playerKey, screenX, screenY, wristLandmark)
            }
        }
    }
    state.prevY = wristY
    state.prevTime = now
}

// ==========================================
// ฟังก์ชันวาดกราฟิกสะเก็ดและกระดูกมือ (Canvas Render)
// ==========================================
function drawConnectorsCustom(landmarks, color) {
    if (typeof HAND_CONNECTIONS === 'undefined') return

    handCtx.save()
    handCtx.lineWidth = 5
    handCtx.lineCap = 'round'
    handCtx.strokeStyle = color
    // ตัด shadowBlur ออก (คำนวณ blur ทุกเส้น ทุกเฟรม ทุกมือ หนักมากตอนมีหลายมือพร้อมกัน)
    // ใช้เส้นหนาขึ้นแทนเพื่อให้ยังดูเด่นชัดโดยไม่กินพลังประมวลผล

    for (const connection of HAND_CONNECTIONS) {
        const start = landmarks[connection[0]]
        const end = landmarks[connection[1]]

        if (start && end) {
            handCtx.beginPath()
            handCtx.moveTo(start.x * handCanvas.width, start.y * handCanvas.height)
            handCtx.lineTo(end.x * handCanvas.width, end.y * handCanvas.height)
            handCtx.stroke()
        }
    }
    handCtx.restore()
}

function drawLandmarksCustom(landmarks, color) {
    handCtx.save()
    // ตัด shadowBlur ออกเช่นกัน (จุดข้อต่อมี 21 จุดต่อมือ ยิ่งหลายมือยิ่งหนัก)

    for (let i = 0; i < landmarks.length; i++) {
        const lm = landmarks[i]
        const isTip = [4, 8, 12, 16, 20].includes(i)
        const radius = isTip ? 6 : 4
        const fillColor = isTip ? '#ffffff' : color

        handCtx.beginPath()
        handCtx.arc(lm.x * handCanvas.width, lm.y * handCanvas.height, radius, 0, 2 * Math.PI)
        handCtx.fillStyle = fillColor
        handCtx.fill()

        handCtx.lineWidth = 1.5
        handCtx.strokeStyle = isTip ? color : '#ffffff'
        handCtx.stroke()
    }
    handCtx.restore()
}

const MAX_PARTICLES = 120 // จำกัดจำนวน particle สูงสุดที่มีพร้อมกัน กันเฟรมกระตุกตอนตีถี่ๆ หลายมือ

function spawnSmashParticles(landmark, color) {
    const x = landmark.x * handCanvas.width
    const y = landmark.y * handCanvas.height

    for (let i = 0; i < 10; i++) {
        particleList.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 8 - 4,
            size: Math.random() * 8 + 6,
            alpha: 1,
            decay: Math.random() * 0.02 + 0.015,
            color: color,
            style: 'star'
        })
    }
    if (particleList.length > MAX_PARTICLES) {
        particleList.splice(0, particleList.length - MAX_PARTICLES)
    }
}

function spawnFingertipParticles(tipLandmark, color) {
    if (!tipLandmark) return
    const x = tipLandmark.x * handCanvas.width
    const y = tipLandmark.y * handCanvas.height

    // ลดจากเดิม 2 particle/เฟรม/มือ เหลือ 1 เพราะตอนนี้เล่นได้พร้อมกันสูงสุด 4 มือ (เดิมออกแบบไว้สำหรับ 2 มือ)
    for (let i = 0; i < 1; i++) {
        particleList.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4.5,
            vy: (Math.random() - 0.5) * 3 - 2,
            size: Math.random() * 6 + 4,
            alpha: 1,
            decay: Math.random() * 0.035 + 0.015,
            color: color,
            style: Math.random() > 0.4 ? 'star' : 'circle'
        })
    }
}

function updateAndDrawParticles() {
    handCtx.save()
    particleList = particleList.filter(p => p.alpha > 0)
    if (particleList.length > MAX_PARTICLES) {
        particleList.splice(0, particleList.length - MAX_PARTICLES)
    }

    for (const p of particleList) {
        p.x += p.vx
        p.y += p.vy
        p.alpha -= p.decay

        handCtx.globalAlpha = Math.max(0, p.alpha)
        // ตัด shadowBlur ออก (คำนวณ blur ต่อ particle ทุกเฟรม หนักมากเมื่อมี particle เยอะพร้อมกัน)
        handCtx.fillStyle = p.color

        if (p.style === 'star') {
            const r = p.size
            handCtx.beginPath()
            handCtx.moveTo(p.x, p.y - r)
            handCtx.quadraticCurveTo(p.x, p.y, p.x + r, p.y)
            handCtx.quadraticCurveTo(p.x, p.y, p.x, p.y + r)
            handCtx.quadraticCurveTo(p.x, p.y, p.x - r, p.y)
            handCtx.quadraticCurveTo(p.x, p.y, p.x, p.y - r)
            handCtx.closePath()
            handCtx.fill()
        } else {
            handCtx.beginPath()
            handCtx.arc(p.x, p.y, p.size / 2.5, 0, 2 * Math.PI)
            handCtx.fill()
        }
    }
    handCtx.restore()
}

// ==========================================
// สัญญาณการผูก Event Listeners
// ==========================================

// คลิกเริ่มเล่น
btnStart.addEventListener('click', async () => {
    if (btnStart.disabled) return
    btnStart.disabled = true

    // เล่นเพลงทันทีที่มีการคลิก (Synchronous) เพื่อแก้ปัญหา Autoplay Policy ของ Browser 100%
    playBGM('menu')

    // โหลด/เปิดกล้องเว็บแคมในขั้นตอนแรก
    if (!mediaStream) {
        try {
            await startWebcam()
        } catch (e) {
            console.error("ไม่สามารถเริ่มกล้องเว็บแคมได้:", e)
            btnStart.disabled = false
            return
        }
    }

    setScreen('category-screen')
    btnStart.disabled = false
})

// Category button handlers
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        selectedCategory = btn.dataset.category
        buildQuestionPools(selectedCategory, true)

        if (isFirstRound) {
            startCountdown()
        } else {
            startGameScreen()
        }
    })
})

// ปุ่มย้อนกลับจากหน้าเลือกหมวดหมู่ไปหน้าแรก
const btnBackToHome = document.getElementById('btn-back-to-home')
if (btnBackToHome) {
    btnBackToHome.addEventListener('click', () => {
        setScreen('start-screen')
    })
}

// เปลี่ยนกล้องผ่าน Dropdown
if (cameraSelect) {
    cameraSelect.addEventListener('change', () => {
        const selectedDeviceId = cameraSelect.value
        if (selectedDeviceId) {
            startWebcam(selectedDeviceId)
        }
    })
}

// การสลับเปิด/ปิด ตรวจจับข้อมือ
if (toggleHandTracking) {
    toggleHandTracking.addEventListener('change', () => {
        if (toggleHandTracking.checked) {
            if (mediaStream) {
                startHandTracking()
            }
        } else {
            stopHandTracking()
        }
    })
}

// ปรับขนาดแคนวาสเมื่อมีการหมุนหรือปรับหน้าจอเบราว์เซอร์
window.addEventListener('resize', adjustCanvasSize)

// ปุ่มหน้าคะแนน: เล่นรอบถัดไป
if (btnScoreNext) {
    btnScoreNext.addEventListener('click', () => {
        playBeep(587.33, 0.15) // D5
        startNextRound()
    })
}

// ปุ่มหน้าคะแนน: รีเซ็ตเกมใหม่ทั้งหมด
if (btnScoreReset) {
    btnScoreReset.addEventListener('click', () => {
        playBeep(329.63, 0.2) // E4
        resetGameScores()
    })
}

if (btnPlaySameCategory) {
    btnPlaySameCategory.addEventListener('click', () => {
        playBeep(587.33, 0.15)
        playSameCategoryAgain()
    })
}

if (btnBackHome) {
    btnBackHome.addEventListener('click', () => {
        playBeep(329.63, 0.2)
        resetGameScores()
    })
}



// ปุ่มล่องหนหน้าแรก: วิธีเล่น
const btnStartHowTo = document.getElementById('btn-start-how-to')
if (btnStartHowTo) {
    btnStartHowTo.addEventListener('click', () => {
        playBeep(440, 0.15)
        alert("🐾 วิธีเล่น 🐾\n1. รัวมือทุบกลองให้เร็วที่สุด!\n2. ใครรัวครบ 50 ครั้งก่อน ได้สิทธิ์ตอบคำถามก่อน!\n3. ตอบคำถามภาษาอังกฤษเพื่อทำคะแนนรวมสะสม!")
    })
}

// ปุ่มล่องหนหน้าแรก: เสียง (ทดสอบเสียงกลอง/เสียง Beep)
const btnStartSound = document.getElementById('btn-start-sound')
if (btnStartSound) {
    btnStartSound.addEventListener('click', () => {
        playBeep(880, 0.25)
    })
}

// ปุ่มล่องหนหน้าแรก: ตั้งค่า
const btnStartSettings = document.getElementById('btn-start-settings')
if (btnStartSettings) {
    btnStartSettings.addEventListener('click', () => {
        setScreen('settings-screen')
    })
}

// ปุ่มย้อนกลับจากหน้าตั้งค่าไปหน้าแรก
const btnBackFromSettings = document.getElementById('btn-back-from-settings')
if (btnBackFromSettings) {
    btnBackFromSettings.addEventListener('click', () => {
        playBeep(554.37, 0.15)
        setScreen('start-screen')
    })
}

// ค่าเริ่มต้น: แสดงหน้าเริ่มเกม
setScreen('start-screen')
