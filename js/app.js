/* ============================================================
   DSU Terminal — 入口 / 启动序列 / HUD
   编排：boot 序列 → 各模块初始化 → 主界面
   ============================================================ */

import * as theme from './theme.js';
import * as i18n from './i18n.js';
import { init as initScene } from './scene.js';
import { init as initLogs } from './logs.js';
import { init as initApod } from './apod.js';
import { init as initAudio } from './audio.js';
import { init as initTerminal } from './terminal.js';
import { init as initTimeline } from './timeline.js';

const bootScreen = document.getElementById('boot-screen');
const bootLog = document.getElementById('boot-log');
const bootHint = document.getElementById('boot-hint');
const bootFill = document.getElementById('boot-bar-fill');

const START_MS = Date.now();

/* ─────────────────────── 启动序列 ─────────────────────── */

const BOOT_ART = `
     ██████╗ ██╗  ██╗███████╗ ██████╗
     ██╔══██╗██║ ██╔╝██╔════╝██╔═══██╗
     ██║  ██║█████╔╝ ███████╗██║   ██║
     ██║  ██║██╔═██╗ ╚════██║██║   ██║
     ██████╔╝██║  ██╗███████║╚██████╔╝
     ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚═════╝
     DEEP_SPACE_UNION // TERMINAL OS v7.0
`;

const BOOT_LINES = [
    ['> DSU BIOS v7.0.0 ...............', 'OK'],
    ['> {boot.mem} ..................', '1.2GB OK'],
    ['> {boot.optical} .................', 'CALIBRATED'],
    ['> {boot.lens} .................', 'FOCUSED'],
    ['> {boot.uplink} ....................', 'HANDSHAKE'],
    ['> {boot.persona} ..............', 'DKSan3 v7.0'],
    ['> {boot.core} ...................', 'ONLINE'],
    ['> {boot.apod} ................', 'STANDBY'],
    ['> {boot.grid} ..............', 'ENGAGED'],
    ['> {boot.scan} ...............', 'ACTIVE'],
    ['> {boot.bgm} .....................', 'STANDBY'],
];

function runBoot() {
    let i = 0;
    const total = BOOT_LINES.length;

    const step = () => {
        if (i >= total) return finishBoot();

        const [label, status] = BOOT_LINES[i];
        const line = document.createElement('div');
        line.className = 'term-line';
        line.style.animation = 'none';
        line.innerHTML = `${i18n.t(label)} <span class="ok">${status}</span>`;
        bootLog.appendChild(line);
        bootLog.scrollTop = bootLog.scrollHeight;

        bootFill.style.width = `${Math.round(((i + 1) / total) * 100)}%`;
        i++;

        /* 快节奏：140–260ms 随机 */
        setTimeout(step, 140 + Math.random() * 120);
    };
    step();
}

function finishBoot() {
    bootFill.style.width = '100%';
    bootHint.innerHTML = i18n.t('bootEnter').replace('[ ENTER ]', '<span class="blink">[ ENTER ]</span>');
    bootHint.style.cursor = 'default';

    let entered = false;
    const enter = () => {
        if (entered) return;
        entered = true;
        document.removeEventListener('keydown', onKey);
        enterMain();
    };
    const onKey = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); } };
    document.addEventListener('keydown', onKey);

    /* 3 秒后自动进入 */
    setTimeout(enter, 3000);
}

async function enterMain() {
    bootScreen.classList.add('gone');
    setTimeout(() => bootScreen.remove(), 600);

    /* 并行初始化：日志（含 manifest）→ 影像/时间链依赖 manifest */
    const manifest = await initLogs().catch(() => null);
    initApod(manifest);
    initTimeline(Array.isArray(manifest) ? manifest : []);
    initTerminal();
    initAudio();

    /* 首屏动画：内容渐入 + 打字机 */
    document.getElementById('main').classList.add('ready');
    typeWriter();
    updateHud();
    setInterval(updateHud, 1000);
}

