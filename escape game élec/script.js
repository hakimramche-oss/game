// --- CONFIGURATION ---
const TOTAL_LEVELS = 20;
const MAX_TIME = 300; // 5 minutes

const QUESTIONS = [
    { q: "Vrai ou Faux ? Un technicien passe sa journée à changer des ampoules.", answers: ["Vrai, c'est tout ce qu'il fait", "Faux, c'est super varié (Robotique, Domotique...)", "Vrai, dans le noir", "Faux, il dort"], correct: 1 },
    { q: "Quel est le super-pouvoir d'un apprenti au CFA ?", answers: ["Il vole", "Il gagne de l'argent en apprenant", "Il devient invisible", "Il ne fait rien"], correct: 1 },
    { q: "L'électricité, c'est magique ? Non, c'est...", answers: ["De la chance", "De la science et de la logique", "Des petits lutins", "Du hasard"], correct: 1 },
    { q: "Où peux-tu travailler avec ce métier ?", answers: ["Partout (Bâtiment, Usine, Spectacle...)", "Uniquement dans ta chambre", "Sur la lune (bientôt)", "Nulle part"], correct: 0 },
    { q: "Pour devenir un Pro, le mieux c'est...", answers: ["Regarder des tutos flous", "Pratiquer au CFA avec des pros", "Lire le dictionnaire", "Attendre que ça vienne"], correct: 1 },
    { q: "C'est quoi la Domotique ?", answers: ["Une danse", "La maison connectée (contrôle vocal, etc.)", "Une marque de céréales", "Un outil rouillé"], correct: 1 },
    { q: "En alternance, tu es...", answers: ["Juste un stagiaire", "Un salarié payé et formé", "Un bénévole", "Un spectateur"], correct: 1 },
    { q: "Si tu aimes les jeux vidéo, tu aimeras...", answers: ["La programmation d'automates", "Balayer", "Porter des cartons", "Rien"], correct: 0 },
    { q: "Quel outil est indispensable à l'électricien ?", answers: ["Une baguette magique", "Un multimètre", "Une boussole", "Un mixeur"], correct: 1 },
    { q: "Le bâtiment intelligent, c'est quoi ?", answers: ["Un immeuble qui lit des livres", "La Smart City (gestion d'énergie, éclairage auto)", "Une maison hantée", "Une cabane au fond du jardin"], correct: 1 },
    { q: "Peut-on travailler dans l'écologie avec l'électricité ?", answers: ["Non, c'est polluant", "Oui, avec les panneaux solaires et bornes de recharge", "Impossible", "Seulement le dimanche"], correct: 1 },
    { q: "C'est quoi un disjoncteur ?", answers: ["Un type de café", "Un appareil qui protège ton installation", "Une pièce de théâtre", "Un moteur de voiture"], correct: 1 },
    { q: "L'intelligence artificielle en électricité sert à...", answers: ["Prévoir les pannes", "Faire les devoirs à ta place", "Remplacer le soleil", "Rien du tout"], correct: 0 },
    { q: "Combien gagne un apprenti au CFA ?", answers: ["Rien, il paie", "Un pourcentage du SMIC selon son âge", "1 million d'euros", "Des tickets resto uniquement"], correct: 1 },
    { q: "Le métier d'électricien est-il dangereux ?", answers: ["Oui, si on ne respecte pas les règles", "Non, c'est sans risque", "Seulement s'il pleut", "Si on porte du bleu"], correct: 0 },
    { q: "Vrai ou Faux : Le réseau électrique français est l'un des plus fiables au monde.", answers: ["Vrai", "Faux, ça coupe tout le temps", "Vrai mais seulement à Lyon", "C'est un secret"], correct: 0 },
    { q: "Que signifie BT en électricité ?", answers: ["Beau Travail", "Basse Tension", "Boîte de Transport", "Bras Tendus"], correct: 1 },
    { q: "Quel est l'intérêt de la maintenance prédictive ?", answers: ["Réparer avant que ça casse", "Attendre la panne", "Prévoir la météo", "Regarder l'heure"], correct: 0 },
    { q: "Un automate programmable, c'est...", answers: ["Un batteur de cuisine", "Le 'cerveau' d'une machine industrielle", "Un robot ménager", "Un jouet"], correct: 1 },
    { q: "L'habilitation électrique, c'est...", answers: ["Un diplôme de natation", "L'autorisation de travailler sur les circuits", "Une décoration", "Le permis de conduire"], correct: 1 }
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
    hud: document.getElementById('hud-overlay'),
    transition: document.getElementById('transition-overlay'),
    backMenuBtn: document.getElementById('back-menu-btn'),
    bgMusic: document.getElementById('bg-music'),
    sfxSuccess: document.getElementById('sfx-success'),
    sfxFail: document.getElementById('sfx-fail'),
    sfxClick: document.getElementById('sfx-click'),
    soundToggle: document.getElementById('sound-toggle'),
    soundIcon: document.getElementById('sound-icon'),
    audioSubmenu: document.getElementById('audio-submenu'),
    musicMuteBtn: document.getElementById('music-mute-btn'),
    sfxMuteBtn: document.getElementById('sfx-mute-btn'),
};

