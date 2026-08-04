/* ============================================================
   DSU Terminal — 左侧时间日期链
   垂直月份导航轴：当前时间 + 月份节点
   滚动高亮当前月份；点击节点回到全量视图并跳转该月首条
   仅桌面宽屏显示（CSS 控制）
   ============================================================ */

import { gotoIndex, getLogs } from './logs.js?v=7.15';
import { t } from './i18n.js?v=7.15';

const tcClock = document.getElementById('tc-clock');
const tcPoints = document.getElementById('tc-points');

let observer = null;

/** 从日志数据提取月份节点（倒序，含计数） */
function buildNodes(logs) {
    const map = new Map();
    for (const l of logs) {
        if (!l || !l.date) continue;
        const month = l.date.slice(0, 7);
        map.set(month, (map.get(month) || 0) + 1);
    }
    return [...map.entries()].map(([month, count]) => ({ month, count }));
}

export function init(logs) {
    const nodes = buildNodes(logs);
    tcPoints.textContent = '';

    nodes.forEach(({ month, count }) => {
        const btn = document.createElement('button');
        btn.className = 'tc-node';
        btn.dataset.month = month;
        btn.setAttribute('aria-label', t('tcRecords', { month, count }));

        const dot = document.createElement('span');
        dot.className = 'dot';
        const label = document.createElement('span');
        label.className = 'label';
        label.textContent = month.slice(2).replace('-', '/'); // 26/08
        btn.append(dot, label);

        btn.addEventListener('click', () => jumpToMonth(month));
        tcPoints.appendChild(btn);
    });

    /* 滚动高亮：观察当前页日志卡片 */
    observer = new IntersectionObserver(onObserve, {
        root: null,
        rootMargin: '-10% 0px -55% 0px',   // 视口上 10% 处为探测线
        threshold: 0
    });
    observeItems();

    /* 时钟（本地时间） */
    const tick = () => {
        tcClock.textContent = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    };
    tick();
    setInterval(tick, 15000);

    /* 翻页/搜索后重新绑定观察（由 logs.js 广播） */
    document.addEventListener('dsu:page-rendered', observeItems);
}

function observeItems() {
    if (!observer) return;
    document.querySelectorAll('.log-item').forEach(el => observer.observe(el));
}

function onObserve(entries) {
    /* 取最靠近探测线的第一条 */
    let current = null;
    for (const e of entries) {
        if (e.isIntersecting) { current = e.target.dataset.date; break; }
    }
    if (!current) return;
    highlight(current.slice(0, 7));
}

function highlight(month) {
    let any = false;
    tcPoints.querySelectorAll('.tc-node').forEach(node => {
        const on = node.dataset.month === month;
        node.classList.toggle('active', on);
        if (on) {
            any = true;
            /* 滚入可视区 */
            node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    });
    return any;
}

/** 点击节点：回到全量视图并跳转到该月第一条 */
function jumpToMonth(month) {
    const search = document.getElementById('log-search');
    if (search.value) {
        search.value = '';
        search.dispatchEvent(new Event('input'));
    }
    const all = getLogs();
    const idx = all.findIndex(l => l.date && l.date.startsWith(month));
    if (idx >= 0) gotoIndex(idx);
}
