/* --- TIME SPIN HIGH-QUALITY AUDIO & CANVAS ENGINE --- */

const state = {
    lang: localStorage.getItem('ts_lang') || 'en',
    theme: localStorage.getItem('ts_theme') || 'dark',
    accent: localStorage.getItem('ts_accent') || '#6366f1',
    stats: JSON.parse(localStorage.getItem('ts_stats')) || { spins: 0, teams: 0, focusMinutes: 0, randoms: 0 },
    history: JSON.parse(localStorage.getItem('ts_history')) || [],
    alarms: JSON.parse(localStorage.getItem('ts_alarms')) || []
};

const translations = {
    en: {
        nav_home: "Home", nav_time: "Time & Clocks", nav_spinner: "Spinner", nav_teams: "Teams",
        nav_tools: "Tools", nav_history: "History", nav_settings: "Settings",
        btn_spin: "Spin Name", btn_teams: "Create Teams", btn_timer: "Timers & Clock",
        stat_spins: "Total Spins", stat_teams: "Teams Created", stat_focus: "Focus Time", stat_random: "Random Tools Used",
        sub_clock: "Clock", sub_timer: "Timer", sub_stopwatch: "Stopwatch", sub_pomodoro: "Pomodoro", sub_world: "World Clock", sub_alarm: "Alarms",
        digital_clock: "Digital Clock", analog_clock: "Analog Clock", timer_title: "Countdown Timer", sw_title: "Precision Stopwatch",
        participant_manager: "Participants Manager", team_gen_title: "Team Generator", random_task_assign: "Random Task Assignee",
        tool_coin: "Coin Flip", tool_dice: "Dice Roller", tool_choice: "Choice Picker", tool_number: "Number Generator",
        history_title: "Activity History", settings_title: "Application Settings", alarm_add: "Add New Alarm"
    },
    km: {
        nav_home: "ទំព័រដើម", nav_time: "ពេលវេលា និងនាឡិកា", nav_spinner: "កង់វិល", nav_teams: "បែងចែកក្រុម",
        nav_tools: "ឧបករណ៍", nav_history: "ប្រវត្តិ", nav_settings: "ការកំណត់",
        btn_spin: "វិលកង់", btn_teams: "បង្កើតក្រុម", btn_timer: "នាឡិការាប់ពេល",
        stat_spins: "ការវិលសរុប", stat_teams: "ក្រុមដែលបានបង្កើត", stat_focus: "រយៈពេលផ្ដោតអារម្មណ៍", stat_random: "ឧបករណ៍ចៃដន្យ",
        sub_clock: "នាឡិកា", sub_timer: "រាប់ថយក្រោយ", sub_stopwatch: "ចាប់ពេល", sub_pomodoro: "ម៉ោងធ្វើការ", sub_world: "ល្វែងម៉ោង", sub_alarm: "រោទិ៍",
        digital_clock: "នាឡិកាឌីជីថល", analog_clock: "នាឡិកាអាណាឡូក", timer_title: "នាឡិការាប់ថយក្រោយ", sw_title: "នាឡិកាចាប់ពេលច្បាស់លាស់",
        participant_manager: "អ្នកគ្រប់គ្រងសមាជិក", team_gen_title: "ប្រព័ន្ធបង្កើតក្រុម", random_task_assign: "ចាត់ចែងភារកិច្ចចៃដន្យ",
        tool_coin: "បោះកាក់", tool_dice: "ក្រឡុកឡុកឡាក់", tool_choice: "ជ្រើសរើសជម្រើស", tool_number: "បង្កើតលេខចៃដន្យ",
        history_title: "ប្រវត្តិនៃសកម្មភាព", settings_title: "ការកំណត់កម្មវិធី", alarm_add: "បន្ថែមម៉ោងរោទិ៍"
    }
};

// --- WEB AUDIO SYNTHESIZER ---
let audioCtx = null;
function playTickSound() {
    if (!document.getElementById('soundToggle').checked) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.04);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
}

function playFanfareSound() {
    if (!document.getElementById('soundToggle').checked) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.2, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.3);
    });
}

function speakWinner(winner) {
    if (!document.getElementById('soundToggle').checked || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const announcement = new SpeechSynthesisUtterance(`Wow, ${winner}`);
    announcement.lang = 'en-US';
    announcement.rate = 0.95;
    window.speechSynthesis.speak(announcement);
}

// --- APP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initThemeAndLang();
    initClockModule();
    initSpinnerModule();
    initWorldClock();
    initAlarms();
    renderStats();
    renderHistory();
    setupShortcuts();
});

function initNavigation() {
    document.querySelectorAll('.nav-link').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.querySelectorAll('.subtab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const group = btn.closest('.tab-page');
            const scopeBtns = group ? group.querySelectorAll('.subtab-btn') : document.querySelectorAll('.subtab-btn');
            const scopeContent = group ? group.querySelectorAll('.subtab-content') : document.querySelectorAll('.subtab-content');
            scopeBtns.forEach(b => b.classList.remove('active'));
            scopeContent.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.subtab).classList.add('active');
            if (btn.dataset.subtab === 'subtab-wheelstudio') drawWheel();
        });
    });

    document.getElementById('hamburgerBtn').addEventListener('click', () => {
        document.getElementById('navMenu').classList.toggle('active');
    });

    document.getElementById('langToggle').addEventListener('click', toggleLanguage);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('shortcutHelpBtn').addEventListener('click', () => {
        document.getElementById('shortcutsModal').classList.add('active');
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.nav-link').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
    document.querySelectorAll('.tab-page').forEach(page => page.classList.toggle('active', page.id === `tab-${tabId}`));
    if (tabId === 'spinner') drawWheel();
}

function closeShortcutsModal() {
    document.getElementById('shortcutsModal').classList.remove('active');
}

function setupShortcuts() {
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        const spinnerActive = document.getElementById('tab-spinner').classList.contains('active');
        const wheelStudioActive = document.getElementById('subtab-wheelstudio')?.classList.contains('active');
        const quickSpinActive = document.getElementById('subtab-quickspin')?.classList.contains('active');

        if (e.code === 'Space') {
            e.preventDefault();
            if (spinnerActive && wheelStudioActive) return startSpinSequence();
            if (spinnerActive && quickSpinActive) return quickSpin();
            const activeSub = document.querySelector('.subtab-content.active');
            if (activeSub && activeSub.id === 'subtab-timer') toggleTimer();
            else if (activeSub && activeSub.id === 'subtab-stopwatch') toggleStopwatch();
            else if (activeSub && activeSub.id === 'subtab-pomodoro') togglePomo();
        } else if (e.code === 'KeyS') {
            if (spinnerActive) startSpinSequence();
        } else if (e.code === 'KeyW') {
            switchTab('spinner');
        } else if (e.code === 'KeyT') {
            switchTab('time');
        } else if (e.code === 'KeyF') {
            togglePresentationMode();
        } else if (e.code === 'Escape') {
            closeWinnerModal();
            closeShortcutsModal();
            closeBulkImport();
            if (document.body.classList.contains('presentation-mode')) togglePresentationMode();
        }
    });
}

