const fs = require('fs');
let code = fs.readFileSync('script.js', 'utf8');

// 1. Add isMobileDevice logic at the top (near variables)
const mobileCheckCode = `
// Mobile Touch Detection
function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1) || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
const isMobile = isMobileDevice();
`;
code = code.replace(/(let audioCtx = null;)/, mobileCheckCode + '\n$1');

// 2. Hide camera background if mobile in setScreen
code = code.replace(
    /if \(screenName === 'game-screen' \|\| screenName === 'question-screen' \|\| screenName === 'score-screen' \|\| screenName === 'final-screen'\) \{[\s\S]*?cameraBg\.style\.display = 'none'\s*\}/,
    `if (!isMobile && (screenName === 'game-screen' || screenName === 'question-screen' || screenName === 'score-screen' || screenName === 'final-screen')) {
            cameraBg.style.display = 'block'
        } else {
            cameraBg.style.display = 'none'
        }`
);

// 3. Disable webcam init if mobile
code = code.replace(
    /function startWebcam\(\) \{/,
    `function startWebcam() {
    if (isMobile) return;`
);

// 4. Disable MediaPipe hands if mobile
code = code.replace(
    /function initHandsModel\(\) \{/,
    `function initHandsModel() {
    if (isMobile) return;`
);
code = code.replace(
    /function startHandTracking\(\) \{/,
    `function startHandTracking() {
    if (isMobile) return;`
);

// 5. Add touch/click listener for game screen to trigger smashes
const mobileTouchGameCode = `
    // Mobile Touch for Game Screen (Drumming)
    const gameScreenEl = document.getElementById('game-screen');
    gameScreenEl.addEventListener('touchstart', (e) => {
        if (!isMobile || currentScreen !== 'game-screen' || isGameOver) return;
        
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const x = touch.clientX;
            const y = touch.clientY;
            
            // Check cooldowns just like smash detection
            const now = Date.now();
            
            if (x < window.innerWidth / 2) {
                // Player 1
                if (now - (window.lastP1TouchSmash || 0) > SMASH_COOLDOWN) {
                    window.lastP1TouchSmash = now;
                    triggerSmash('p1', x, y, {x: x/window.innerWidth, y: y/window.innerHeight});
                }
            } else {
                // Player 2
                if (now - (window.lastP2TouchSmash || 0) > SMASH_COOLDOWN) {
                    window.lastP2TouchSmash = now;
                    triggerSmash('p2', x, y, {x: x/window.innerWidth, y: y/window.innerHeight});
                }
            }
        }
    });
`;
// Insert into DOMContentLoaded
code = code.replace(
    /document\.addEventListener\('DOMContentLoaded', \(\) => \{/,
    `document.addEventListener('DOMContentLoaded', () => {\n${mobileTouchGameCode}`
);

// 6. Update question rendering to allow clicking buttons instantly on mobile
code = code.replace(
    /const btn = document\.createElement\('button'\)\s*btn\.className = 'question-option-btn hover-target'/,
    `const btn = document.createElement('button')
            btn.className = 'question-option-btn hover-target'
            if (isMobile) {
                btn.addEventListener('touchstart', (e) => {
                    if (isQuestionFinished) return;
                    e.preventDefault();
                    selectOption(opt, sideId === 'p1-question-container' ? 'p1' : 'p2');
                }, {passive: false});
            }`
);

// 7. Update jigsaw to allow touch reveals on mobile
const mobileJigsawTouchCode = `
    jigsawCanvas.addEventListener('touchstart', (e) => {
        if (!isMobile || !isQuestionActive || isQuestionFinished || bonusRevealsRemaining <= 0) return;
        e.preventDefault();
        
        const rect = jigsawCanvas.getBoundingClientRect();
        const touch = e.changedTouches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        const squareW = jigsawCanvas.width / JIGSAW_COLS;
        const squareH = jigsawCanvas.height / JIGSAW_ROWS;
        
        // Use mapping since canvas logical size is 800x600 but rendered size could be different
        const scaleX = jigsawCanvas.width / rect.width;
        const scaleY = jigsawCanvas.height / rect.height;
        
        const logicalX = x * scaleX;
        const logicalY = y * scaleY;
        
        const col = Math.floor(logicalX / squareW);
        const row = Math.floor(logicalY / squareH);
        
        revealJigsawSquare(col, row);
    }, {passive: false});
`;
code = code.replace(
    /function startQuestionPhase\(\) \{/,
    `${mobileJigsawTouchCode}\nfunction startQuestionPhase() {`
);

// Wait, the canvas might not exist if it's not DOMContentLoaded.
// Let's wrap it in DOMContentLoaded or just put it after canvas elements are defined.
// Actually, `jigsawCanvas` is queried at the top level. It exists when the script runs if script is deferred. But script is in head or body?
fs.writeFileSync('script.js', code);
console.log('script.js updated');
