// --- CONFIGURATION ---
const TOTAL_LEVELS = 15;
const MAX_TIME = 300; // 5 minutes

const QUESTIONS = [
    { q: "Quel équipement est OBLIGATOIRE avant toute intervention ?", answers: ["Gants Isolants", "Lunettes de soleil", "Casque audio", "Gilet jaune"], correct: 0 },
    { q: "Le Cœur Électrique est en surchauffe. Quelle est la priorité ?", answers: ["Augmenter la puissance", "Couper l'alimentation", "Ajouter du charbon", "Fuir"], correct: 1 },
    { q: "Quelle couleur de câble correspond généralement à la Terre ?", answers: ["Rouge", "Bleu", "Jaune/Vert", "Noir"], correct: 2 },
    { q: "Un fusible a grillé. Que faire ?", answers: ["Le remplacer par un trombone", "Le remplacer par un neuf", "Mettre du scotch", "Ignorer"], correct: 1 },
    { q: "Quelle est l'unité de mesure de la tension électrique ?", answers: ["Ampère", "Watt", "Volt", "Joule"], correct: 2 },
    { q: "Le panneau affiche 'ERREUR 503'. Signification ?", answers: ["Surcharge Système", "Pause Café", "Mise à jour Windows", "Service Indisponible"], correct: 3 },
    { q: "Quel gaz est utilisé pour le refroidissement d'urgence ?", answers: ["Oxygène", "Hélium", "Azote Liquide", "Vapeur"], correct: 2 },
    { q: "Si un collègue est électrisé, que faire en premier ?", answers: ["Le toucher", "Couper le courant", "Appeler sa mère", "Prendre une photo"], correct: 1 },
    { q: "Quelle tension alimente le Cœur Électrique ?", answers: ["12V", "220V", "10 000V", "5V"], correct: 2 },
    { q: "Le voyant 'PRESSION' est rouge. Action ?", answers: ["Ouvrir la vanne de purge", "Frapper la machine", "Augmenter la pression", "Débrancher l'écran"], correct: 0 }
];

// --- STATE ---
let currentState = {
    levelIndex: 0,
    startTime: 0,
    timerInterval: null,
    levels: [] // Generated array of level configs
};

// --- DOM CACHE ---
const els = {
    timer: document.getElementById('timer'),
    levelCounter: document.getElementById('level-counter'),
    levelView: document.getElementById('level-view'),
    puzzleContainer: document.getElementById('puzzle-container'),
    taskInstruction: document.getElementById('task-instruction'),
    menuView: document.getElementById('menu-view'),
    resultView: document.getElementById('result-view'),
    ledPower: document.getElementById('led-power'),
    ledWarning: document.getElementById('led-warning'),
    ledData: document.getElementById('led-data'),
};

// --- AUDIO ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;

    if (type === 'click') {
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === 'success') {
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'win') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    }
}

// --- LEVEL GENERATION ---
function generateLevels() {
    const types = ['QUIZ', 'TOGGLE', 'QUIZ', 'CABLES', 'QUIZ', 'SLIDERS', 'QUIZ', 'KEYPAD', 'QUIZ', 'VALVE', 'PRESSURE'];
    let levels = [];

    for (let i = 0; i < TOTAL_LEVELS; i++) {
        // Difficulty increases with i
        const difficulty = Math.min(1.0, i / TOTAL_LEVELS);
        const type = types[i % types.length]; // Rotate types

        let config = { id: i, type: type, difficulty: difficulty };

        // Custom params per type
        if (type === 'QUIZ') {
             config.qIndex = i % QUESTIONS.length;
        } else if (type === 'TOGGLE') {
            config.gridSize = i > 10 ? 5 : 3;
        } else if (type === 'CABLES') {
            config.pairs = i > 12 ? 5 : (i > 6 ? 4 : 3);
        } else if (type === 'SLIDERS') {
            config.count = i > 10 ? 4 : (i > 5 ? 3 : 2);
        } else if (type === 'KEYPAD') {
            config.codeLen = i > 15 ? 5 : 4;
        } else if (type === 'PRESSURE') {
            config.speed = 1 + (difficulty * 2);
        }

        levels.push(config);
    }
    return levels;
}