function initThemeAndLang() {
    document.documentElement.setAttribute('data-theme', state.theme);
    document.getElementById('themeToggle').textContent = state.theme === 'dark' ? '🌙' : '☀️';
    updateLanguageUI();
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('ts_theme', state.theme);
    document.documentElement.setAttribute('data-theme', state.theme);
    document.getElementById('themeToggle').textContent = state.theme === 'dark' ? '🌙' : '☀️';
}

function toggleLanguage() {
    state.lang = state.lang === 'en' ? 'km' : 'en';
    localStorage.setItem('ts_lang', state.lang);
    document.getElementById('langToggle').textContent = state.lang === 'en' ? '🇰🇭 ខ្មែរ' : '🇬🇧 EN';
    updateLanguageUI();
}

function updateLanguageUI() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (translations[state.lang][key]) {
            el.textContent = translations[state.lang][key];
        }
    });
}

// --- CLOCKS ---
let is24Hour = false;
function initClockModule() {
    setInterval(updateClocks, 1000);
    updateClocks();
    document.getElementById('toggleFormatBtn').addEventListener('click', () => {
        is24Hour = !is24Hour;
        document.getElementById('toggleFormatBtn').textContent = is24Hour ? "Switch to 12H" : "Switch to 24H";
    });
}

function updateClocks() {
    const now = new Date();
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !is24Hour };
    const timeStr = now.toLocaleTimeString('en-US', options);
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    document.getElementById('heroTimeDisplay').textContent = timeStr;
    document.getElementById('heroDateDisplay').textContent = dateStr;
    document.getElementById('digitalClockTime').textContent = timeStr;
    document.getElementById('digitalClockDate').textContent = dateStr;

    const secs = now.getSeconds();
    const mins = now.getMinutes();
    const hrs = now.getHours();
    
    document.getElementById('secHand').style.transform = `rotate(${secs * 6}deg)`;
    document.getElementById('minHand').style.transform = `rotate(${mins * 6 + secs * 0.1}deg)`;
    document.getElementById('hourHand').style.transform = `rotate(${hrs * 30 + mins * 0.5}deg)`;
}

// --- HIGH-DPI CANVAS SPINNER ENGINE ---
const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899'];
let spinAngle = 0;
let isSpinning = false;
let lastTickIndex = -1;
let glowSliceIndex = -1;
let wheelEntries = [];
let pendingWinners = [];

// --- TOAST NOTIFICATIONS ---
function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) { console.log(message); return; }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function cryptoId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'e' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function secureRandom() {
    if (window.crypto && crypto.getRandomValues) {
        const buf = new Uint32Array(1);
        crypto.getRandomValues(buf);
        return buf[0] / 4294967296;
    }
    return Math.random();
}

function makeEntry(label, colorIndex) {
    return { id: cryptoId(), label: String(label).slice(0, 60), color: colors[colorIndex % colors.length], weight: 1, enabled: true };
}

function initSpinnerModule() {
    loadWheelEntries();
    renderEntryList();
    document.getElementById('winnersCount').addEventListener('change', onWheelSettingChange);
    document.getElementById('probMode').addEventListener('change', onWheelSettingChange);
    window.addEventListener('resize', drawWheel);
    onDurationSlide();
    drawWheel();
}