// --- AUDIO ---
let audioState = {
    musicMuted: false,
    sfxMuted: false,
};

function playSound(type) {
    if (audioState.sfxMuted) return;

    // We can still use AudioContext for some procedural sounds if desired,
    // but the user wants "real" sounds, so we use the audio elements.
    switch (type) {
        case 'click':
            els.sfxClick.currentTime = 0;
            els.sfxClick.play().catch(e => { });
            break;
        case 'success':
            els.sfxSuccess.currentTime = 0;
            els.sfxSuccess.play().catch(e => { });
            break;
        case 'error':
        case 'fail':
            els.sfxFail.currentTime = 0;
            els.sfxFail.play().catch(e => { });
            break;
        case 'win':
            // Success + music volume drop or something? 
            // For now just success
            els.sfxSuccess.currentTime = 0;
            els.sfxSuccess.play().catch(e => { });
            break;
    }
}

function updateAudioUI() {
    els.bgMusic.muted = audioState.musicMuted;

    els.musicMuteBtn.innerText = audioState.musicMuted ? 'OFF' : 'ON';
    els.musicMuteBtn.classList.toggle('off', audioState.musicMuted);

    els.sfxMuteBtn.innerText = audioState.sfxMuted ? 'OFF' : 'ON';
    els.sfxMuteBtn.classList.toggle('off', audioState.sfxMuted);

    // Update main icon
    if (audioState.musicMuted && audioState.sfxMuted) {
        els.soundIcon.innerText = '🔇';
    } else if (audioState.musicMuted || audioState.sfxMuted) {
        els.soundIcon.innerText = '🔉';
    } else {
        els.soundIcon.innerText = '🔊';
    }
}

// Toggle submenu
els.soundToggle.onclick = (e) => {
    e.stopPropagation();
    els.audioSubmenu.classList.toggle('hidden');
};

// Close submenu on click outside
document.addEventListener('click', (e) => {
    if (!els.audioSubmenu.contains(e.target) && e.target !== els.soundToggle) {
        els.audioSubmenu.classList.add('hidden');
    }
});

els.musicMuteBtn.onclick = (e) => {
    e.stopPropagation();
    audioState.musicMuted = !audioState.musicMuted;
    updateAudioUI();
    localStorage.setItem('electranova_music_muted', audioState.musicMuted);
};

els.sfxMuteBtn.onclick = (e) => {
    e.stopPropagation();
    audioState.sfxMuted = !audioState.sfxMuted;
    updateAudioUI();
    localStorage.setItem('electranova_sfx_muted', audioState.sfxMuted);
};

// Initialize from storage
if (localStorage.getItem('electranova_music_muted') === 'true') audioState.musicMuted = true;
if (localStorage.getItem('electranova_sfx_muted') === 'true') audioState.sfxMuted = true;
updateAudioUI();

function startMusic() {
    if (els.bgMusic.paused) {
        els.bgMusic.volume = 0.4;
        els.bgMusic.play().catch(e => {
            console.log("Autoplay blocked, waiting for interaction");
        });
    }
}

