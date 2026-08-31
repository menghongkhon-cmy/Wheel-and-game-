/* ============================================================
   TIME SPINNER — standalone engine
   Shares localStorage keys with the main TIME SPIN app
   (ts_theme, ts_lang) so preferences stay in sync across pages.
   ============================================================ */

const TS_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899'];

const tsState = {
    theme: localStorage.getItem('ts_theme') || 'dark',
    lang: localStorage.getItem('ts_lang') || 'en',
    muted: localStorage.getItem('ts_timespinner_muted') === 'true',
    slots: [],       // [{label, minutes}]
    spinAngle: 0,
    isSpinning: false,
    glowIndex: -1,
    lastTick: -1,
    lastResult: null,
    recent: JSON.parse(localStorage.getItem('ts_timespinner_recent') || '[]')
};

/* ---------------- i18n ---------------- */
const TS_I18N = {
    en: {
        bc_current: "Time Spinner",
        h1: "Time Spinner — Random Time Generator",
        subtitle: "Pick a start time, end time, and interval, then spin the wheel for a fair, random time.",
        ready: "Ready to spin",
        spin_btn: "SPIN 🎯",
        sound: "Sound",
        reset_btn: "Reset",
        copy_btn: "Copy result",
        share_btn: "Share result",
        recent_label: "Recent results",
        settings_title: "Time range",
        start_time: "Start time",
        end_time: "End time",
        interval: "Interval",
        generate_btn: "Generate time slots",
        no_slots: "No time slots yet — generate to see them here.",
        congrats: "🎉 TIME SELECTED! 🎉",
        was_selected: "has been randomly selected!",
        spin_again: "Spin Again",
        close: "Close",
        what_is_title: "What is a Time Spinner?",
        what_is_body: "A Time Spinner is a random time generator that turns a range of clock times into a spinning wheel. Instead of manually picking a slot, you set a start time, an end time, and an interval — the tool builds every time in between and randomly lands on one, the same way a name wheel picks a random winner from a list.",
        how_to_title: "How to use the Time Spinner",
        how_to_steps: ["Select a start time.", "Select an end time.", "Choose an interval (5, 10, 15, 30 minutes, or 1 hour).", "Click \"Generate time slots\".", "Press \"Spin\" and watch the wheel.", "Get your random time — copy or share it instantly."],
        uses_title: "Common uses",
        uses_list: ["🎤 Student presentations", "🏫 Classroom activities", "🗓️ Meeting scheduling", "📚 Study sessions", "☕ Break times", "🎮 Games", "🎉 Events"],
        faq_title: "Frequently asked questions",
        related_title: "Related tools",
        slot_count: (n) => `${n} time slot${n === 1 ? '' : 's'} generated`,
        toast_need_range: "Please set a start time before the end time.",
        toast_generated: (n) => `Generated ${n} time slots`,
        toast_add_slots: "Generate at least 2 time slots first.",
        toast_copied: "Result copied to clipboard",
        toast_share_fail: "Could not share — copied instead",
        countdown_prefix: "Next occurrence in",
        result_label: (t) => `Last result · ${t}`
    },
    km: {
        bc_current: "កង់ចាប់ម៉ោង",
        h1: "កង់ចាប់ម៉ោង — ឧបករណ៍បង្កើតម៉ោងចៃដន្យ",
        subtitle: "កំណត់ម៉ោងចាប់ផ្ដើម ម៉ោងបញ្ចប់ និងចន្លោះពេល រួចបង្វិលកង់ដើម្បីទទួលបានម៉ោងចៃដន្យដោយយុត្តិធម៌។",
        ready: "ត្រៀមខ្លួនដើម្បីបង្វិល",
        spin_btn: "បង្វិល 🎯",
        sound: "សំឡេង",
        reset_btn: "កំណត់ឡើងវិញ",
        copy_btn: "ចម្លងលទ្ធផល",
        share_btn: "ចែករំលែកលទ្ធផល",
        recent_label: "លទ្ធផលថ្មីៗ",
        settings_title: "ចន្លោះពេលវេលា",
        start_time: "ម៉ោងចាប់ផ្ដើម",
        end_time: "ម៉ោងបញ្ចប់",
        interval: "ចន្លោះពេល",
        generate_btn: "បង្កើតបញ្ជីម៉ោង",
        no_slots: "មិនទាន់មានបញ្ជីម៉ោងទេ — ចុចបង្កើតដើម្បីមើល។",
        congrats: "🎉 ម៉ោងត្រូវបានជ្រើសរើស! 🎉",
        was_selected: "ត្រូវបានជ្រើសរើសដោយចៃដន្យ!",
        spin_again: "បង្វិលម្ដងទៀត",
        close: "បិទ",
        what_is_title: "តើកង់ចាប់ម៉ោងជាអ្វី?",
        what_is_body: "កង់ចាប់ម៉ោង គឺជាឧបករណ៍បង្កើតម៉ោងចៃដន្យដែលបំប្លែងចន្លោះម៉ោងឲ្យទៅជាកង់បង្វិល។ អ្នកគ្រាន់តែកំណត់ម៉ោងចាប់ផ្ដើម ម៉ោងបញ្ចប់ និងចន្លោះពេល ឧបករណ៍នេះនឹងបង្កើតរាល់ម៉ោងទាំងអស់ ហើយជ្រើសរើសមួយដោយចៃដន្យ។",
        how_to_title: "របៀបប្រើកង់ចាប់ម៉ោង",
        how_to_steps: ["ជ្រើសរើសម៉ោងចាប់ផ្ដើម។", "ជ្រើសរើសម៉ោងបញ្ចប់។", "ជ្រើសរើសចន្លោះពេល (៥, ១០, ១៥, ៣០ នាទី ឬ ១ ម៉ោង)។", "ចុច \"បង្កើតបញ្ជីម៉ោង\"។", "ចុច \"បង្វិល\" ហើយមើលកង់។", "ទទួលបានម៉ោងចៃដន្យ — ចម្លង ឬចែករំលែកភ្លាមៗ។"],
        uses_title: "ការប្រើប្រាស់ទូទៅ",
        uses_list: ["🎤 បទបង្ហាញសិស្ស", "🏫 សកម្មភាពក្នុងថ្នាក់", "🗓️ កំណត់ពេលប្រជុំ", "📚 ពេលវេលារៀន", "☕ ពេលសម្រាក", "🎮 ល្បែងកម្សាន្ត", "🎉 ព្រឹត្តិការណ៍"],
        faq_title: "សំណួរដែលសួរញឹកញាប់",
        related_title: "ឧបករណ៍ពាក់ព័ន្ធ",
        slot_count: (n) => `បង្កើតបានចំនួន ${n} ម៉ោង`,
        toast_need_range: "សូមកំណត់ម៉ោងចាប់ផ្ដើមឲ្យតិចជាងម៉ោងបញ្ចប់។",
        toast_generated: (n) => `បានបង្កើតម៉ោងចំនួន ${n}`,
        toast_add_slots: "សូមបង្កើតម៉ោងយ៉ាងតិច ២ ជាមុនសិន។",
        toast_copied: "បានចម្លងលទ្ធផលទៅក្ដារតម្បៀតខ្ទាស់",
        toast_share_fail: "មិនអាចចែករំលែកបានទេ — បានចម្លងជំនួសវិញ",
        countdown_prefix: "ដល់ម៉ោងនោះក្នុងរយៈពេល",
        result_label: (t) => `លទ្ធផលចុងក្រោយ · ${t}`
    }
};