function loadWheelEntries() {
    const sharedWheel = new URLSearchParams(location.search).get('wheel');
    if (sharedWheel) {
        try {
            const decoded = JSON.parse(decodeURIComponent(escape(atob(sharedWheel))));
            if (Array.isArray(decoded) && decoded.length) {
                wheelEntries = decoded.slice(0, 200).map((item, i) => {
                    if (typeof item === 'string') return makeEntry(item, i);
                    return { id: cryptoId(), label: String(item.label || 'Option').slice(0, 60), color: /^#[0-9a-fA-F]{6}$/.test(item.color) ? item.color : colors[i % colors.length], weight: Math.max(1, Math.min(99, parseInt(item.weight, 10) || 1)), enabled: true };
                });
                saveWheelEntries();
                showToast('Shared wheel loaded');
                return;
            }
        } catch (error) {
            showToast('This wheel link could not be opened');
        }
    }
    const savedV2 = JSON.parse(localStorage.getItem('ts_wheel_entries_v2') || 'null');
    if (Array.isArray(savedV2) && savedV2.length) { wheelEntries = savedV2; return; }
    const legacy = JSON.parse(localStorage.getItem('ts_saved_wheel') || 'null');
    if (Array.isArray(legacy) && legacy.length) { wheelEntries = legacy.map((n, i) => makeEntry(n, i)); return; }
    wheelEntries = ['Menghong', 'Dara', 'Sokha', 'Vanna', 'Rina', 'Pheak', 'Chan'].map((n, i) => makeEntry(n, i));
}

function saveWheelEntries() {
    localStorage.setItem('ts_wheel_entries_v2', JSON.stringify(wheelEntries));
}

function getActiveEntries() {
    return wheelEntries.filter(e => e.enabled && e.label && e.label.trim().length);
}

function renderEntryList() {
    const container = document.getElementById('entryList');
    if (!container) return;
    const weighted = document.getElementById('probMode')?.value === 'weighted';
    container.innerHTML = wheelEntries.map(e => `
        <div class="entry-row ${e.enabled ? '' : 'entry-disabled'}" data-id="${e.id}">
            <input type="color" class="entry-color" value="${e.color}" onchange="updateEntry('${e.id}',{color:this.value})" aria-label="Entry color">
            <input type="text" class="entry-text" value="${escapeAttr(e.label)}" oninput="updateEntry('${e.id}',{label:this.value})" placeholder="Entry" maxlength="60" aria-label="Entry name">
            ${weighted ? `<input type="number" class="entry-weight" min="1" max="99" value="${e.weight}" onchange="updateEntry('${e.id}',{weight: Math.max(1, Math.min(99, parseInt(this.value,10)||1))})" title="Weight" aria-label="Entry weight">` : ''}
            <input type="checkbox" class="entry-enable" ${e.enabled ? 'checked' : ''} onchange="updateEntry('${e.id}',{enabled:this.checked}); renderEntryList();" title="Enabled" aria-label="Enable entry">
            <button class="entry-delete" onclick="deleteEntry('${e.id}')" aria-label="Delete entry">✕</button>
        </div>
    `).join('') || `<p class="text-muted text-sm">No entries yet. Add at least 2 to spin.</p>`;
    updateEntryCountLabel();
    drawWheel();
}

function updateEntryCountLabel() {
    const label = document.getElementById('entryCountLabel');
    if (label) label.textContent = `${getActiveEntries().length} active entries`;
}

function updateEntry(id, patch) {
    const entry = wheelEntries.find(e => e.id === id);
    if (!entry) return;
    Object.assign(entry, patch);
    saveWheelEntries();
    updateEntryCountLabel();
    drawWheel();
}

function deleteEntry(id) {
    wheelEntries = wheelEntries.filter(e => e.id !== id);
    saveWheelEntries();
    renderEntryList();
}

function addEntryRow() {
    wheelEntries.push(makeEntry('New option', wheelEntries.length));
    saveWheelEntries();
    renderEntryList();
}

function shuffleEntries() {
    for (let i = wheelEntries.length - 1; i > 0; i--) {
        const j = Math.floor(secureRandom() * (i + 1));
        [wheelEntries[i], wheelEntries[j]] = [wheelEntries[j], wheelEntries[i]];
    }
    saveWheelEntries();
    renderEntryList();
}

function sortEntries() {
    wheelEntries.sort((a, b) => a.label.localeCompare(b.label));
    saveWheelEntries();
    renderEntryList();
}

function duplicateEntries() {
    wheelEntries = wheelEntries.concat(wheelEntries.map(e => ({ ...e, id: cryptoId() })));
    saveWheelEntries();
    renderEntryList();
    showToast('Entries duplicated');
}

function clearEntries() {
    wheelEntries = [];
    saveWheelEntries();
    renderEntryList();
}

function onWheelSettingChange() {
    renderEntryList();
}

function applySpeedPreset() {
    const speed = document.getElementById('spinSpeed').value;
    const map = { slow: 20, normal: 8, fast: 4, crazy: 1.5 };
    document.getElementById('spinDuration').value = map[speed] || 8;
    onDurationSlide();
}

function onDurationSlide() {
    const v = document.getElementById('spinDuration').value;
    document.getElementById('spinDurationLabel').textContent = `${v}s`;
}

function openBulkImport() {
    document.getElementById('bulkImportText').value = wheelEntries.map(e => e.label).join('\n');
    document.getElementById('bulkImportModal').classList.add('active');
}

function closeBulkImport() {
    document.getElementById('bulkImportModal')?.classList.remove('active');
}

function applyBulkImport() {
    const raw = document.getElementById('bulkImportText').value;
    const list = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean).slice(0, 200);
    if (!list.length) return showToast('Add at least one entry');
    wheelEntries = list.map((label, i) => makeEntry(label, i));
    saveWheelEntries();
    renderEntryList();
    closeBulkImport();
    showToast(`Imported ${list.length} entries`);
}

// --- SLICE MATH (winner is chosen BEFORE the wheel animates) ---
function computeSlices(entries) {
    const weighted = document.getElementById('probMode')?.value === 'weighted';
    const total = weighted ? entries.reduce((s, e) => s + (e.weight || 1), 0) : entries.length;
    let cursor = 0;
    return entries.map(e => {
        const w = weighted ? (e.weight || 1) : 1;
        const arc = (w / total) * 2 * Math.PI;
        const slice = { entry: e, start: cursor, arc, weight: w };
        cursor += arc;
        return slice;
    });
}

function pickWeightedIndex(slices) {
    const totalWeight = slices.reduce((s, sl) => s + sl.weight, 0);
    const r = secureRandom() * totalWeight;
    let cumulative = 0;
    for (let i = 0; i < slices.length; i++) {
        cumulative += slices[i].weight;
        if (r <= cumulative) return i;
    }
    return slices.length - 1;
}

function drawWheel() {
    const canvas = document.getElementById('wheelCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const entries = getActiveEntries();

    const dpr = window.devicePixelRatio || 1;
    const size = 440;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const radius = center - 12;
    ctx.clearRect(0, 0, size, size);
    if (entries.length === 0) return;

    const slices = computeSlices(entries);

    slices.forEach((slice, i) => {
        const angle = spinAngle + slice.start;
        ctx.beginPath();
        ctx.fillStyle = slice.entry.color;
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, angle, angle + slice.arc);
        ctx.lineTo(center, center);
        ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(center, center);
        let midAngle = angle + slice.arc / 2;
        ctx.rotate(midAngle);
        ctx.textAlign = "right";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 15px system-ui";

        let rad = (midAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const label = slice.entry.label.length > 16 ? slice.entry.label.slice(0, 15) + '…' : slice.entry.label;
        if (rad > Math.PI / 2 && rad < (3 * Math.PI) / 2) {
            ctx.rotate(Math.PI);
            ctx.textAlign = "left";
            ctx.fillText(label, -radius + 20, 5);
        } else {
            ctx.fillText(label, radius - 20, 5);
        }
        ctx.restore();

        if (glowSliceIndex === i) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, angle, angle + slice.arc);
            ctx.closePath();
            ctx.lineWidth = 5;
            ctx.strokeStyle = "#ffffff";
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 18;
            ctx.stroke();
            ctx.restore();
        }
    });

    ctx.beginPath();
    ctx.arc(center, center, 28, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
}

function startSpinSequence() {
    if (isSpinning) return;
    const entries = getActiveEntries();
    if (entries.length < 2) return showToast('Add at least 2 options to spin the wheel.');
    const winnersCount = Math.min(10, Math.max(1, parseInt(document.getElementById('winnersCount').value, 10) || 1));
    const countdownSecs = parseInt(document.getElementById('countdownMode').value, 10) || 0;
    pendingWinners = [];
    runCountdownThenSpin(winnersCount, countdownSecs);
}

