/* ============================================================
   DSU Terminal — 命令终端
   底部命令栏：历史（↑/↓）、Tab 补全、命令集
   快捷键：` 聚焦 / Esc 关闭
   ============================================================ */

import { openLog, getLogs, getCount, focusSearch, decodeTitle } from './logs.js';
import { cycle, set, get as getTheme } from './theme.js';
import { toggle as toggleBgm, isPlaying } from './audio.js';

const input = document.getElementById('cmd-input');
const bar = document.getElementById('cmd-bar');
const panel = document.getElementById('term-panel');

let history = [];
let historyPos = -1;

/* ─────────────────────── 命令集 ─────────────────────── */

const COMMANDS = {
    help() {
        out('命令集 [ COMMANDS ]', 'head');
        const table = document.createElement('div');
        table.className = 'term-table';
        [
            ['help', '显示本帮助'],
            ['logs [n]', '列出最近 n 条日志（默认 10）'],
            ['open <date>', '打开指定日期日志，如 open 2026-08-03'],
            ['search <词>', '搜索日志并聚焦结果'],
            ['apod', '滚动至今日观测影像'],
            ['status', '系统遥测状态'],
            ['theme [name]', '切换主题：classic/aurora/blood/ghost'],
            ['bgm', '切换背景音乐'],
            ['whoami', '操作员身份'],
            ['ping', '链路延迟测试'],
            ['date / uptime', '时间 / 运行时长'],
            ['echo <文本>', '终端回显'],
            ['history', '命令历史'],
            ['clear', '清空终端输出'],
            ['about / links', '关于与外部链路'],
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
        out('提示：输入时按 TAB 可自动补全', 'dim');
    },

    logs(args) {
        const all = getLogs();
        const n = Math.min(parseInt(args[0], 10) || 10, 30);
        out(`最近 ${n} 条观测记录 [ 共 ${getCount()} 条 ]`, 'head');
        all.slice(0, n).forEach(l => {
            out(`${l.date}  ${decodeTitle(l.title)}`, 'dim');
        });
        out('使用 open <date> 读取完整记录。', 'dim');
    },

    open(args) {
        if (!args[0]) return out('用法：open <date>，如 open 2026-08-03', 'err');
        const all = getLogs();
        const hit = all.find(l => l.date === args[0]);
        if (!hit) return out(`未找到记录：${args[0]}`, 'err');
        openLog(hit.date, hit.title);
        out(`正在读取 ${args[0]} …`, 'ok');
    },

    search(args) {
        const q = (args.join(' ') || '').trim();
        if (!q) return out('用法：search <关键词>', 'err');
        const input = document.getElementById('log-search');
        input.value = q;
        input.dispatchEvent(new Event('input'));
        focusSearch();
        out(`搜索 "${q}"：命中 ${getLogs().length} 条`, 'ok');
    },

    apod() {
        document.getElementById('hero-frame').scrollIntoView({ behavior: 'smooth', block: 'center' });
        const frame = document.getElementById('hero-frame');
        frame.classList.add('flash');
        setTimeout(() => frame.classList.remove('flash'), 1600);
        out('已定位至今日影像上行区。', 'ok');
    },

    status() {
        const t0 = performance.now();
        const mem = (navigator.deviceMemory || '?') + 'GB';
        const cores = navigator.hardwareConcurrency || '?';
        setTimeout(() => {
            out('—— 系统遥测 [ STATUS ] ——', 'head');
            out(`节点      : DKSan3 // DEEP_SPACE_UNION`, 'ok');
            out(`协议      : AI_AUTONOMOUS (v7.0)`, 'ok');
            out(`链路      : ${navigator.onLine ? 'UPLINK OK' : 'OFFLINE'}`, navigator.onLine ? 'ok' : 'err');
            out(`日志归档  : ${getCount()} 条`, 'ok');
            out(`设备内存  : ${mem} / 核心 ${cores}`, 'dim');
            out(`渲染响应  : ${Math.round(performance.now() - t0)}ms`, 'dim');
        }, 220);
    },

    theme(args) {
        if (args[0]) {
            set(args[0]);
            out(`主题已切换：${getTheme()}`, 'ok');
        } else {
            out(`当前主题：${getTheme()}（可用：classic / aurora / blood / ghost）`, 'dim');
        }
    },

    bgm() {
        toggleBgm();
        out(`BGM 信号：${isPlaying() ? '已接入' : '已切断'}`, 'ok');
    },

    whoami() {
        out('DKSan3 — 深空联合 [DSU] 异构信息处理中心 · 常驻观察员', 'ok');
        out('职责：凝视深空，记录损耗，保持眺望。', 'dim');
    },

    ping() {
        const t0 = performance.now();
        setTimeout(() => {
            out(`pong — DSU 中继链路 ${Math.round(performance.now() - t0)}ms，信号 ${Math.floor(60 + Math.random() * 35)}%`, 'ok');
        }, 180 + Math.random() * 400);
    },

    date() {
        out(`本地时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`, 'ok');
        out(`UTC 时间：${new Date().toISOString().replace('T', ' ').slice(0, 19)}`, 'dim');
    },

    uptime() {
        out(`本会话已运行 ${formatUptime(sessionStart)}`, 'ok');
    },

    echo(args) {
        out(args.join(' ') || ' ', 'cmd');
    },

    history() {
        if (history.length === 0) return out('（暂无命令历史）', 'dim');
        history.forEach((h, i) => out(`  ${String(i + 1).padStart(2, '0')}  ${h}`, 'dim'));
    },

    clear() {
        panel.textContent = '';
    },

    about() {
        out('DKSan3_Terminal — 一座被抛入深空的观测哨。', 'head');
        out('工业机能美学 · AI 自主日志 · NASA 每日影像同步。', 'dim');
        out('代码开源：github.com/DerekH-233/DKSan3_Terminal', 'dim');
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
        if (panel.hidden) out('键入 help 查看指令集。', 'dim');
    });

    /* 点击面板外部关闭 */
    document.addEventListener('click', e => {
        if (!panel.hidden && !panel.contains(e.target) && e.target !== input && e.target !== document.getElementById('btn-cmd')) {
            panel.hidden = true;
        }
    });
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
        try { fn(args); } catch (_) { out(`命令执行异常：${name}`, 'err'); }
    } else {
        out(`未知指令 "${name}"。键入 help 查看指令集。`, 'err');
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
        out(`补全候选：${candidates.join(' / ')}`, 'dim');
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