// --- GAME LOOP ---
function initGame() {
    currentState.levels = generateLevels();
    currentState.levelIndex = 0;
    currentState.timeLeft = MAX_TIME;

    els.menuView.classList.add('hidden');
    els.resultView.classList.add('hidden');
    els.levelView.classList.remove('hidden');

    els.ledPower.classList.add('on');

    startTimer();
    loadLevel(currentState.levelIndex);
}

function loadLevel(idx) {
    // Clear Container
    els.puzzleContainer.innerHTML = '';

    if (idx >= TOTAL_LEVELS) {
        winGame();
        return;
    }

    const level = currentState.levels[idx];
    els.levelCounter.innerText = `${String(idx + 1).padStart(2, '0')}/${TOTAL_LEVELS}`;

    // Render specific puzzle
    switch (level.type) {
        case 'QUIZ': renderQuiz(level); break;
        case 'TOGGLE': renderToggle(level); break;
        case 'CABLES': renderCables(level); break;
        case 'SLIDERS': renderSliders(level); break;
        case 'KEYPAD': renderKeypad(level); break;
        case 'VALVE': renderValve(level); break;
        case 'PRESSURE': renderPressure(level); break;
    }
}

function onLevelComplete() {
    playSound('success');
    // Flash Green LED
    els.ledData.classList.add('on');
    setTimeout(() => els.ledData.classList.remove('on'), 200);

    currentState.levelIndex++;
    loadLevel(currentState.levelIndex);
}

function startTimer() {
    clearInterval(currentState.timerInterval);
    currentState.timerInterval = setInterval(() => {
        currentState.timeLeft -= 0.1;

        // Update timer UI
        const m = Math.floor(currentState.timeLeft / 60);
        const s = Math.floor(currentState.timeLeft % 60);
        const ms = Math.floor((currentState.timeLeft % 1) * 100);
        els.timer.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;

        if (currentState.timeLeft <= 0) {
            failGame();
        } else if (currentState.timeLeft < 60) {
            els.timer.style.color = 'red';
            // blink warning led
            if (ms % 20 < 10) els.ledWarning.classList.add('on');
            else els.ledWarning.classList.remove('on');
        }
    }, 100);
}

function stopGame() {
    clearInterval(currentState.timerInterval);
    els.levelView.classList.add('hidden');
    els.ledPower.classList.remove('on');
    els.ledWarning.classList.remove('on');
}

function winGame() {
    stopGame();
    playSound('win');
    els.resultView.classList.remove('hidden');
    document.getElementById('result-title').innerText = "SYSTÈME OPTIMAL";
    document.getElementById('result-title').style.color = "#3f3";
    document.getElementById('result-msg').innerText = `TERMINÉ EN ${(MAX_TIME - currentState.timeLeft).toFixed(2)}s`;
}

function failGame() {
    stopGame();
    playSound('error');
    els.resultView.classList.remove('hidden');
    document.getElementById('result-title').innerText = "ÉCHEC CRITIQUE";
    document.getElementById('result-title').style.color = "#f33";
    document.getElementById('result-msg').innerText = `NIVEAU ATTEINT: ${currentState.levelIndex + 1}`;
}

// --- RENDERERS ---

// 0. QUIZ
function renderQuiz(config) {
    els.taskInstruction.innerText = "ANALYSE REQUISE";
    const qData = QUESTIONS[config.qIndex];
    
    const container = document.createElement('div');
    container.className = 'quiz-container';
    container.style.width = '80%';
    container.style.textAlign = 'center';

    const question = document.createElement('h3');
    question.innerText = qData.q;
    question.style.color = 'var(--text-lcd)';
    question.style.marginBottom = '20px';
    container.appendChild(question);

    const answersGrid = document.createElement('div');
    answersGrid.style.display = 'grid';
    answersGrid.style.gridTemplateColumns = '1fr 1fr';
    answersGrid.style.gap = '15px';

    qData.answers.forEach((ans, idx) => {
        const btn = document.createElement('button');
        btn.className = 'industrial-btn';
        btn.style.fontSize = '1rem';
        btn.style.padding = '10px';
        btn.innerText = ans;
        
        btn.onclick = () => {
            if (idx === qData.correct) {
                onLevelComplete();
            } else {
                playSound('error');
                btn.style.background = '#500';
                btn.style.borderColor = 'red';
                currentState.timeLeft -= 10; // Penalty
                els.timer.classList.add('blink');
                setTimeout(() => els.timer.classList.remove('blink'), 500);
            }
        };
        answersGrid.appendChild(btn);
    });

    container.appendChild(answersGrid);
    els.puzzleContainer.appendChild(container);
}