function runCountdownThenSpin(winnersRemaining, countdownSecs) {
    if (countdownSecs <= 0) return spinOnce(winnersRemaining);
    const overlay = document.getElementById('countdownOverlay');
    const numEl = document.getElementById('countdownNumber');
    overlay.classList.add('active');
    let n = countdownSecs;
    numEl.textContent = n;
    const iv = setInterval(() => {
        n--;
        if (n > 0) { numEl.textContent = n; playTickSound(); }
        else {
            numEl.textContent = 'GO!';
            clearInterval(iv);
            setTimeout(() => { overlay.classList.remove('active'); spinOnce(winnersRemaining); }, 350);
        }
    }, 1000);
}

function spinOnce(winnersRemaining) {
    const entries = getActiveEntries();
    if (entries.length === 0) return finishSpinSequence();

    const slices = computeSlices(entries);
    const winnerSliceIndex = pickWeightedIndex(slices);
    const winnerSlice = slices[winnerSliceIndex];
    const winner = winnerSlice.entry;

    isSpinning = true;
    lastTickIndex = -1;
    glowSliceIndex = -1;
    document.getElementById('spinBtn').disabled = true;

    const duration = (parseFloat(document.getElementById('spinDuration').value) || 5) * 1000;
    const fullTurns = Math.floor(secureRandom() * 6) + 8;
    const margin = winnerSlice.arc * 0.15;
    const offsetInSlice = margin + secureRandom() * Math.max(0.0001, winnerSlice.arc - margin * 2);

    const TWO_PI = 2 * Math.PI;
    const targetB = (winnerSlice.start + offsetInSlice) % TWO_PI;
    const targetA = ((targetB - Math.PI / 2) % TWO_PI + TWO_PI) % TWO_PI;
    const finalMod = (TWO_PI - targetA) % TWO_PI;
    const totalRotation = fullTurns * TWO_PI + finalMod;

    const startAngle = ((spinAngle % TWO_PI) + TWO_PI) % TWO_PI;
    let start = null;

    function animate(ts) {
        if (!start) start = ts;
        let progress = (ts - start) / duration;
        if (progress > 1) progress = 1;
        const easeOut = 1 - Math.pow(1 - progress, 4);
        spinAngle = startAngle + easeOut * totalRotation;
        drawWheel();

        const arcApprox = TWO_PI / entries.length;
        const tickIndex = Math.floor((spinAngle % TWO_PI) / Math.max(arcApprox, 0.01));
        if (tickIndex !== lastTickIndex) { playTickSound(); lastTickIndex = tickIndex; }

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            document.getElementById('spinBtn').disabled = false;
            glowSliceIndex = winnerSliceIndex;
            drawWheel();
            onWinnerLanded(winner, winnersRemaining);
        }
    }
    requestAnimationFrame(animate);
}

function onWinnerLanded(winner, winnersRemaining) {
    pendingWinners.push(winner);
    state.stats.spins++;
    saveStats();
    addHistory(`Spinner Winner: ${winner.label}`);
    playFanfareSound();
    speakWinner(winner.label);
    triggerConfetti();

    const removeWinner = document.getElementById('removeWinnerToggle').checked;
    const allowDuplicates = document.getElementById('allowDuplicateToggle').checked;
    if (removeWinner && !allowDuplicates) {
        updateEntry(winner.id, { enabled: false });
        renderEntryList();
    }

    const remaining = winnersRemaining - 1;
    if (remaining > 0 && getActiveEntries().length > 0) {
        setTimeout(() => spinOnce(remaining), 900);
    } else {
        finishSpinSequence();
    }
}

function finishSpinSequence() {
    if (!pendingWinners.length) return;
    const first = pendingWinners[0];
    document.getElementById('modalWinnerName').textContent = first.label;
    document.getElementById('lastWinnerDisplay').textContent = `Last winner · ${first.label}`;
    const extra = document.getElementById('modalWinnerExtra');
    extra.innerHTML = pendingWinners.length > 1
        ? pendingWinners.slice(1).map(w => `<span class="winner-chip">${escapeAttr(w.label)}</span>`).join('')
        : '';
    document.getElementById('modalRemoveBtn').style.display = document.getElementById('removeWinnerToggle').checked ? 'none' : 'inline-flex';
    document.getElementById('winnerModal').classList.add('active');
}

function spinAgainFromModal() {
    closeWinnerModal();
    startSpinSequence();
}

function removeWinnerFromModal() {
    const last = pendingWinners[pendingWinners.length - 1];
    if (last) {
        updateEntry(last.id, { enabled: false });
        renderEntryList();
        showToast(`${last.label} removed from the wheel`);
    }
    closeWinnerModal();
}

function closeWinnerModal() {
    document.getElementById('winnerModal').classList.remove('active');
    glowSliceIndex = -1;
    drawWheel();
}

// --- QUICK SPIN ---
function quickSpin() {
    const raw = document.getElementById('quickSpinInput').value;
    const list = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (list.length < 2) return showToast('Add at least 2 options to spin.');
    const idx = Math.floor(secureRandom() * list.length);
    const winner = list[idx];
    document.getElementById('quickSpinResult').textContent = winner;
    playFanfareSound();
    triggerConfetti();
    addHistory(`Quick Spin Winner: ${winner}`);
    state.stats.spins++;
    saveStats();
}

function saveCurrentWheel() {
    if (getActiveEntries().length < 2) return showToast('Add at least 2 options first');
    saveWheelEntries();
    const note = document.getElementById('savedWheelNote');
    if (note) note.textContent = `Saved locally · ${wheelEntries.length} options`;
    showToast('Wheel saved successfully');
}

function shareCurrentWheel() {
    const entries = getActiveEntries();
    if (entries.length < 2) return showToast('Add at least 2 options first');
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify(entries.map(e => ({ label: e.label, color: e.color, weight: e.weight }))))));
    const link = `${location.origin}${location.pathname}?wheel=${payload}`;
    if (navigator.clipboard) navigator.clipboard.writeText(link);
    showToast('Share link copied');
}

function togglePresentationMode() {
    document.body.classList.toggle('presentation-mode');
    if (document.body.classList.contains('presentation-mode')) {
        switchTab('spinner');
        document.querySelector('.subtab-btn[data-subtab="subtab-wheelstudio"]')?.click();
        if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
    }
}