function t(key) { return TS_I18N[tsState.lang][key]; }

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const val = t(el.dataset.i18n);
        if (typeof val === 'string') el.textContent = val;
    });
    const stepsList = document.querySelector('[data-i18n-list="how_to_steps"]');
    if (stepsList) stepsList.innerHTML = t('how_to_steps').map(s => `<li>${s}</li>`).join('');
    const usesList = document.querySelector('[data-i18n-list="uses_list"]');
    if (usesList) usesList.innerHTML = t('uses_list').map(s => `<div class="ts-use-chip">${s}</div>`).join('');
    renderSlotPreview();
    renderRecent();
}

/* ---------------- Theme / language toggles ---------------- */
function tsInitThemeAndLang() {
    document.documentElement.setAttribute('data-theme', tsState.theme);
    document.getElementById('themeToggle').textContent = tsState.theme === 'dark' ? '🌙' : '☀️';
    document.getElementById('langToggle').textContent = tsState.lang === 'en' ? '🇰🇭 ខ្មែរ' : '🇬🇧 EN';
    document.getElementById('themeToggle').addEventListener('click', () => {
        tsState.theme = tsState.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('ts_theme', tsState.theme);
        document.documentElement.setAttribute('data-theme', tsState.theme);
        document.getElementById('themeToggle').textContent = tsState.theme === 'dark' ? '🌙' : '☀️';
    });
    document.getElementById('langToggle').addEventListener('click', () => {
        tsState.lang = tsState.lang === 'en' ? 'km' : 'en';
        localStorage.setItem('ts_lang', tsState.lang);
        document.getElementById('langToggle').textContent = tsState.lang === 'en' ? '🇰🇭 ខ្មែរ' : '🇬🇧 EN';
        applyTranslations();
    });
}