/* 打字机：原版交互保留，节奏更克制 */
function typeWriter() {
    const text = [i18n.t('tw1'), i18n.t('tw2'), i18n.t('tw3')].join('\n');
    const el = document.getElementById('typewriter');
    let i = 0;
    (function type() {
        if (i >= text.length) return;
        el.textContent += text.charAt(i) === '\n' ? '\n' : text.charAt(i);
        i++;
        setTimeout(type, 26);
    })();
}

/* ─────────────────────── HUD ─────────────────────── */

const TICKER_KEYS = ['ticker1', 'ticker2', 'ticker3', 'ticker4'];

let tickerIdx = 0;

function currentTicker() {
    return i18n.t(TICKER_KEYS[tickerIdx]);
}

function updateHud() {
    /* 本地时钟（用户浏览器时区）+ 日期（随界面语言） */
    const now = new Date();
    const locale = i18n.isZh() ? 'zh-CN' : 'en-US';
    document.getElementById('hud-clock').textContent = now.toLocaleTimeString(locale, { hour12: false });
    document.getElementById('hud-clock').title = now.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    /* 运行时长 */
    const s = Math.floor((Date.now() - START_MS) / 1000);
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    const uptime = document.getElementById('sys-uptime');
    if (uptime) uptime.textContent = `${h}:${m}:${sec}`;
}

function setupTicker() {
    const el = document.getElementById('hud-ticker');
    el.textContent = currentTicker();
    setInterval(() => {
        tickerIdx = (tickerIdx + 1) % TICKER_KEYS.length;
        el.textContent = currentTicker();
    }, 26000);
}

function setupSignal() {
    const sig = document.getElementById('hud-signal');
    const apply = () => {
        sig.classList.toggle('on', navigator.onLine);
        sig.classList.toggle('degraded', !navigator.onLine);
    };
    apply();
    window.addEventListener('online', apply);
    window.addEventListener('offline', apply);
}

function setupShortcuts() {
    document.addEventListener('keydown', e => {
        /* / 聚焦搜索（避开输入场景） */
        if (e.key === '/' &&
            !(e.target instanceof HTMLInputElement) &&
            !(e.target instanceof HTMLTextAreaElement)) {
            e.preventDefault();
            document.getElementById('log-search').focus();
        }
    });

    /* 侧栏按钮 */
    const btnTheme = document.getElementById('btn-theme');
    if (btnTheme) {
        btnTheme.addEventListener('click', () => {
            theme.cycle();
            flashHud(btnTheme, `THEME: ${theme.get()}`);
        });
    }
}

/* 按钮反馈闪烁 */
function flashHud(el, text) {
    const prev = el.textContent;
    el.textContent = text;
    el.classList.add('active');
    setTimeout(() => { el.textContent = prev; el.classList.remove('active'); }, 1400);
}

/* 语言切换按钮：显示目标语言；切换后刷新 ticker（字典已由 i18n 应用） */
function setupLangButton() {
    const btn = document.getElementById('btn-lang');
    if (!btn) return;
    btn.addEventListener('click', () => {
        i18n.toggleLang();
        const el = document.getElementById('hud-ticker');
        if (el) el.textContent = currentTicker();
    });
}

function setupScrollState() {
    const top = document.getElementById('hud-top');
    const onScroll = () => top.classList.toggle('scrolled', window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}

/* ─────────────────────── 启动 ─────────────────────── */

function main() {
    i18n.init();       /* 语言检测必须最先执行 */
    theme.init();
    document.querySelector('.boot-art').textContent = BOOT_ART;
    setupTicker();
    setupSignal();
    setupShortcuts();
    setupScrollState();
    setupLangButton();

    initScene();

    /* 会话内已启动过 → 快速进入 */
    try {
        if (sessionStorage.getItem('dsu_booted')) {
            enterMain();
            return;
        }
        sessionStorage.setItem('dsu_booted', '1');
    } catch (_) {}

    runBoot();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}
