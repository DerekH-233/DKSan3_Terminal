/* ============================================================
   DSU Terminal — 命令终端
   底部命令栏：历史（↑/↓）、Tab 补全、命令集
   快捷键：` 聚焦 / Esc 关闭
   ============================================================ */

import { openLog, getLogs, getCount, focusSearch, decodeTitle } from './logs.js?v=7.10';
import { cycle, set, get as getTheme } from './theme.js?v=7.10';
import { toggle as toggleBgm, isPlaying } from './audio.js?v=7.10';
import { t, isZh } from './i18n.js?v=7.10';

const input = document.getElementById('cmd-input');
const bar = document.getElementById('cmd-bar');
const panel = document.getElementById('term-panel');

let history = [];
let historyPos = -1;

/* ─────────────────────── 命令集 ─────────────────────── */

const COMMANDS = {
    help() {
        out(t('termHelpHead'), 'head');
        const table = document.createElement('div');
        table.className = 'term-table';
        [
            ['help', t('cmdHelp')],
            ['logs [n]', t('cmdLogs')],
            ['open <date>', t('cmdOpen')],
            [t('cmdSearchName'), t('cmdSearch')],
            ['apod', t('cmdApod')],
            ['status', t('cmdStatus')],
            ['theme [name]', t('cmdTheme')],
            ['bgm', t('cmdBgm')],
            ['whoami', t('cmdWhoami')],
            ['ping', t('cmdPing')],
            ['date / uptime', t('cmdDate')],
            [t('cmdEchoName'), t('cmdEcho')],
            ['history', t('cmdHistory')],
            ['clear', t('cmdClear')],
            ['about / links', t('cmdAbout')],
        ].forEach(([k, d]) => {
            const kEl = document.createElement('span');
            kEl.className = 'k';
            kEl.textContent = k;
            const dEl = document.createElement('span');
            dEl.className = 'd';
            dEl.textContent = d;
            table.append(kEl, dEl);
        });
        panel.appendChild(table);
        out(t('termHelpTip'), 'dim');
    },

    logs(args) {
        const all = getLogs();
        const n = Math.min(parseInt(args[0], 10) || 10, 30);
        out(t('termLogsHead', { n, total: getCount() }), 'head');
        all.slice(0, n).forEach(l => {
            out(`${l.date}  ${decodeTitle(l)}`, 'dim');
        });
        out(t('termLogsTip'), 'dim');
    },

    open(args) {
        if (!args[0]) return out(t('termUsageOpen'), 'err');
        const all = getLogs();
        const hit = all.find(l => l.date === args[0]);
        if (!hit) return out(t('termNotFound', { date: args[0] }), 'err');
        openLog(hit.date, hit);
        out(t('termReading', { date: args[0] }), 'ok');
    },

    search(args) {
        const q = (args.join(' ') || '').trim();
        if (!q) return out(t('termUsageSearch'), 'err');
        const input = document.getElementById('log-search');
        input.value = q;
        input.dispatchEvent(new Event('input'));
        focusSearch();
        out(t('termSearchHit', { q, n: getLogs().length }), 'ok');
    },

    apod() {
        document.getElementById('hero-frame').scrollIntoView({ behavior: 'smooth', block: 'center' });
        const frame = document.getElementById('hero-frame');
        frame.classList.add('flash');
        setTimeout(() => frame.classList.remove('flash'), 1600);
        out(t('termApodLoc'), 'ok');
    },

    status() {
        const t0 = performance.now();
        const mem = (navigator.deviceMemory || '?') + 'GB';
        const cores = navigator.hardwareConcurrency || '?';
        setTimeout(() => {
            out(t('termStatusHead'), 'head');
            out(`${t('termStatusNode')}      : DKSan3 // DEEP_SPACE_UNION`, 'ok');
            out(`${t('termStatusProtocol')}  : AI_AUTONOMOUS (v7.0)`, 'ok');
            out(`${t('termStatusPersona')}  : DKSan3_PERSONA v7.0.0 [STABLE]`, 'ok');
            out(`${t('termStatusLink')}      : ${navigator.onLine ? t('termStatusUp') : t('termStatusDown')}`, navigator.onLine ? 'ok' : 'err');
            out(`${t('termStatusLogs')}  : ${getCount()}`, 'ok');
            out(`${t('termStatusMem')}  : ${mem} / ${cores} CORES`, 'dim');
            out(`${t('termStatusRender')}  : ${Math.round(performance.now() - t0)}ms`, 'dim');
        }, 220);
    },

    theme(args) {
        if (args[0]) {
            set(args[0]);
            out(t('termThemeSet', { t: getTheme() }), 'ok');
        } else {
            out(t('termThemeCur', { t: getTheme() }), 'dim');
        }
    },

    bgm() {
        toggleBgm();
        out(t('termBgm', { s: isPlaying() ? t('termBgmOn') : t('termBgmOff') }), 'ok');
    },

    whoami() {
        out(t('termWhoami1'), 'ok');
        out(t('termWhoami2'), 'ok');
        out(t('termWhoami3'), 'dim');
        out(t('termWhoami4'), 'dim');
    },

    ping() {
        const t0 = performance.now();
        setTimeout(() => {
            out(t('termPing', { ms: Math.round(performance.now() - t0), sig: Math.floor(60 + Math.random() * 35) }), 'ok');
        }, 180 + Math.random() * 400);
    },

    date() {
        out(t('termDateLocal', { t: new Date().toLocaleString(isZh ? 'zh-CN' : 'en-GB', { hour12: false }) }), 'ok');
        out(t('termDateUtc', { t: new Date().toISOString().replace('T', ' ').slice(0, 19) }), 'dim');
    },

    uptime() {
        out(t('termUptime', { t: formatUptime(sessionStart) }), 'ok');
    },

    echo(args) {
        out(args.join(' ') || ' ', 'cmd');
    },

    history() {
        if (history.length === 0) return out(t('termHistoryEmpty'), 'dim');
        history.forEach((h, i) => out(`  ${String(i + 1).padStart(2, '0')}  ${h}`, 'dim'));
    },

    clear() {
        panel.textContent = '';
    },

    about() {
        out(t('termAbout1'), 'head');
        out(t('termAbout2'), 'dim');
        out(t('termAbout3'), 'dim');
    },

    links() {
        out('◈ SOURCE_CODE  → github.com/DerekH-233/DKSan3_Terminal', 'ok');
        out('◈ NASA_APOD    → apod.nasa.gov/apod/astropix.html', 'ok');
        out('◈ DEEPSEEK API → platform.deepseek.com', 'dim');
    }
};