// --- LEVEL GENERATION ---
function generateLevels() {
    const types = ['QUIZ', 'TOGGLE', 'QUIZ', 'CABLES', 'QUIZ', 'MEMORY', 'QUIZ', 'SLIDERS', 'QUIZ', 'KEYPAD', 'QUIZ', 'VALVE', 'QUIZ'];
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
    startMusic();
    currentState.levels = generateLevels();
    currentState.levelIndex = 0;
    currentState.timeLeft = MAX_TIME;

    els.menuView.classList.add('hidden');
    els.resultView.classList.add('hidden');
    els.levelView.classList.remove('hidden');
    els.hud.classList.remove('hidden');
    els.backMenuBtn.classList.remove('hidden');

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

    // Smooth transition
    els.transition.classList.remove('hidden');
    els.transition.style.opacity = '1';

    setTimeout(() => {
        // Render specific puzzle
        switch (level.type) {
            case 'QUIZ': renderQuiz(level); break;
            case 'TOGGLE': renderToggle(level); break;
            case 'CABLES': renderCables(level); break;
            case 'MEMORY': renderMemory(level); break;
            case 'SLIDERS': renderSliders(level); break;
            case 'KEYPAD': renderKeypad(level); break;
            case 'VALVE': renderValve(level); break;

        }
        els.transition.style.opacity = '0';
        setTimeout(() => els.transition.classList.add('hidden'), 300);
    }, 200);
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
    els.hud.classList.add('hidden');
    els.backMenuBtn.classList.add('hidden');
    els.ledPower.classList.remove('on');
    els.ledWarning.classList.remove('on');
}

function winGame() {
    stopGame();
    playSound('win');
    els.resultView.classList.remove('hidden');
    document.getElementById('result-title').innerText = "POTENTIEL CONFIRMÉ !";
    document.getElementById('result-title').style.color = "#3f3";
    document.getElementById('result-msg').innerHTML = `
        <div style="font-size:1.2rem; margin-top:20px;">
            <p>Bravo ! Tu as la logique d'un futur technicien.</p>
            <p>Ne gaspille pas ton talent.</p>
            <p><strong>VIENS TE FORMER AU CFA</strong> et deviens un vrai Pro !</p>
        </div>
    `;
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



// 7. MEMORY (Sequence)
function renderMemory(config) {
    els.taskInstruction.innerText = "REPRODUIRE LA SÉQUENCE DE TEST";
    const container = document.createElement('div');
    container.className = 'memory-grid';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = '1fr 1fr';
    container.style.gap = '20px';

    const colors = ['#f33', '#3f3', '#33f', '#ff3'];
    const leds = [];
    let sequence = [];
    let userIdx = 0;
    const seqLen = 3 + Math.floor(config.difficulty * 3);

    let isDisplaying = false;

    for (let i = 0; i < 4; i++) {
        const led = document.createElement('div');
        led.className = 'memory-led';
        led.style.width = '80px';
        led.style.height = '80px';
        led.style.background = '#222';
        led.style.border = '4px solid #444';
        led.style.cursor = 'pointer';
        led.dataset.id = i;

        led.onclick = () => {
            if (isDisplaying) return;
            flashLed(i);
            if (parseInt(led.dataset.id) === sequence[userIdx]) {
                userIdx++;
                if (userIdx === sequence.length) {
                    setTimeout(onLevelComplete, 500);
                }
            } else {
                playSound('error');
                userIdx = 0;
                currentState.timeLeft -= 5;
                setTimeout(showSequence, 1000);
            }
        };
        leds.push(led);
        container.appendChild(led);
    }

    els.puzzleContainer.appendChild(container);

    function flashLed(id) {
        playSound('click');
        leds[id].style.background = colors[id];
        leds[id].style.boxShadow = `0 0 20px ${colors[id]}`;
        setTimeout(() => {
            leds[id].style.background = '#222';
            leds[id].style.boxShadow = 'none';
        }, 300);
    }

    function showSequence() {
        isDisplaying = true;
        let i = 0;
        const interval = setInterval(() => {
            flashLed(sequence[i]);
            i++;
            if (i >= sequence.length) {
                clearInterval(interval);
                isDisplaying = false;
            }
        }, 600);
    }

    // Start
    for (let i = 0; i < seqLen; i++) sequence.push(Math.floor(Math.random() * 4));
    setTimeout(showSequence, 800);
}


// --- EVENTS ---
document.addEventListener('click', () => {
    // Attempt to start music on any first click if not already playing
    if (els.bgMusic.paused && !isMuted) {
        startMusic();
    }
}, { once: true });

document.getElementById('start-btn').onclick = initGame;

document.getElementById('retry-btn').onclick = () => {
    els.resultView.classList.add('hidden');
    els.menuView.classList.remove('hidden');
    els.backMenuBtn.classList.add('hidden');
};
document.getElementById('back-menu-btn').onclick = () => {
    if (confirm('RETOURNER AU MENU ?')) {
        stopGame();
        els.menuView.classList.remove('hidden');
        els.backMenuBtn.classList.add('hidden');
    }
};
document.getElementById('abort-btn').onclick = () => {
    if (confirm('STOP MISSION?')) failGame();
};