// 1. TOGGLE (Fuses)
function renderToggle(config) {
    els.taskInstruction.innerText = "ACTIVER TOUS LES CIRCUITS";
    const grid = document.createElement('div');
    grid.className = 'grid-container';
    grid.style.gridTemplateColumns = `repeat(${config.gridSize}, 1fr)`;

    let activeCount = 0;
    const total = config.gridSize * config.gridSize;

    for (let i = 0; i < total; i++) {
        const cell = document.createElement('div');
        cell.className = 'fuse-cell';
        const led = document.createElement('div');
        led.className = 'fuse-led';
        cell.appendChild(led);

        // Random init
        if (Math.random() > 0.5) {
            cell.classList.add('active');
            activeCount++;
        }

        cell.onclick = () => {
            cell.classList.toggle('active');
            playSound('click');
            // Check win
            if (document.querySelectorAll('.fuse-cell.active').length === total) {
                onLevelComplete();
            }
        };
        grid.appendChild(cell);
    }
    // Prevent instant win
    if (activeCount === total) grid.querySelector('.fuse-cell').classList.remove('active');

    els.puzzleContainer.appendChild(grid);
}

// 2. CABLES
function renderCables(config) {
    els.taskInstruction.innerText = "CONNECTER LES PORTS";
    const wrapper = document.createElement('div');
    wrapper.className = 'cable-stage';

    const colors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f'].slice(0, config.pairs);

    // Canvas
    const cvs = document.createElement('canvas');
    cvs.width = 600; cvs.height = 350;
    const ctx = cvs.getContext('2d');
    wrapper.appendChild(cvs);

    // State
    let connections = []; // {color, y1, y2}
    let selection = null; // {side, color, y}

    const leftStrip = document.createElement('div');
    leftStrip.className = 'port-strip';
    const rightStrip = document.createElement('div');
    rightStrip.className = 'port-strip right';

    // Shuffle
    const lColors = [...colors].sort(() => Math.random() - 0.5);
    const rColors = [...colors].sort(() => Math.random() - 0.5);

    function draw() {
        ctx.clearRect(0, 0, 600, 350);
        ctx.lineWidth = 4;
        connections.forEach(c => {
            ctx.strokeStyle = c.color;
            ctx.beginPath();
            ctx.moveTo(25, c.y1);
            ctx.bezierCurveTo(300, c.y1, 300, c.y2, 575, c.y2);
            ctx.stroke();
        });
        if (selection) {
            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            // simple visual cue
        }
    }

    function createPorts(strip, cols, side) {
        cols.forEach((col, i) => {
            const p = document.createElement('div');
            p.className = 'port';
            p.style.backgroundColor = col; /* hint */
            p.style.borderColor = col;

            // Calc precise Y (approx based on flex space)
            // height 350, pairs N. space = 350/N. center = space*i + space/2
            const span = 350 / config.pairs;
            const y = (i * span) + (span / 2);

            p.onclick = () => {
                if (p.classList.contains('locked')) return;
                playSound('click');

                if (!selection) {
                    selection = { side, color: col, y, el: p };
                    p.classList.add('selected');
                } else {
                    if (selection.side === side) {
                        selection.el.classList.remove('selected');
                        selection = { side, color: col, y, el: p };
                        p.classList.add('selected');
                    } else {
                        // Check match
                        if (selection.color === col) {
                            // Link!
                            const otherY = selection.side === 'left' ? selection.y : y;
                            const leftY = selection.side === 'left' ? selection.y : y;
                            const rightY = selection.side === 'right' ? selection.y : y;

                            connections.push({ color: col, y1: leftY, y2: rightY });
                            p.classList.add('locked');
                            selection.el.classList.add('locked');
                            p.style.background = '#fff'; selection.el.style.background = '#fff';

                            selection.el.classList.remove('selected');
                            selection = null;
                            draw();

                            if (connections.length === config.pairs) onLevelComplete();
                        } else {
                            playSound('error');
                            selection.el.classList.remove('selected');
                            selection = null;
                        }
                    }
                }
            };
            strip.appendChild(p);
        });
    }

    createPorts(leftStrip, lColors, 'left');
    createPorts(rightStrip, rColors, 'right');
    wrapper.appendChild(leftStrip);
    wrapper.appendChild(rightStrip);
    els.puzzleContainer.appendChild(wrapper);
}