function generateAiWheel() {
    const prompt = (document.getElementById('aiPrompt')?.value || '').toLowerCase();
    const sets = prompt.includes('food') || prompt.includes('cambodian') ? ['Amok', 'Bai Sach Chrouk', 'Kuy Teav', 'Lok Lak', 'Nom Banh Chok'] : prompt.includes('study') ? ['Math', 'Reading', 'Practice quiz', 'Review notes', 'Group study'] : ['Presentation', 'Quiz', 'Group discussion', 'Reading', 'Game', 'Coding'];
    document.getElementById('aiResult').innerHTML = `<span class="feature-icon">✺</span><div><strong>${sets.join(' · ')}</strong><p class="text-muted">Generated locally as a private demo. <button class="btn btn-sm btn-secondary" onclick="useAiWheel()">Use in wheel</button></p></div>`;
    window.generatedAiWheel = sets;
}

function useAiWheel() {
    if (!window.generatedAiWheel) return;
    wheelEntries = window.generatedAiWheel.map((label, i) => makeEntry(label, i));
    saveWheelEntries();
    renderEntryList();
    switchTab('spinner');
    document.querySelector('.subtab-btn[data-subtab="subtab-wheelstudio"]')?.click();
}

// --- TEAM GENERATOR ---
function generateTeams() {
    const raw = document.getElementById('teamMembersInput').value;
    const members = raw.split('\n').map(m => m.trim()).filter(m => m.length > 0).sort(() => Math.random() - 0.5);
    const mode = document.getElementById('teamGenMode').value;
    const val = parseInt(document.getElementById('teamGenVal').value) || 2;
    const output = document.getElementById('teamsOutputGrid');

    output.innerHTML = '';
    if (members.length === 0) return;

    let numTeams = mode === 'numTeams' ? val : Math.ceil(members.length / val);
    const teams = Array.from({ length: numTeams }, () => []);

    members.forEach((m, i) => teams[i % numTeams].push(m));

    teams.forEach((team, idx) => {
        const box = document.createElement('div');
        box.className = 'card glass';
        box.innerHTML = `<h4 style="color:var(--accent-color);margin-bottom:0.75rem;">Team ${String.fromCharCode(65 + idx)}</h4><ul style="list-style:none;">${team.map(item => `<li style="padding:0.25rem 0;">👤 ${item}</li>`).join('')}</ul>`;
        output.appendChild(box);
    });

    state.stats.teams++;
    saveStats();
    addHistory(`Generated ${numTeams} Teams`);
}

function assignTasks() {
    const rawMembers = document.getElementById('teamMembersInput').value.split('\n').map(m => m.trim()).filter(m => m.length > 0);
    const tasks = document.getElementById('taskListInput').value.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const out = document.getElementById('taskOutput');

    if (rawMembers.length === 0 || tasks.length === 0) return;
    out.innerHTML = '';

    // Shuffle once, then distribute evenly so work does not repeat too early.
    const shuffledTasks = [...tasks].sort(() => Math.random() - 0.5);

    rawMembers.forEach((m, index) => {
        const assignedTask = shuffledTasks[index % shuffledTasks.length];
        const row = document.createElement('div');
        row.className = 'text-sm mt-1';
        row.innerHTML = `<strong>${m}</strong> → <span class="text-muted">${assignedTask}</span>`;
        out.appendChild(row);
    });
}

// --- RANDOM TOOLS ---
function flipCoin() {
    const coin = document.getElementById('coinElem');
    const isHeads = Math.random() > 0.5;
    coin.style.transform = `rotateY(${isHeads ? 0 : 180}deg)`;
    addHistory(`Coin Flip: ${isHeads ? 'HEADS' : 'TAILS'}`);
    state.stats.randoms++;
    saveStats();
}

function rollDice() {
    const max = parseInt(document.getElementById('diceType').value);
    const val = Math.floor(Math.random() * max) + 1;
    document.getElementById('diceDisplay').textContent = val;
    addHistory(`Dice Roll (D${max}): ${val}`);
    state.stats.randoms++;
    saveStats();
}

function pickRandomChoice() {
    const list = document.getElementById('choiceListInput').value.split(',').map(c => c.trim()).filter(c => c.length > 0);
    if (list.length === 0) return;
    const picked = list[Math.floor(Math.random() * list.length)];
    document.getElementById('choiceOutput').textContent = picked;
    addHistory(`Choice Picked: ${picked}`);
    state.stats.randoms++;
    saveStats();
}

function generateRandomNumber() {
    const min = parseInt(document.getElementById('numMin').value) || 0;
    const max = parseInt(document.getElementById('numMax').value) || 100;
    const val = Math.floor(Math.random() * (max - min + 1)) + min;
    document.getElementById('numberOutput').textContent = val;
    addHistory(`Random Number (${min}-${max}): ${val}`);
    state.stats.randoms++;
    saveStats();
}

// --- TIMERS & STOPWATCH ---
let timerInt = null, timerSecs = 0;
function toggleTimer() {
    if (timerInt) {
        clearInterval(timerInt);
        timerInt = null;
        document.getElementById('timerStartBtn').textContent = "Start";
    } else {
        if (timerSecs === 0) {
            const h = parseInt(document.getElementById('timerHrs').value) || 0;
            const m = parseInt(document.getElementById('timerMins').value) || 0;
            const s = parseInt(document.getElementById('timerSecs').value) || 0;
            timerSecs = h * 3600 + m * 60 + s;
        }
        if (timerSecs <= 0) return;
        document.getElementById('timerStartBtn').textContent = "Pause";
        timerInt = setInterval(() => {
            timerSecs--;
            renderTimerDisplay();
            if (timerSecs <= 0) {
                clearInterval(timerInt);
                timerInt = null;
                alert("⏰ Time's Up!");
                addHistory("Timer Finished");
            }
        }, 1000);
    }
}

function setTimerPreset(mins) {
    document.getElementById('timerMins').value = mins;
    document.getElementById('timerSecs').value = 0;
    timerSecs = mins * 60;
    renderTimerDisplay();
}

function renderTimerDisplay() {
    const h = String(Math.floor(timerSecs / 3600)).padStart(2, '0');
    const m = String(Math.floor((timerSecs % 3600) / 60)).padStart(2, '0');
    const s = String(timerSecs % 60).padStart(2, '0');
    document.getElementById('timerDisplay').textContent = `${h}:${m}:${s}`;
}