/* ---------------- Toast ---------------- */
function tsToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3200);
}

/* ---------------- Random ---------------- */
function tsSecureRandom() {
    if (window.crypto && crypto.getRandomValues) {
        const buf = new Uint32Array(1);
        crypto.getRandomValues(buf);
        return buf[0] / 4294967296;
    }
    return Math.random();
}

/* ---------------- Sound ---------------- */
let tsAudioCtx = null;
function tsPlayTick() {
    if (tsState.muted) return;
    if (!tsAudioCtx) tsAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = tsAudioCtx.createOscillator();
    const gain = tsAudioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, tsAudioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, tsAudioCtx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.15, tsAudioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, tsAudioCtx.currentTime + 0.04);
    osc.connect(gain); gain.connect(tsAudioCtx.destination);
    osc.start(); osc.stop(tsAudioCtx.currentTime + 0.04);
}
function tsPlayFanfare() {
    if (tsState.muted) return;
    if (!tsAudioCtx) tsAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = tsAudioCtx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = tsAudioCtx.createOscillator();
        const gain = tsAudioCtx.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.2, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.1 + 0.3);
        osc.connect(gain); gain.connect(tsAudioCtx.destination);
        osc.start(now + idx * 0.1); osc.stop(now + idx * 0.1 + 0.3);
    });
}
function tsToggleMute() {
    tsState.muted = !tsState.muted;
    localStorage.setItem('ts_timespinner_muted', tsState.muted);
    document.getElementById('tsMuteBtn').firstChild.textContent = tsState.muted ? '🔇 ' : '🔊 ';
}

/* ---------------- Confetti ---------------- */
function tsConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    let particles = Array.from({ length: 120 }, () => ({
        x: window.innerWidth / 2, y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.8) * 12,
        color: TS_COLORS[Math.floor(Math.random() * TS_COLORS.length)],
        size: Math.random() * 8 + 4
    }));
    function render() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.25; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); });
        particles = particles.filter(p => p.y < window.innerHeight);
        if (particles.length > 0) requestAnimationFrame(render);
    }
    render();
}

