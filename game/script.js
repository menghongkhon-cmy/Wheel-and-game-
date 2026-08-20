// script.js
/**
 * STUDYVERSE 2.0 - Core Application Architecture
 */

// --- 1. APP STATE ENGINE ---
const DEFAULT_STATE = {
    profile: {
        nickname: "Alex",
        avatar: "🧑‍🎓",
        level: 1,
        xp: 0,
        coins: 100,
        streak: 1,
        lastActive: new Date().toISOString().slice(0, 10),
        difficulty: "intermediate",
        favSubject: "math"
    },
    statistics: {
        gamesPlayed: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        bestWpm: 0,
        learningTimeMinutes: 0
    },
    achievements: [],
    inventory: ["default_avatar"],
    questProgress: { unlockedNodes: [1], completedNodes: [] },
    daily: {
        date: new Date().toISOString().slice(0, 10),
        missions: [
            { id: 1, text: "Play 1 Math Game", target: 1, current: 0, rewardXp: 200, rewardCoins: 50, done: false },
            { id: 2, text: "Answer 5 Questions Correctly", target: 5, current: 0, rewardXp: 300, rewardCoins: 50, done: false }
        ]
    },
    powerups: { hint: 2, time: 2, doubleXp: 1 },
    settings: { sound: true, lang: "en", theme: "dark" }
};

let appState = JSON.parse(localStorage.getItem('studyverse_state')) || DEFAULT_STATE;
let activeGameSession = null;

// --- 2. DICTIONARIES & TRANSLATIONS ---
const I18N = {
    en: {
        navHome: "Home", navGames: "Games", navQuest: "Study Quest", navAchievements: "Achievements",
        navStats: "Statistics", navProfile: "Profile & Shop", navSettings: "Settings",
        welcomeSub: "Ready to level up your brain today?", continueBtn: "Continue Playing",
        dailyTitle: "Daily Missions", recTag: "Recommended For You", featuredGames: "Featured Learning Games",
        gameLibrary: "Game Library", questTitle: "Study Quest World Map", achievementsTitle: "Badges & Achievements",
        statsTitle: "Analytics & Leaderboard", profileTitle: "Student Profile", settingsTitle: "Settings"
    },
    km: {
        navHome: "ទំព័រដើម", navGames: "ហ្គេម", navQuest: "បេសកកម្ម", navAchievements: "សមិទ្ធផល",
        navStats: "ស្ថិតិ", navProfile: "ប្រវត្តិរូប", navSettings: "ការកំណត់",
        welcomeSub: "ត្រៀមខ្លួនដើម្បីអភិវឌ្ឍខួរក្បាលរបស់អ្នកហើយឬនៅ?", continueBtn: "បន្តលេង",
        dailyTitle: "បេសកកម្មប្រចាំថ្ងៃ", recTag: "ណែនាំសម្រាប់អ្នក", featuredGames: "ហ្គេមសិក្សាឆ្នើម",
        gameLibrary: "បណ្ណាល័យហ្គេម", questTitle: "ផែនទីពិភពលោក Study Quest", achievementsTitle: "គ្រឿងឥស្សរិយយស",
        statsTitle: "ការវិភាគ និង តារាងពិន្ទុ", profileTitle: "ប្រវត្តិរូបសិស្ស", settingsTitle: "ការកំណត់"
    }
};

// --- 3. AUDIO SYNTHESIZER ENGINE ---
const AudioEngine = {
    ctx: null,
    init() {
        if (!this.ctx && typeof AudioContext !== 'undefined') {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    playTone(freq, type = 'sine', duration = 0.15) {
        if (!appState.settings.sound) return;
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    },
    playCorrect() { this.playTone(587, 'triangle', 0.1); setTimeout(() => this.playTone(880, 'triangle', 0.2), 100); },
    playWrong() { this.playTone(220, 'sawtooth', 0.3); },
    playLevelUp() { [440, 554, 659, 880].forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 0.2), i * 120)); }
};