function resetTimer() {
    if (timerInt) clearInterval(timerInt);
    timerInt = null;
    timerSecs = 0;
    document.getElementById('timerStartBtn').textContent = "Start";
    renderTimerDisplay();
}

let swInt = null, swElapsed = 0;
function toggleStopwatch() {
    if (swInt) {
        clearInterval(swInt);
        swInt = null;
        document.getElementById('swStartBtn').textContent = "Start";
    } else {
        const start = Date.now() - swElapsed;
        document.getElementById('swStartBtn').textContent = "Pause";
        swInt = setInterval(() => {
            swElapsed = Date.now() - start;
            const ms = String(Math.floor((swElapsed % 1000) / 10)).padStart(2, '0');
            const s = String(Math.floor((swElapsed / 1000) % 60)).padStart(2, '0');
            const m = String(Math.floor(swElapsed / 60000)).padStart(2, '0');
            document.getElementById('swDisplay').textContent = `${m}:${s}.${ms}`;
        }, 10);
    }
}

function lapStopwatch() {
    if (!swInt) return;
    const item = document.createElement('div');
    item.className = 'text-sm mt-1';
    item.textContent = `Lap: ${document.getElementById('swDisplay').textContent}`;
    document.getElementById('lapList').prepend(item);
}

function resetStopwatch() {
    if (swInt) clearInterval(swInt);
    swInt = null;
    swElapsed = 0;
    document.getElementById('swDisplay').textContent = "00:00:00.00";
    document.getElementById('swStartBtn').textContent = "Start";
    document.getElementById('lapList').innerHTML = '';
}

let pomoInt = null, pomoTime = 1500, pomoSessions = 0;
function togglePomo() {
    if (pomoInt) {
        clearInterval(pomoInt);
        pomoInt = null;
        document.getElementById('pomoStartBtn').textContent = "Start";
    } else {
        document.getElementById('pomoStartBtn').textContent = "Pause";
        pomoInt = setInterval(() => {
            pomoTime--;
            const m = String(Math.floor(pomoTime / 60)).padStart(2, '0');
            const s = String(pomoTime % 60).padStart(2, '0');
            document.getElementById('pomoDisplay').textContent = `${m}:${s}`;

            if (pomoTime <= 0) {
                clearInterval(pomoInt);
                pomoInt = null;
                pomoSessions++;
                state.stats.focusMinutes += 25;
                saveStats();
                document.getElementById('pomoSessionCount').textContent = pomoSessions;
                alert("Pomodoro Complete!");
            }
        }, 1000);
    }
}

function skipPomo() { resetPomo(); }
function resetPomo() {
    if (pomoInt) clearInterval(pomoInt);
    pomoInt = null;
    pomoTime = 1500;
    document.getElementById('pomoDisplay').textContent = "25:00";
    document.getElementById('pomoStartBtn').textContent = "Start";
}

// --- WORLD CLOCK ---
const cities = [
    { name: "Phnom Penh", tz: "Asia/Phnom_Penh" },
    { name: "London", tz: "Europe/London" },
    { name: "New York", tz: "America/New_York" },
    { name: "Tokyo", tz: "Asia/Tokyo" }
];

function initWorldClock() {
    const grid = document.getElementById('worldClockGrid');
    grid.innerHTML = '';
    cities.forEach(c => {
        const card = document.createElement('div');
        card.className = 'card glass text-center';
        const now = new Date();
        const t = now.toLocaleTimeString('en-US', { timeZone: c.tz });
        card.innerHTML = `<h4>${c.name}</h4><div class="stat-value mt-1">${t}</div>`;
        grid.appendChild(card);
    });
}

// --- ALARMS ---
function initAlarms() { renderAlarms(); }
function addAlarm() {
    const time = document.getElementById('alarmTimeInput').value;
    const label = document.getElementById('alarmLabelInput').value || "Alarm";
    if (!time) return;
    state.alarms.push({ time, label, active: true });
    localStorage.setItem('ts_alarms', JSON.stringify(state.alarms));
    renderAlarms();
}

function renderAlarms() {
    const list = document.getElementById('alarmList');
    list.innerHTML = '';
    state.alarms.forEach((a, i) => {
        const item = document.createElement('div');
        item.className = 'flex-between mt-1 glass card';
        item.innerHTML = `<span><strong>${a.time}</strong> - ${a.label}</span><button class="btn btn-sm btn-danger" onclick="deleteAlarm(${i})">Remove</button>`;
        list.appendChild(item);
    });
}

function deleteAlarm(i) {
    state.alarms.splice(i, 1);
    localStorage.setItem('ts_alarms', JSON.stringify(state.alarms));
    renderAlarms();
}

// --- HISTORY & STATS ---
function addHistory(text) {
    state.history.unshift({ text, date: new Date().toLocaleTimeString() });
    if (state.history.length > 20) state.history.pop();
    localStorage.setItem('ts_history', JSON.stringify(state.history));
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('historyListContainer');
    list.innerHTML = '';
    state.history.forEach(h => {
        const item = document.createElement('div');
        item.className = 'flex-between mt-1 glass card';
        item.innerHTML = `<span>${h.text}</span><small class="text-muted">${h.date}</small>`;
        list.appendChild(item);
    });
}

function clearHistory() {
    state.history = [];
    localStorage.removeItem('ts_history');
    renderHistory();
}

function saveStats() {
    localStorage.setItem('ts_stats', JSON.stringify(state.stats));
    renderStats();
}

function renderStats() {
    document.getElementById('statSpins').textContent = state.stats.spins;
    document.getElementById('statTeams').textContent = state.stats.teams;
    document.getElementById('statFocus').textContent = `${state.stats.focusMinutes}m`;
    document.getElementById('statRandom').textContent = state.stats.randoms;
    const values = { analyticsSpins: state.stats.spins, analyticsTeams: state.stats.teams, analyticsFocus: `${state.stats.focusMinutes}m`, analyticsRandom: state.stats.randoms };
    Object.entries(values).forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.textContent = value; });
    const xp = state.stats.spins + state.stats.teams + state.stats.randoms;
    const level = Math.floor(xp / 10) + 1;
    const levelEl = document.getElementById('achievementLevel');
    if (levelEl) levelEl.textContent = `Level ${level}`;
    const progress = document.getElementById('achievementProgress');
    if (progress) progress.textContent = `${xp % 10} / 10 XP`;
    const bar = document.getElementById('achievementBar');
    if (bar) bar.style.width = `${(xp % 10) * 10}%`;
}