// 3. SLIDERS
function renderSliders(config) {
    els.taskInstruction.innerText = "ALIGNER LES FRÉQUENCES";
    const group = document.createElement('div');
    group.className = 'slider-group';

    let goals = [];

    for (let i = 0; i < config.count; i++) {
        const col = document.createElement('div');
        col.className = 'slider-col';

        const track = document.createElement('div');
        track.className = 'slider-track';

        // Random Target
        const targetPct = Math.floor(Math.random() * 80) + 10;
        goals.push(targetPct);

        const line = document.createElement('div');
        line.className = 'target-line';
        line.style.bottom = targetPct + '%';
        track.appendChild(line);

        const input = document.createElement('input');
        input.type = 'range';
        input.className = 'vertical';
        input.min = 0; input.max = 100; input.value = Math.random() < 0.5 ? 0 : 100;

        input.oninput = () => checkSliders();

        track.appendChild(input);
        col.appendChild(track);
        group.appendChild(col);
    }

    function checkSliders() {
        const inputs = group.querySelectorAll('input');
        let wins = 0;
        inputs.forEach((inp, i) => {
            const val = parseInt(inp.value);
            if (Math.abs(val - goals[i]) < 5) wins++;
        });
        if (wins === config.count) onLevelComplete();
    }

    els.puzzleContainer.appendChild(group);
}

// 4. KEYPAD
function renderKeypad(config) {
    els.taskInstruction.innerText = "SAISIR LE CODE DE SÉCURITÉ";

    // Generate Code
    let code = "";
    for (let i = 0; i < config.codeLen; i++) code += Math.floor(Math.random() * 10);

    const frame = document.createElement('div');
    frame.className = 'keypad-frame';

    // Note with code
    const note = document.createElement('div');
    note.className = 'kp-note';
    note.innerText = "CODE: " + code;
    // Blur it?
    // note.style.filter = 'blur(2px)';

    const uiSide = document.createElement('div');
    const screen = document.createElement('div');
    screen.className = 'kp-screen';
    screen.innerText = "_".repeat(config.codeLen);
    uiSide.appendChild(screen);
    uiSide.appendChild(note);
    uiSide.style.position = 'relative';

    const grid = document.createElement('div');
    grid.className = 'keypad-grid';

    let currentInput = "";

    [1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].forEach(k => {
        const btn = document.createElement('button');
        btn.className = 'kp-btn';
        btn.innerText = k;
        btn.onclick = () => {
            playSound('click');
            if (k === 'C') {
                currentInput = "";
            } else if (k === 'OK') {
                if (currentInput === code) onLevelComplete();
                else {
                    playSound('error');
                    currentInput = "";
                }
            } else {
                if (currentInput.length < config.codeLen) currentInput += k;
            }
            // Update Screen
            screen.innerText = currentInput.padEnd(config.codeLen, '_');
        };
        grid.appendChild(btn);
    });

    frame.appendChild(grid);
    frame.appendChild(uiSide);
    els.puzzleContainer.appendChild(frame);
}