// --- 4. DATA BANKS (10 GAMES CONTENT) ---
const GAME_DEFINITIONS = [
    { id: "brain_rush", name: "🧠 Brain Rush", category: "logic", desc: "Fast-paced trivia blitz across all subjects." },
    { id: "math_battle", name: "⚔️ Math Battle", category: "math", desc: "Turn-based arithmetic battle against AI." },
    { id: "word_quest", name: "🔤 Word Quest", category: "english", desc: "Vocabulary adventure with speech pronunciation." },
    { id: "memory_arena", name: "🧩 Memory Arena", category: "logic", desc: "Match words, facts, and equations in grid modes." },
    { id: "science_lab", name: "🔬 Science Lab", category: "science", desc: "Virtual lab missions in Biology, Physics, and Space." },
    { id: "world_explorer", name: "🌍 World Explorer", category: "geography", desc: "Unlock world continents, flags, and capitals." },
    { id: "logic_detective", name: "🕵️ Logic Detective", category: "logic", desc: "Solve sequence mysteries and deduction grids." },
    { id: "typing_hero", name: "⌨️ Typing Hero", category: "english", desc: "Boost typing WPM and speed precision." },
    { id: "smart_money", name: "💰 Smart Money", category: "finance", desc: "Teen financial budget simulator." },
    { id: "study_quest", name: "🗺️ Study Quest RPG", category: "adventure", desc: "Main RPG questing through educational lands." }
];

const QUESTION_BANK = {
    math: [
        { q: "What is 12 × 8?", options: ["86", "96", "104", "88"], ans: "96", exp: "12 multiplied by 8 equals 96." },
        { q: "Solve for x: 2x + 5 = 15", options: ["x = 5", "x = 10", "x = 6", "x = 4"], ans: "x = 5", exp: "Subtract 5 then divide by 2." }
    ],
    english: [
        { q: "Choose the synonym for 'Brave':", options: ["Timid", "Courageous", "Lazy", "Silent"], ans: "Courageous", exp: "Brave means having courage." },
        { q: "Which is a noun?", options: ["Run", "Happiness", "Quickly", "Blue"], ans: "Happiness", exp: "Happiness is an abstract noun." }
    ],
    science: [
        { q: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], ans: "Mars", exp: "Mars looks red due to iron oxide on its surface." },
        { q: "What gas do plants absorb during photosynthesis?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"], ans: "Carbon Dioxide", exp: "Plants consume CO2 to produce sugar." }
    ]
};

// --- 5. INITIALIZATION & CORE ENGINE ---
document.addEventListener('DOMContentLoaded', () => {
    checkFirstTimeOnboarding();
    setupEventListeners();
    updateUI();
    renderGameGrid('homeGameGrid', GAME_DEFINITIONS.slice(0, 4));
    renderGameGrid('fullGameGrid', GAME_DEFINITIONS);
    renderAchievements();
    renderQuestMap();
});

function saveState() {
    localStorage.setItem('studyverse_state', JSON.stringify(appState));
    updateUI();
}

function updateUI() {
    // Header Stats
    document.getElementById('navNickname').textContent = appState.profile.nickname;
    document.getElementById('navLevel').textContent = appState.profile.level;
    document.getElementById('navCoins').textContent = appState.profile.coins;
    document.getElementById('navStreak').textContent = appState.profile.streak;
    document.getElementById('navAvatarDisplay').textContent = appState.profile.avatar;
    
    // XP Calculation
    const nextLevelXp = appState.profile.level * 500;
    const xpPercent = Math.min(100, Math.floor((appState.profile.xp / nextLevelXp) * 100));
    document.getElementById('navXpFill').style.width = `${xpPercent}%`;

    // Analytics Dashboard
    document.getElementById('statTotalXp').textContent = appState.profile.xp;
    document.getElementById('statGamesPlayed').textContent = appState.statistics.gamesPlayed;
    document.getElementById('statBestWpm').textContent = appState.statistics.bestWpm;
    const accuracy = appState.statistics.questionsAnswered > 0 
        ? Math.round((appState.statistics.correctAnswers / appState.statistics.questionsAnswered) * 100) : 0;
    document.getElementById('statAccuracy').textContent = `${accuracy}%`;

    // Daily Missions Render
    const dailyContainer = document.getElementById('dailyMissionsList');
    dailyContainer.innerHTML = appState.daily.missions.map(m => `
        <div class="daily-item" style="display:flex; justify-content:space-between; margin-top:0.5rem;">
            <span>${m.done ? '✅' : '⏳'} ${m.text}</span>
            <small>${m.current}/${m.target}</small>
        </div>
    `).join('');

    // Local Leaderboard
    const lbBody = document.getElementById('leaderboardBody');
    lbBody.innerHTML = `
        <tr>
            <td>🥇 1</td>
            <td>${appState.profile.nickname} (You)</td>
            <td>Lv. ${appState.profile.level}</td>
            <td>${appState.profile.xp} XP</td>
            <td>🔥 ${appState.profile.streak}</td>
        </tr>
    `;
}