// --- CONFETTI ANIMATION ENGINE ---
function triggerConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    let particles = Array.from({ length: 120 }, () => ({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.8) * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4
    }));

    function render() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.25;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        particles = particles.filter(p => p.y < window.innerHeight);
        if (particles.length > 0) requestAnimationFrame(render);
    }
    render();
}

// --- SETTINGS IMPORT/EXPORT ---
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "timespin_data.json");
    dlAnchor.click();
}

function triggerImport() { document.getElementById('importFileInput').click(); }
function importData(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const imported = JSON.parse(e.target.result);
        Object.assign(state, imported);
        location.reload();
    };
    reader.readAsText(event.target.files[0]);
}

function confirmResetAll() {
    if (confirm("Reset all settings and data?")) {
        localStorage.clear();
        location.reload();
    }
}


//


/* --- TIME SPIN GAME ENGINE --- */

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.ttt-cell')) initTTT();
    if (document.getElementById('memoryGrid')) initMemoryGame();
    if (typeof resetHigherLower === 'function') resetHigherLower();
});

// --- 1. TIC TAC TOE ---
let tttBoard = ['', '', '', '', '', '', '', '', ''];
let tttActive = true;

function initTTT() {
    document.querySelectorAll('.ttt-cell').forEach(cell => {
        cell.addEventListener('click', () => handleTTTClick(parseInt(cell.dataset.index)));
    });
}

function handleTTTClick(idx) {
    if (tttBoard[idx] !== '' || !tttActive) return;
    
    makeTTTMove(idx, 'X');
    if (checkTTTWinner('X')) {
        document.getElementById('tttStatus').textContent = '🎉 You won!';
        tttActive = false;
        playFanfareSound();
        addHistory('Tic-Tac-Toe: Won vs AI');
        return;
    }

    if (!tttBoard.includes('')) {
        document.getElementById('tttStatus').textContent = "🤝 It's a draw!";
        tttActive = false;
        return;
    }

    // AI Move
    tttActive = false;
    document.getElementById('tttStatus').textContent = 'AI is thinking...';
    setTimeout(() => {
        let emptyIndices = tttBoard.map((val, index) => val === '' ? index : null).filter(val => val !== null);
        let aiChoice = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        makeTTTMove(aiChoice, 'O');

        if (checkTTTWinner('O')) {
            document.getElementById('tttStatus').textContent = '🤖 AI won!';
            addHistory('Tic-Tac-Toe: Lost vs AI');
        } else if (!tttBoard.includes('')) {
            document.getElementById('tttStatus').textContent = "🤝 It's a draw!";
        } else {
            document.getElementById('tttStatus').textContent = 'Your turn! (Player: X)';
            tttActive = true;
        }
    }, 400);
}

function makeTTTMove(idx, symbol) {
    tttBoard[idx] = symbol;
    const cell = document.querySelector(`.ttt-cell[data-index="${idx}"]`);
    cell.textContent = symbol;
    cell.style.color = symbol === 'X' ? 'var(--accent-color)' : '#ef4444';
    playTickSound();
}

function checkTTTWinner(sym) {
    const wins = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];
    return wins.some(w => w.every(i => tttBoard[i] === sym));
}

function resetTTT() {
    tttBoard = ['', '', '', '', '', '', '', '', ''];
    tttActive = true;
    document.getElementById('tttStatus').textContent = 'Your turn! (Player: X)';
    document.querySelectorAll('.ttt-cell').forEach(cell => cell.textContent = '');
}

// --- 2. MEMORY MATCH ---
const memEmojis = ['🚀', '⚡', '💎', '🔥', '🎨', '🍕'];
let memCards = [], flippedCards = [], memMoves = 0, memMatches = 0;

function initMemoryGame() {
    const grid = document.getElementById('memoryGrid');
    grid.innerHTML = '';
    memCards = [...memEmojis, ...memEmojis].sort(() => Math.random() - 0.5);
    flippedCards = [];
    memMoves = 0;
    memMatches = 0;
    
    document.getElementById('memMoves').textContent = '0';
    document.getElementById('memMatches').textContent = '0';

    memCards.forEach((emoji, idx) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.index = idx;
        card.onclick = () => handleMemoryClick(card, emoji);
        grid.appendChild(card);
    });
}

function handleMemoryClick(card, emoji) {
    if (flippedCards.length >= 2 || card.classList.contains('flipped') || card.classList.contains('matched')) return;

    card.classList.add('flipped');
    card.textContent = emoji;
    flippedCards.push({ card, emoji });
    playTickSound();

    if (flippedCards.length === 2) {
        memMoves++;
        document.getElementById('memMoves').textContent = memMoves;

        if (flippedCards[0].emoji === flippedCards[1].emoji) {
            flippedCards.forEach(c => c.card.classList.add('matched'));
            flippedCards = [];
            memMatches++;
            document.getElementById('memMatches').textContent = memMatches;

            if (memMatches === memEmojis.length) {
                playFanfareSound();
                triggerConfetti();
                addHistory(`Memory Match completed in ${memMoves} moves`);
            }
        } else {
            setTimeout(() => {
                flippedCards.forEach(c => {
                    c.card.classList.remove('flipped');
                    c.card.textContent = '';
                });
                flippedCards = [];
            }, 800);
        }
    }
}








/* --- TIME SPIN ARCADE GAME LOGIC --- */

// --- 1. SPEED TYPER ---
const wordBank = ["spin", "clock", "timer", "focus", "wheel", "quick", "speed", "random", "winner", "action", "time", "smart", "system", "design"];
let typerWord = "", typerScore = 0, typerTime = 15, typerInterval = null;

function startSpeedTyper() {
    typerScore = 0;
    typerTime = 15;
    document.getElementById('typerScore').textContent = '0';
    document.getElementById('typerTime').textContent = '15';
    document.getElementById('typerStartBtn').disabled = true;
    
    const input = document.getElementById('typerInput');
    input.disabled = false;
    input.value = '';
    input.focus();
    
    nextTyperWord();

    input.oninput = () => {
        if (input.value.trim().toLowerCase() === typerWord) {
            typerScore++;
            document.getElementById('typerScore').textContent = typerScore;
            input.value = '';
            playTickSound();
            nextTyperWord();
        }
    };

    typerInterval = setInterval(() => {
        typerTime--;
        document.getElementById('typerTime').textContent = typerTime;
        if (typerTime <= 0) {
            clearInterval(typerInterval);
            input.disabled = true;
            document.getElementById('typerStartBtn').disabled = false;
            document.getElementById('typerWord').textContent = "Game Over!";
            playFanfareSound();
            addHistory(`Speed Typer score: ${typerScore} words`);
        }
    }, 1000);
}