// 5. VALVE (Rotary)
function renderValve(config) {
    els.taskInstruction.innerText = "ALIGNER LE DISPOSITIF";

    const container = document.createElement('div');
    container.className = 'valve-container';

    // Target Rotation
    const targetDeg = Math.floor(Math.random() * 360);

    // Visual Target
    const indicator = document.createElement('div');
    indicator.style.position = 'absolute';
    indicator.style.width = '100%'; indicator.style.height = '100%';
    indicator.style.pointerEvents = 'none';
    const arrow = document.createElement('div');
    arrow.style.position = 'absolute';
    arrow.style.top = '10px'; arrow.style.left = '50%';
    arrow.style.width = '0'; arrow.style.height = '0';
    arrow.style.borderLeft = '10px solid transparent';
    arrow.style.borderRight = '10px solid transparent';
    arrow.style.borderTop = '15px solid var(--led-green)';
    arrow.style.transform = `translateX(-50%) rotate(${targetDeg}deg)`;
    arrow.style.transformOrigin = '50% 100px'; // center of wheel (200px / 2 = 100)

    container.appendChild(arrow);

    // Handle
    const handle = document.createElement('div');
    handle.className = 'valve-handle';
    const bar = document.createElement('div');
    bar.className = 'valve-bar';
    const bar2 = document.createElement('div');
    bar2.className = 'valve-bar cross';
    handle.appendChild(bar);
    handle.appendChild(bar2);

    // Marker on handle (Red dot)
    const marker = document.createElement('div');
    marker.className = 'valve-marker';
    handle.appendChild(marker);

    container.appendChild(handle);

    // Logic
    let currentDeg = 0;
    let isDragging = false;

    const moveHandler = (clientX, clientY) => {
        if (!isDragging) return;
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deg = Math.atan2(clientY - centerY, clientX - centerX) * 180 / Math.PI;
        currentDeg = deg + 90; // Adjust for 12 o'clock start
        handle.style.transform = `rotate(${currentDeg}deg)`;

        // Normalize angles
        let diff = Math.abs((currentDeg - targetDeg) % 360);
        if (diff > 180) diff = 360 - diff;

        if (diff < 5) {
            onLevelComplete();
            isDragging = false;
        }
    };

    container.onmousedown = (e) => { isDragging = true; };
    container.ontouchstart = (e) => { isDragging = true; e.preventDefault(); };

    document.onmouseup = () => { isDragging = false; };
    document.ontouchend = () => { isDragging = false; };

    document.onmousemove = (e) => moveHandler(e.clientX, e.clientY);
    document.ontouchmove = (e) => {
        if (isDragging) e.preventDefault();
        moveHandler(e.touches[0].clientX, e.touches[0].clientY);
    };

    els.puzzleContainer.appendChild(container);
}

// 6. PRESSURE (Tap/Hold)
function renderPressure(config) {
    els.taskInstruction.innerText = "MAINTENIR LA PRESSION DANS LA ZONE";

    const gauge = document.createElement('div');
    gauge.className = 'pressure-gauge';

    const zone = document.createElement('div');
    zone.className = 'pressure-zone';

    // Random Zone
    const startObj = Math.random() * 70;
    zone.style.left = startObj + '%';
    zone.style.width = '20%';
    gauge.appendChild(zone);

    const fill = document.createElement('div');
    fill.className = 'pressure-fill';
    gauge.appendChild(fill);

    const btn = document.createElement('button');
    btn.className = 'industrial-btn';
    btn.innerText = "INJECTER";
    btn.style.marginTop = '20px';

    let pressure = 0;
    let velocity = 0;
    let holding = 0; // Frames held correctly
    const REQUIRED_HOLD = 30; // 3 seconds approx of holding (100ms tick * 30... wait logic is different)

    // actually let's use animation frame for physics
    let active = true;

    function loop() {
        if (!active) return;

        // Decay
        velocity -= 0.5;
        pressure += velocity;
        if (pressure < 0) { pressure = 0; velocity = 0; }
        if (pressure > 100) { pressure = 100; velocity = -velocity * 0.5; }

        fill.style.width = pressure + '%';

        // Check Zone (zone is 20 wide)
        if (pressure >= startObj && pressure <= startObj + 20) {
            holding++;
            fill.style.filter = 'brightness(1.5)';
            if (holding > 100) { // 100 frames @ 60fps = 1.5s
                active = false;
                onLevelComplete();
            }
        } else {
            holding = 0;
            fill.style.filter = 'none';
        }

        requestAnimationFrame(loop);
    }
    loop();

    btn.onmousedown = (e) => {
        if (e.cancelable) e.preventDefault();
        velocity += 4;
        playSound('click');
    };
    btn.ontouchstart = (e) => {
        e.preventDefault();
        velocity += 4;
        playSound('click');
    };

    els.puzzleContainer.appendChild(gauge);
    els.puzzleContainer.appendChild(btn);
}


// --- EVENTS ---
document.getElementById('start-btn').onclick = initGame;
document.getElementById('retry-btn').onclick = () => {
    els.resultView.classList.add('hidden');
    els.menuView.classList.remove('hidden');
};
document.getElementById('abort-btn').onclick = () => {
    if (confirm('ABORT MISSION?')) failGame();
};