// --- 6. NAVIGATION & MODAL CONTROLS ---
function setupEventListeners() {
    // Sidebar Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const viewTarget = btn.getAttribute('data-view');
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`view${capitalize(viewTarget)}`).classList.add('active');
        });
    });

    // Theme & Language
    document.getElementById('themeToggleBtn').addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        appState.settings.theme = nextTheme;
        saveState();
    });

    document.getElementById('langToggleBtn').addEventListener('click', () => {
        appState.settings.lang = appState.settings.lang === 'en' ? 'km' : 'en';
        document.getElementById('langToggleBtn').textContent = appState.settings.lang === 'en' ? '🇬🇧' : '🇰🇭';
        applyLanguage(appState.settings.lang);
        saveState();
    });

    document.getElementById('closeGameBtn').addEventListener('click', closeGameModal);
    
    // Onboarding
    document.getElementById('btnStartOnboarding').addEventListener('click', () => {
        const nameInput = document.getElementById('onboardName').value.trim();
        if (nameInput) appState.profile.nickname = nameInput;
        appState.profile.difficulty = document.getElementById('onboardLevel').value;
        document.getElementById('onboardingModal').classList.remove('active');
        saveState();
    });

    // Recommended Play Button
    document.getElementById('recPlayBtn').addEventListener('click', () => launchGame('logic_detective'));
}

function applyLanguage(lang) {
    const dict = I18N[lang] || I18N['en'];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.textContent = dict[key];
    });
}