function nextTyperWord() {
    typerWord = wordBank[Math.floor(Math.random() * wordBank.length)];
    document.getElementById('typerWord').textContent = typerWord;
}

// --- 2. REACTION TESTER ---
let reactionState = "idle", reactionTimeout = null, reactionStartTime = 0;

function handleReactionClick() {
    const box = document.getElementById('reactionBox');
    
    if (reactionState === "idle") {
        reactionState = "waiting";
        box.textContent = "Wait for GREEN...";
        box.className = "reaction-box waiting my-2";
        
        const delay = Math.random() * 3000 + 2000;
        reactionTimeout = setTimeout(() => {
            reactionState = "ready";
            box.textContent = "CLICK NOW!";
            box.className = "reaction-box ready my-2";
            reactionStartTime = Date.now();
        }, delay);
    } else if (reactionState === "waiting") {
        clearTimeout(reactionTimeout);
        reactionState = "idle";
        box.textContent = "Too early! Click to try again.";
        box.className = "reaction-box my-2";
    } else if (reactionState === "ready") {
        const ms = Date.now() - reactionStartTime;
        reactionState = "idle";
        box.textContent = `${ms} ms! Click to try again.`;
        box.className = "reaction-box my-2";
        document.getElementById('reactionResult').textContent = `Best Time: ${ms} ms`;
        playFanfareSound();
        addHistory(`Reaction time: ${ms}ms`);
    }
}

// --- 3. AIM TRAINER ---
let aimScore = 0, aimTime = 15, aimInterval = null;

function startAimTrainer() {
    aimScore = 0;
    aimTime = 15;
    document.getElementById('aimScore').textContent = '0';
    document.getElementById('aimTime').textContent = '15';
    document.getElementById('aimStartBtn').disabled = true;
    
    moveAimTarget();

    aimInterval = setInterval(() => {
        aimTime--;
        document.getElementById('aimTime').textContent = aimTime;
        if (aimTime <= 0) {
            clearInterval(aimInterval);
            document.getElementById('aimTarget').style.display = 'none';
            document.getElementById('aimStartBtn').disabled = false;
            playFanfareSound();
            addHistory(`Aim Trainer score: ${aimScore} targets`);
        }
    }, 1000);
}

function hitAimTarget() {
    aimScore++;
    document.getElementById('aimScore').textContent = aimScore;
    playTickSound();
    moveAimTarget();
}

function moveAimTarget() {
    const area = document.getElementById('aimArea');
    const target = document.getElementById('aimTarget');
    const maxX = area.clientWidth - 50;
    const maxY = area.clientHeight - 50;
    
    target.style.left = `${Math.floor(Math.random() * maxX)}px`;
    target.style.top = `${Math.floor(Math.random() * maxY)}px`;
    target.style.display = 'block';
}

// --- 4. MEMORY LIGHTS (SIMON) ---
let simonSeq = [], simonStep = 0, simonCanInput = false;

function startSimon() {
    simonSeq = [];
    nextSimonLevel();
}

function nextSimonLevel() {
    simonStep = 0;
    simonCanInput = false;
    simonSeq.push(Math.floor(Math.random() * 4));
    document.getElementById('simonStatus').textContent = `Level: ${simonSeq.length}`;
    
    let i = 0;
    const interval = setInterval(() => {
        flashSimonBtn(simonSeq[i]);
        i++;
        if (i >= simonSeq.length) {
            clearInterval(interval);
            simonCanInput = true;
        }
    }, 600);
}

function flashSimonBtn(id) {
    const btn = document.getElementById(`simon-${id}`);
    btn.classList.add('active');
    playTickSound();
    setTimeout(() => btn.classList.remove('active'), 300);
}

function handleSimonClick(id) {
    if (!simonCanInput) return;
    flashSimonBtn(id);

    if (id === simonSeq[simonStep]) {
        simonStep++;
        if (simonStep >= simonSeq.length) {
            simonCanInput = false;
            setTimeout(nextSimonLevel, 800);
        }
    } else {
        document.getElementById('simonStatus').textContent = "Game Over! Press Start";
        simonCanInput = false;
        playFanfareSound();
        addHistory(`Memory Lights level: ${simonSeq.length - 1}`);
    }
}

// --- 5. MOLE SMASHER ---
let moleScore = 0, moleTime = 15, moleInterval = null, molePopTimeout = null, activeMoleIndex = -1;

function startMoleGame() {
    moleScore = 0;
    moleTime = 15;
    document.getElementById('moleScore').textContent = '0';
    document.getElementById('moleTime').textContent = '15';
    document.getElementById('moleStartBtn').disabled = true;

    popRandomMole();

    moleInterval = setInterval(() => {
        moleTime--;
        document.getElementById('moleTime').textContent = moleTime;
        if (moleTime <= 0) {
            clearInterval(moleInterval);
            clearTimeout(molePopTimeout);
            clearMoles();
            document.getElementById('moleStartBtn').disabled = false;
            playFanfareSound();
            addHistory(`Mole Smasher score: ${moleScore}`);
        }
    }, 1000);
}

function popRandomMole() {
    clearMoles();
    activeMoleIndex = Math.floor(Math.random() * 6);
    const holes = document.querySelectorAll('.mole-hole');
    holes[activeMoleIndex].classList.add('active');

    molePopTimeout = setTimeout(popRandomMole, Math.random() * 400 + 600);
}

function clearMoles() {
    document.querySelectorAll('.mole-hole').forEach(h => h.classList.remove('active'));
}

function smackMole(idx) {
    if (idx === activeMoleIndex) {
        moleScore++;
        document.getElementById('moleScore').textContent = moleScore;
        playTickSound();
        clearMoles();
        activeMoleIndex = -1;
    }
}




const hamburgerBtn = document.getElementById('hamburgerBtn');
const navMenu = document.getElementById('navMenu');

hamburgerBtn.addEventListener('click', () => {
    hamburgerBtn.classList.toggle('open');
    navMenu.classList.toggle('open');
});

// Close menu when a link is tapped
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburgerBtn.classList.remove('open');
        navMenu.classList.remove('open');
    });
});