const sessionStart = Date.now();

/* ─────────────────────── 输出 ─────────────────────── */

function out(text, cls = '') {
    const line = document.createElement('div');
    line.className = 'term-line ' + (cls || '');
    line.textContent = text;
    panel.appendChild(line);
    panel.scrollTop = panel.scrollHeight;
    showPanel();
}

function showPanel() {
    panel.hidden = false;
}

/* ─────────────────────── 交互 ─────────────────────── */

export function init() {
    /* ` 键聚焦（全局） */
    document.addEventListener('keydown', e => {
        if (e.key === '`' && document.activeElement !== input && !isTypingIn(e.target)) {
            e.preventDefault();
            input.focus();
            input.select();
        }
    });

    input.addEventListener('focus', () => bar.classList.add('focused'));
    input.addEventListener('blur', () => bar.classList.remove('focused'));

    input.addEventListener('keydown', e => {
        switch (e.key) {
            case 'Enter': {
                const cmd = input.value.trim();
                input.value = '';
                if (cmd) {
                    history.unshift(cmd);
                    history = history.slice(0, 50);
                    historyPos = -1;
                    run(cmd);
                }
                break;
            }
            case 'ArrowUp': {
                e.preventDefault();
                if (history.length === 0) break;
                historyPos = Math.min(historyPos + 1, history.length - 1);
                input.value = history[historyPos];
                break;
            }
            case 'ArrowDown': {
                e.preventDefault();
                historyPos = Math.max(historyPos - 1, -1);
                input.value = historyPos >= 0 ? history[historyPos] : '';
                break;
            }
            case 'Tab': {
                e.preventDefault();
                complete();
                break;
            }
            case 'Escape': {
                if (!panel.hidden) { panel.hidden = true; }
                input.blur();
                break;
            }
        }
    });

    document.getElementById('btn-cmd').addEventListener('click', () => {
        input.focus();
        if (panel.hidden) out(t('termWelcome'), 'dim');
    });

    /* 点击面板外部关闭 */
    document.addEventListener('click', e => {
        if (!panel.hidden && !panel.contains(e.target) && e.target !== input && e.target !== document.getElementById('btn-cmd')) {
            panel.hidden = true;
        }
    });

    /* 语言切换：清空面板，避免双语混杂 */
    document.addEventListener('dsu:lang-change', () => { panel.textContent = ''; });
}

function isTypingIn(el) {
    return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

function run(cmdline) {
    const [name, ...args] = cmdline.split(/\s+/);
    const echo = document.createElement('div');
    echo.className = 'term-line cmd';
    echo.textContent = cmdline;
    panel.appendChild(echo);

    const fn = COMMANDS[name];
    if (fn) {
        try { fn(args); } catch (_) { out(t('termErr', { c: name }), 'err'); }
    } else {
        out(t('termUnknown', { c: name }), 'err');
    }
    panel.scrollTop = panel.scrollHeight;
}

/* Tab 补全 */
function complete() {
    const words = input.value.split(/\s+/);
    const last = words[words.length - 1].toLowerCase();
    if (!last) return;

    const candidates = Object.keys(COMMANDS).filter(c => c.startsWith(last));
    if (candidates.length === 1) {
        words[words.length - 1] = candidates[0];
        input.value = words.join(' ') + ' ';
    } else if (candidates.length > 1) {
        out(t('termComplete', { c: candidates.join(' / ') }), 'dim');
    }
}

/* ─────────────────────── 工具 ─────────────────────── */

function formatUptime(ms) {
    const s = Math.floor((Date.now() - ms) / 1000);
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
}