function showToast(message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function checkFirstTimeOnboarding() {
    if (!localStorage.getItem('studyverse_state')) {
        document.getElementById('onboardingModal').classList.add('active');
    }
}

// --- 7. GAME ENGINE LAUNCHER & STAGERS ---
function renderGameGrid(containerId, games) {
    const container = document.getElementById(containerId);
    container.innerHTML = games.map(g => `
        <div class="game-card" onclick="launchGame('${g.id}')">
            <div>
                <div class="game-card-icon">${g.name.split(' ')[0]}</div>
                <h4>${g.name}</h4>
                <p class="text-muted small">${g.desc}</p>
            </div>
            <div class="game-card-tags">
                <span class="badge">${g.category.toUpperCase()}</span>
            </div>
        </div>
    `).join('');
}

function launchGame(gameId) {
    const game = GAME_DEFINITIONS.find(g => g.id === gameId);
    if (!game) return;

    document.getElementById('gameModalTitle').textContent = game.name;
    document.getElementById('gameModal').classList.add('active');
    
    const stage = document.getElementById('gameStage');
    stage.innerHTML = '';
    
    // Launch Specific Game Mode
    switch(gameId) {
        case 'brain_rush': startBrainRush(stage); break;
        case 'math_battle': startMathBattle(stage); break;
        case 'typing_hero': startTypingHero(stage); break;
        case 'smart_money': startSmartMoney(stage); break;
        case 'word_quest': startWordQuest(stage); break;
        default: startGenericQuiz(stage, game.category); break;
    }
}

function closeGameModal() {
    document.getElementById('gameModal').classList.remove('active');
    if (activeGameSession && activeGameSession.timer) clearInterval(activeGameSession.timer);
    activeGameSession = null;
}

// --- 8. GAME IMPLEMENTATIONS ---

// GAME 1: BRAIN RUSH
function startBrainRush(stage) {
    let score = 0, currentIdx = 0, combo = 1;
    const questions = [...QUESTION_BANK.math, ...QUESTION_BANK.english, ...QUESTION_BANK.science];
    
    function renderQ() {
        if (currentIdx >= questions.length) {
            finishGameSession(score, 100, 25);
            return;
        }
        const q = questions[currentIdx];
        stage.innerHTML = `
            <div class="quiz-box">
                <div class="quiz-question">${q.q}</div>
                <div class="options-grid">
                    ${q.options.map(opt => `<button class="opt-btn" onclick="checkBrainRush('${opt}', '${q.ans}')">${opt}</button>`).join('')}
                </div>
            </div>
        `;
    }

    window.checkBrainRush = (selected, correct) => {
        appState.statistics.questionsAnswered++;
        if (selected === correct) {
            AudioEngine.playCorrect();
            appState.statistics.correctAnswers++;
            score += 100 * combo;
            combo++;
            showToast(`Correct! Combo x${combo}`);
        } else {
            AudioEngine.playWrong();
            combo = 1;
            showToast(`Wrong! Answer was: ${correct}`);
        }
        currentIdx++;
        renderQ();
    };

    renderQ();
}

// GAME 2: MATH BATTLE
function startMathBattle(stage) {
    let playerHp = 100, aiHp = 100, score = 0;

    function nextTurn() {
        if (playerHp <= 0 || aiHp <= 0) {
            finishGameSession(score, 120, 30);
            return;
        }
        const num1 = Math.floor(Math.random() * 12) + 1;
        const num2 = Math.floor(Math.random() * 12) + 1;
        const ans = num1 * num2;

        stage.innerHTML = `
            <div class="battle-arena">
                <div class="fighters">
                    <div class="fighter">
                        <span class="fighter-avatar">🧑‍🎓</span>
                        <strong>Player</strong>
                        <div class="health-bar"><div class="health-fill" style="width:${playerHp}%"></div></div>
                    </div>
                    <div>VS</div>
                    <div class="fighter">
                        <span class="fighter-avatar">👾</span>
                        <strong>AI Monster</strong>
                        <div class="health-bar"><div class="health-fill" style="width:${aiHp}%"></div></div>
                    </div>
                </div>
                <div class="quiz-box">
                    <div class="quiz-question">${num1} × ${num2} = ?</div>
                    <div class="options-grid">
                        ${[ans, ans + 2, ans - 3, ans + 5].sort(() => Math.random() - 0.5).map(val => 
                            `<button class="opt-btn" onclick="submitMB(${val}, ${ans})">${val}</button>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    window.submitMB = (val, ans) => {
        if (val === ans) {
            aiHp -= 25;
            score += 150;
            AudioEngine.playCorrect();
        } else {
            playerHp -= 20;
            AudioEngine.playWrong();
        }
        nextTurn();
    };

    nextTurn();
}

// GAME 8: TYPING HERO
function startTypingHero(stage) {
    const textToType = "Learning to code opens endless creative possibilities.";
    stage.innerHTML = `
        <div class="typing-container">
            <h3>Type the text below as fast as you can:</h3>
            <div class="typing-prompt" id="typePrompt">${textToType}</div>
            <input type="text" class="typing-input" id="typeInput" autofocus placeholder="Start typing here...">
        </div>
    `;

    const input = document.getElementById('typeInput');
    const startTime = Date.now();

    input.addEventListener('input', () => {
        const val = input.value;
        if (val === textToType) {
            const timeTakenSec = (Date.now() - startTime) / 1000;
            const wpm = Math.round((textToType.split(' ').length / timeTakenSec) * 60);
            if (wpm > appState.statistics.bestWpm) appState.statistics.bestWpm = wpm;
            AudioEngine.playLevelUp();
            finishGameSession(wpm * 10, wpm * 5, 20, `Typing Finished! Speed: ${wpm} WPM`);
        }
    });
}

// GAME 9: SMART MONEY
function startSmartMoney(stage) {
    let budget = 100;
    stage.innerHTML = `
        <div class="quiz-box">
            <h3>💰 Wallet Balance: $${budget}</h3>
            <p class="mt-2">Scenario: You received $100 for your weekly allowance. You need to buy school supplies ($20) and pay for lunch ($30). How much should you allocate to your Savings account?</p>
            <div class="options-grid mt-3">
                <button class="opt-btn" onclick="spendMoney(50)">Save $50 (Optimal)</button>
                <button class="opt-btn" onclick="spendMoney(20)">Save $20 & Spend $30 on Video Games</button>
            </div>
        </div>
    `;

    window.spendMoney = (saved) => {
        if (saved === 50) {
            AudioEngine.playCorrect();
            finishGameSession(200, 150, 40, "Great financial decision! You budgeted perfectly!");
        } else {
            AudioEngine.playWrong();
            finishGameSession(50, 50, 10, "Remember to prioritize savings over wants!");
        }
    };
}

// GAME 3: WORD QUEST
function startWordQuest(stage) {
    const q = QUESTION_BANK.english[0];
    stage.innerHTML = `
        <div class="quiz-box">
            <button class="btn btn-secondary mb-2" onclick="speakWord('${q.ans}')">🔊 Pronounce Word</button>
            <div class="quiz-question">${q.q}</div>
            <div class="options-grid">
                ${q.options.map(opt => `<button class="opt-btn" onclick="finishGameSession(100,50,10)">${opt}</button>`).join('')}
            </div>
        </div>
    `;

    window.speakWord = (word) => {
        if ('speechSynthesis' in window) {
            const msg = new SpeechSynthesisUtterance(word);
            window.speechSynthesis.speak(msg);
        }
    };
}

// GENERIC QUIZ FALLBACK
function startGenericQuiz(stage, category) {
    const list = QUESTION_BANK[category] || QUESTION_BANK.math;
    const q = list[0];
    stage.innerHTML = `
        <div class="quiz-box">
            <div class="quiz-question">${q.q}</div>
            <div class="options-grid">
                ${q.options.map(opt => `<button class="opt-btn" onclick="finishGameSession(100,50,10)">${opt}</button>`).join('')}
            </div>
        </div>
    `;
}

// --- 9. PROGRESSION, XP & ACHIEVEMENTS SYSTEM ---
function finishGameSession(score, xpEarned, coinsEarned, customMsg = null) {
    appState.statistics.gamesPlayed++;
    appState.profile.xp += xpEarned;
    appState.profile.coins += coinsEarned;

    // Check Level Up
    const requiredXp = appState.profile.level * 500;
    if (appState.profile.xp >= requiredXp) {
        appState.profile.level++;
        AudioEngine.playLevelUp();
        showToast(`🎉 LEVEL UP! You are now Level ${appState.profile.level}!`);
    }

    saveState();

    const stage = document.getElementById('gameStage');
    stage.innerHTML = `
        <div style="text-align:center;">
            <h2>🎉 Challenge Completed!</h2>
            <p>${customMsg || 'Great effort on completing your session.'}</p>
            <div style="font-size: 1.2rem; margin: 1rem 0;">
                <div>Score: <strong>${score}</strong></div>
                <div>⭐ +${xpEarned} XP</div>
                <div>🪙 +${coinsEarned} Coins</div>
            </div>
            <button class="btn btn-primary" onclick="closeGameModal()">Return to Platform</button>
        </div>
    `;
}

function renderAchievements() {
    const achievementsList = [
        { id: "a1", name: "🏆 First Step", desc: "Complete 1 game session" },
        { id: "a2", name: "🔥 Streak Master", desc: "Maintain a 3-day learning streak" },
        { id: "a3", name: "⚡ Speed Demon", desc: "Reach 40 WPM in Typing Hero" }
    ];

    const container = document.getElementById('achievementsGrid');
    container.innerHTML = achievementsList.map(a => {
        const unlocked = appState.statistics.gamesPlayed > 0;
        return `
            <div class="achievement-card ${unlocked ? '' : 'locked'}">
                <span style="font-size: 2rem;">${unlocked ? '🏆' : '🔒'}</span>
                <div>
                    <strong>${a.name}</strong>
                    <div class="text-muted small">${a.desc}</div>
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('achievementProgressText').textContent = `${appState.statistics.gamesPlayed > 0 ? 1 : 0} / ${achievementsList.length} Unlocked`;
}

function renderQuestMap() {
    const nodes = [
        { id: 1, name: "🌲 Math Forest", status: "unlocked" },
        { id: 2, name: "🏰 English Castle", status: "unlocked" },
        { id: 3, name: "🔬 Science Lab", status: "locked" },
        { id: 4, name: "🌋 Logic Cave", status: "locked" }
    ];

    const container = document.getElementById('questMapContainer');
    container.innerHTML = nodes.map(n => `
        <div class="quest-node ${n.status}">
            <h3>${n.name}</h3>
            <p>${n.status === 'unlocked' ? '🔓 Accessible' : '🔒 Level 5 Required'}</p>
            <button class="btn btn-primary mt-2" ${n.status === 'locked' ? 'disabled' : ''} onclick="launchGame('brain_rush')">Enter Realm</button>
        </div>
    `).join('');
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}