/* ---------------- Time slot generation ---------------- */
function tsParseTimeToMinutes(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}
function tsMinutesToLabel(mins) {
    const h24 = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const period = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12; if (h12 === 0) h12 = 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

function generateTimeSlots() {
    const startVal = document.getElementById('tsStart').value;
    const endVal = document.getElementById('tsEnd').value;
    const interval = parseInt(document.getElementById('tsInterval').value, 10);

    if (!startVal || !endVal) { tsToast(t('toast_need_range')); return; }

    const startMins = tsParseTimeToMinutes(startVal);
    const endMins = tsParseTimeToMinutes(endVal);

    if (endMins <= startMins) { tsToast(t('toast_need_range')); return; }

    const slots = [];
    for (let m = startMins; m <= endMins; m += interval) {
        slots.push({ minutes: m, label: tsMinutesToLabel(m) });
    }
    // Guard: cap to a sane number of slices so the wheel stays legible & can't get stuck
    tsState.slots = slots.slice(0, 144);
    tsState.spinAngle = 0;
    tsState.glowIndex = -1;
    renderSlotPreview();
    drawTsWheel();
    tsToast(t('toast_generated')(tsState.slots.length));
}

function renderSlotPreview() {
    const preview = document.getElementById('tsSlotPreview');
    const countLabel = document.getElementById('tsSlotCount');
    if (!preview) return;
    if (!tsState.slots.length) {
        preview.innerHTML = `<span class="ts-slot-empty">${t('no_slots')}</span>`;
        countLabel.textContent = '';
        return;
    }
    preview.innerHTML = tsState.slots.map(s => `<span class="ts-slot-chip">${s.label}</span>`).join('');
    countLabel.textContent = t('slot_count')(tsState.slots.length);
}

/* ---------------- Wheel rendering ---------------- */
function drawTsWheel() {
    const canvas = document.getElementById('tsWheelCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.parentElement.clientWidth || 420;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const radius = center - 10;
    ctx.clearRect(0, 0, size, size);

    const slots = tsState.slots;
    if (!slots.length) return;
    const arc = (2 * Math.PI) / slots.length;

    slots.forEach((slot, i) => {
        const angle = tsState.spinAngle + i * arc;
        ctx.beginPath();
        ctx.fillStyle = TS_COLORS[i % TS_COLORS.length];
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, angle, angle + arc);
        ctx.lineTo(center, center);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (slots.length <= 48) {
            ctx.save();
            ctx.translate(center, center);
            const midAngle = angle + arc / 2;
            ctx.rotate(midAngle);
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${slots.length > 24 ? 10 : 13}px system-ui`;
            let rad = (midAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
            if (rad > Math.PI / 2 && rad < (3 * Math.PI) / 2) {
                ctx.rotate(Math.PI);
                ctx.textAlign = 'left';
                ctx.fillText(slot.label, -radius + 16, 4);
            } else {
                ctx.textAlign = 'right';
                ctx.fillText(slot.label, radius - 16, 4);
            }
            ctx.restore();
        }

        if (tsState.glowIndex === i) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, angle, angle + arc);
            ctx.closePath();
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 18;
            ctx.stroke();
            ctx.restore();
        }
    });

    ctx.beginPath();
    ctx.arc(center, center, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
}

/* ---------------- Spin sequence ---------------- */
function startTsSpin() {
    if (tsState.isSpinning) return;
    if (tsState.slots.length < 2) { tsToast(t('toast_add_slots')); return; }

    const winnerIndex = Math.floor(tsSecureRandom() * tsState.slots.length);
    const winner = tsState.slots[winnerIndex];
    const arc = (2 * Math.PI) / tsState.slots.length;

    tsState.isSpinning = true;
    tsState.lastTick = -1;
    tsState.glowIndex = -1;
    document.getElementById('tsSpinBtn').disabled = true;

    const duration = 5000;
    const fullTurns = Math.floor(tsSecureRandom() * 6) + 8;
    const margin = arc * 0.15;
    const offsetInSlice = margin + tsSecureRandom() * Math.max(0.0001, arc - margin * 2);
    const TWO_PI = 2 * Math.PI;
    const sliceStart = winnerIndex * arc;
    const targetB = (sliceStart + offsetInSlice) % TWO_PI;
    const targetA = ((targetB - Math.PI / 2) % TWO_PI + TWO_PI) % TWO_PI;
    const finalMod = (TWO_PI - targetA) % TWO_PI;
    const totalRotation = fullTurns * TWO_PI + finalMod;
    const startAngle = ((tsState.spinAngle % TWO_PI) + TWO_PI) % TWO_PI;
    let start = null;

    function animate(ts) {
        if (!start) start = ts;
        let progress = (ts - start) / duration;
        if (progress > 1) progress = 1;
        const easeOut = 1 - Math.pow(1 - progress, 4);
        tsState.spinAngle = startAngle + easeOut * totalRotation;
        drawTsWheel();

        const arcApprox = TWO_PI / tsState.slots.length;
        const tickIndex = Math.floor((tsState.spinAngle % TWO_PI) / Math.max(arcApprox, 0.01));
        if (tickIndex !== tsState.lastTick) { tsPlayTick(); tsState.lastTick = tickIndex; }

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            tsState.isSpinning = false;
            document.getElementById('tsSpinBtn').disabled = false;
            tsState.glowIndex = winnerIndex;
            drawTsWheel();
            onTsWinnerLanded(winner);
        }
    }
    requestAnimationFrame(animate);
}

function onTsWinnerLanded(winner) {
    tsState.lastResult = winner;
    document.getElementById('tsResultStrip').textContent = t('result_label')(winner.label);
    document.getElementById('tsModalTime').textContent = winner.label;
    tsPlayFanfare();
    tsConfetti();
    document.getElementById('tsWinnerModal').classList.add('active');
    saveRecentResult(winner.label);
    startCountdownTo(winner.minutes);
}

/* ---------------- Recent results ---------------- */
function saveRecentResult(label) {
    tsState.recent.unshift(label);
    tsState.recent = tsState.recent.slice(0, 8);
    localStorage.setItem('ts_timespinner_recent', JSON.stringify(tsState.recent));
    renderRecent();
}
function renderRecent() {
    const wrap = document.getElementById('tsRecentWrap');
    const list = document.getElementById('tsRecentList');
    if (!wrap || !list) return;
    if (!tsState.recent.length) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';
    list.innerHTML = tsState.recent.map(r => `<span class="ts-recent-chip">${r}</span>`).join('');
}

/* ---------------- Countdown to result time ---------------- */
let tsCountdownInterval = null;
function startCountdownTo(targetMinutes) {
    if (tsCountdownInterval) clearInterval(tsCountdownInterval);
    const el = document.getElementById('tsCountdown');
    function tick() {
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
        let diffMins = targetMinutes - nowMins;
        if (diffMins < 0) diffMins += 24 * 60;
        const totalSecs = Math.max(0, Math.round(diffMins * 60));
        const hh = Math.floor(totalSecs / 3600);
        const mm = Math.floor((totalSecs % 3600) / 60);
        const ss = totalSecs % 60;
        el.innerHTML = `${t('countdown_prefix')} <strong>${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}</strong>`;
    }
    tick();
    tsCountdownInterval = setInterval(tick, 1000);
}

/* ---------------- Reset / copy / share ---------------- */
function resetTs() {
    tsState.slots = [];
    tsState.spinAngle = 0;
    tsState.glowIndex = -1;
    tsState.lastResult = null;
    if (tsCountdownInterval) clearInterval(tsCountdownInterval);
    document.getElementById('tsCountdown').textContent = '';
    document.getElementById('tsResultStrip').textContent = t('ready');
    renderSlotPreview();
    drawTsWheel();
}

function copyTsResult() {
    if (!tsState.lastResult) return;
    navigator.clipboard?.writeText(tsState.lastResult.label).then(() => tsToast(t('toast_copied')));
}

function shareTsResult() {
    if (!tsState.lastResult) return;
    const text = `${tsState.lastResult.label} — Time Spinner @ TIME SPIN`;
    if (navigator.share) {
        navigator.share({ text, url: location.href }).catch(() => {});
    } else {
        navigator.clipboard?.writeText(`${text} ${location.href}`);
        tsToast(t('toast_share_fail'));
    }
}

/* ---------------- FAQ accordion ---------------- */
function initTsFaq() {
    document.querySelectorAll('.ts-faq-item').forEach(item => {
        item.querySelector('.ts-faq-q').addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.ts-faq-item').forEach(i => i.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });
}

/* ---------------- Init ---------------- */
document.addEventListener('DOMContentLoaded', () => {
    tsInitThemeAndLang();
    applyTranslations();
    drawTsWheel();
    renderRecent();
    initTsFaq();

    document.getElementById('tsGenerateBtn').addEventListener('click', generateTimeSlots);
    document.getElementById('tsSpinBtn').addEventListener('click', startTsSpin);
    document.getElementById('tsResetBtn').addEventListener('click', resetTs);
    document.getElementById('tsCopyBtn').addEventListener('click', copyTsResult);
    document.getElementById('tsShareBtn').addEventListener('click', shareTsResult);
    document.getElementById('tsMuteBtn').addEventListener('click', tsToggleMute);
    document.getElementById('tsMuteBtn').firstChild.textContent = tsState.muted ? '🔇 ' : '🔊 ';
    document.getElementById('tsModalSpinAgain').addEventListener('click', () => {
        document.getElementById('tsWinnerModal').classList.remove('active');
        startTsSpin();
    });
    document.getElementById('tsModalClose').addEventListener('click', () => {
        document.getElementById('tsWinnerModal').classList.remove('active');
    });
    window.addEventListener('resize', drawTsWheel);

    document.addEventListener('keydown', (e) => {
        if ((e.code === 'Space' || e.key.toLowerCase() === 's') && !['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            startTsSpin();
        }
    });
});
