/* ============================================================
   DSU Terminal — 日志系统
   manifest 加载（localStorage 缓存兜底）/ 搜索 / 分页
   卡片显示当日影像缩略图；数据异常（null / 缺失 / 加载失败）
   以科幻化的「信号失真 / SIGNAL_LOST」方式呈现
   双语支持：英文界面读取 .en.txt 日志、英文标题（title_en）
   沉浸式阅读器：键盘导航、阅读进度、段落入场
   安全：所有动态内容经 textContent 渲染，杜绝注入
   ============================================================ */

import { t, isZh } from './i18n.js?v=7.7';

const CACHE_KEY = 'dsu_manifest_v2';
const CACHE_TTL = 1000 * 60 * 60 * 6;   // 缓存 6 小时
const PAGE_SIZE = 12;                    // 每页记录数

let logs = [];          // 完整清单（倒序）
let filtered = [];      // 当前可见（搜索后）
let currentPage = 1;
let searchQuery = '';
let readerIndex = -1;   // 阅读器当前条目在 filtered 中的索引

/* DOM 引用 */
const listEl = document.getElementById('log-list');
const searchEl = document.getElementById('log-search');
const countEl = document.getElementById('log-count');
const placeholderEl = document.getElementById('log-placeholder');
const pagerEl = document.getElementById('pager');
const pagerPagesEl = document.getElementById('pager-pages');
const pagerPrevEl = document.getElementById('pager-prev');
const pagerNextEl = document.getElementById('pager-next');
const reader = document.getElementById('reader');

const totalPages = () => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

/* ─────────────────────── 数据解码（科幻化异常处理 + 双语） ─────────────────────── */

const BAD_TITLES = new Set(['null', '空值', 'none', 'undefined', '']);

/**
 * 标题解码：按当前语言返回 title / title_en；
 * null / 空值 → 信号失真提示（双语）
 */
export function decodeTitle(log) {
    if (!log || typeof log !== 'object') return t('degradedTitle');
    const zhTitle = (log.title || '').trim();
    const enTitle = (log.title_en || '').trim();

    if (!isZh()) {
        if (BAD_TITLES.has(enTitle.toLowerCase())) return t('degradedTitle');
        return enTitle || (BAD_TITLES.has(zhTitle.toLowerCase()) ? t('degradedTitle') : zhTitle);
    }
    if (BAD_TITLES.has(zhTitle.toLowerCase())) return t('degradedTitle');
    return zhTitle || t('noTitle');
}

export function isDegradedTitle(log) {
    const title = isZh() ? (log && log.title) : (log && (log.title_en || log.title));
    const t = (title || '').trim();
    return BAD_TITLES.has(t.toLowerCase()) || !t;
}

/** 影像解码：null / 缺失 / YouTube embed → 可用的图片 URL 或 null */
export function decodeImage(img) {
    if (!img || img === 'null') return null;
    /* YouTube embed → 官方缩略图 */
    const yt = img.match(/youtube\.com\/embed\/([\w-]+)|youtu\.be\/([\w-]+)/i);
    if (yt) return `https://img.youtube.com/vi/${yt[1] || yt[2]}/hqdefault.jpg`;
    return img;
}

/* ─────────────────────── 特殊记录：愉悦星球插画（SVG 数据 URI，颜色跟随主题） ─────────────────────── */

function joyImageDataUri() {
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--c-primary').trim() || '#ff5a09';
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--c-accent').trim() || '#00f0ff';
    const stars = (() => {
        const pts = [[20,18,1.2],[42,12,0.9],[150,14,1.1],[162,40,0.8],[12,55,0.8],[140,84,1],[34,30,0.7],[120,22,1.3]];
        return pts.map(([x, y, r]) => `<circle cx='${x}' cy='${y}' r='${r}' fill='#fff' opacity='0.75'/>`).join('');
    })();
    const sparkles = (() => {
        const pts = [[118,26],[156,64],[24,78],[64,12]];
        return pts.map(([x, y]) =>
            `<path d='M${x} ${y} l1.6 3.2 3.2 1.6 -3.2 1.6 -1.6 3.2 -1.6 -3.2 -3.2 -1.6 3.2 -1.6z' fill='${accent}' opacity='0.85'/>`
        ).join('');
    })();
    const svg =
        `<svg xmlns='http://www.w3.org/2000/svg' width='352' height='224' viewBox='0 0 176 112'>` +
        `<rect width='176' height='112' fill='#05080c'/>` +
        stars + sparkles +
        /* 网格地平线 */
        `<path d='M0 88 H176' stroke='${primary}' stroke-opacity='0.4' stroke-width='0.8'/>` +
        `<path d='M0 94 H176' stroke='${primary}' stroke-opacity='0.25' stroke-width='0.8'/>` +
        `<path d='M16 88 L26 100 M52 88 L62 100 M88 88 L98 100 M124 88 L134 100 M160 88 L170 100' stroke='${primary}' stroke-opacity='0.3' stroke-width='0.8'/>` +
        /* 轨道 */
        `<ellipse cx='88' cy='52' rx='42' ry='12' fill='none' stroke='${accent}' stroke-opacity='0.35' stroke-dasharray='3 4' transform='rotate(-14 88 52)'/>` +
        /* 微笑星球本体 */
        `<circle cx='88' cy='52' r='28' fill='#0d1520' stroke='${primary}' stroke-width='1.6'/>` +
        `<circle cx='80' cy='42' r='6' fill='#fff' opacity='0.06'/>` +
        /* 眯眼（愉悦的弧线眼睛） */
        `<path d='M74 46 Q78 41 82 46' stroke='${accent}' stroke-width='2.2' fill='none' stroke-linecap='round'/>` +
        `<path d='M94 46 Q98 41 102 46' stroke='${accent}' stroke-width='2.2' fill='none' stroke-linecap='round'/>` +
        /* 微笑 */
        `<path d='M75 57 Q88 71 101 57' stroke='${primary}' stroke-width='2.2' fill='none' stroke-linecap='round'/>` +
        /* 腮红 */
        `<circle cx='70' cy='59' r='3.2' fill='${primary}' opacity='0.4'/>` +
        `<circle cx='106' cy='59' r='3.2' fill='${primary}' opacity='0.4'/>` +
        `</svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

/** 阅读器大图：特殊记录 → 愉悦星球插画；普通日志 → 当日影像；
 *  视频/影像缺失 → SIGNAL_LOST 故障占位 */
function buildReaderArt(log) {
    if (!log) return null;
    const art = document.createElement('div');
    art.className = 'reader-art';

    if (log.special) {
        art.style.backgroundImage = `url("${joyImageDataUri()}")`;
        return art;
    }

    const imgUrl = decodeImage(log.img);
    if (imgUrl && !/\.(mp4|webm|mov)(\?|$)/i.test(imgUrl)) {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => { art.style.backgroundImage = `url("${imgUrl}")`; };
        img.onerror = () => art.classList.add('fail');
        img.src = imgUrl;
        return art;
    }

    /* 视频或影像缺失：故障占位 */
    art.classList.add('fail');
    return art;
}

/* ─────────────────────── 数据加载 ─────────────────────── */

export async function init() {
    logs = await loadManifest();
    filtered = [...logs];

    countEl.textContent = `${logs.length} RECORDS`;
    document.getElementById('sys-logs').textContent = logs.length;

    if (logs.length > 0) {
        const newest = logs[0];
        document.getElementById('sys-sync').textContent = newest.date;
    }

    renderPage();
    setupPager();
    setupSearch();
    setupReaderUI();

    return logs;
}

async function loadManifest() {
    const stale = loadCache();
    try {
        const res = await fetch(`logs/manifest.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
            try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data })); } catch (_) {}
            return data;
        }
        throw new Error('empty manifest');
    } catch (_) {
        if (stale) return stale;
        placeholderEl.textContent = t('waitingSignalLost');
        return [];
    }
}

function loadCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const { t, data } = JSON.parse(raw);
        if (Date.now() - t < CACHE_TTL && Array.isArray(data) && data.length) return data;
        return null;
    } catch (_) { return null; }
}

/* ─────────────────────── 分页渲染 ─────────────────────── */

function renderPage() {
    if (placeholderEl) placeholderEl.remove();

    listEl.textContent = '';
    const frag = document.createDocumentFragment();
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, filtered.length);
    const today = new Date().toISOString().slice(0, 10);

    for (let i = start; i < end; i++) {
        frag.appendChild(buildItem(filtered[i], i, today));
    }
    listEl.appendChild(frag);
    countEl.textContent = `${filtered.length} / ${logs.length} RECORDS`;

    renderPager();
    document.dispatchEvent(new CustomEvent('dsu:page-rendered'));
}

function buildItem(log, idx, today) {
    const isSpecial = !!log.special;
    const item = document.createElement('div');
    item.className = 'log-item' + (log.date === today ? ' log-new' : '') + (isSpecial ? ' log-special' : '');
    item.setAttribute('role', 'listitem');
    item.dataset.date = log.date;
    item.tabIndex = 0;

    /* 当日影像缩略图：特殊记录永远显示愉悦星球（笑脸是标志，不被影像替换）；
       普通记录显示当日影像，缺失时 SIGNAL_LOST 占位 */
    const thumb = document.createElement('div');
    thumb.className = 'log-thumb' + (isSpecial ? ' joy' : '');
    if (isSpecial) {
        thumb.style.backgroundImage = `url("${joyImageDataUri()}")`;
    } else {
        const imgUrl = decodeImage(log.img);
        if (imgUrl) {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => { thumb.style.backgroundImage = `url("${imgUrl}")`; };
            img.onerror = () => thumb.classList.add('fail');
            img.src = imgUrl;
        } else {
            thumb.classList.add('fail');
        }
    }

    /* 特殊记录角标 */
    if (isSpecial) {
        const badge = document.createElement('span');
        badge.className = 'log-special-badge';
        badge.textContent = isZh() ? 'SPECIAL' : 'SPECIAL';
        item.appendChild(badge);
    }

    const idxEl = document.createElement('span');
    idxEl.className = 'log-index';
    idxEl.textContent = String(logs.length - idx).padStart(4, '0');

    const info = document.createElement('div');
    info.className = 'log-info';
    const date = document.createElement('span');
    date.className = 'log-date';
    date.textContent = log.date;
    const title = document.createElement('span');
    title.className = 'log-title' + (isDegradedTitle(log) ? ' degraded' : '');
    title.textContent = decodeTitle(log);
    info.append(date, title);

    const arrow = document.createElement('span');
    arrow.className = 'log-arrow';
    arrow.textContent = '▸';

    item.append(thumb, idxEl, info, arrow);

    const open = () => openLogAt(idx);
    item.addEventListener('click', open);
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    return item;
}

/* ─────────────────────── 分页器 ─────────────────────── */

function renderPager() {
    const pages = totalPages();
    if (pages <= 1) { pagerEl.hidden = true; return; }
    pagerEl.hidden = false;

    pagerPrevEl.disabled = currentPage <= 1;
    pagerNextEl.disabled = currentPage >= pages;

    pagerPagesEl.textContent = '';
    const addNum = (n, active = false) => {
        const b = document.createElement('button');
        b.className = 'pager-num' + (active ? ' active' : '');
        b.textContent = String(n).padStart(2, '0');
        b.setAttribute('aria-label', `第 ${n} 页`);
        b.setAttribute('aria-current', active ? 'page' : 'false');
        if (!active) b.addEventListener('click', () => gotoPage(n));
        pagerPagesEl.appendChild(b);
    };
    const addDots = () => {
        const s = document.createElement('span');
        s.className = 'pager-ellipsis';
        s.textContent = '···';
        pagerPagesEl.appendChild(s);
    };

    /* 页码窗口：1 ... 当前±1 ... 末尾 */
    addNum(1, currentPage === 1);
    const lo = Math.max(2, currentPage - 1);
    const hi = Math.min(pages - 1, currentPage + 1);
    if (lo > 2) addDots();
    for (let i = lo; i <= hi; i++) addNum(i, i === currentPage);
    if (hi < pages - 1) addDots();
    if (pages > 1) addNum(pages, currentPage === pages);
}

function gotoPage(n) {
    const pages = totalPages();
    currentPage = Math.min(Math.max(1, n), pages);
    renderPage();
    listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    searchEl.blur();
}

function setupPager() {
    pagerPrevEl.addEventListener('click', () => gotoPage(currentPage - 1));
    pagerNextEl.addEventListener('click', () => gotoPage(currentPage + 1));
}

/* ─────────────────────── 搜索 ─────────────────────── */

function setupSearch() {
    let timer = 0;
    searchEl.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            searchQuery = searchEl.value.trim().toLowerCase();
            filtered = searchQuery
                ? logs.filter(l =>
                    decodeTitle(l).toLowerCase().includes(searchQuery) ||
                    (l.title || '').toLowerCase().includes(searchQuery) ||
                    (l.title_en || '').toLowerCase().includes(searchQuery) ||
                    l.date.includes(searchQuery))
                : [...logs];
            currentPage = 1;
            if (filtered.length === 0) {
                pagerEl.hidden = true;
                listEl.textContent = '';
                const empty = document.createElement('div');
                empty.className = 'log-empty';
                empty.append(t('noMatch'));
                const q = document.createElement('span');
                q.style.color = 'var(--c-primary)';
                q.textContent = searchEl.value;
                empty.appendChild(q);
                listEl.appendChild(empty);
                countEl.textContent = `0 / ${logs.length} RECORDS`;
            } else {
                renderPage();
            }
        }, 220);
    });
}

/* ─────────────────────── 阅读器 ─────────────────────── */

function openLogAt(idx) {
    readerIndex = idx;
    const log = filtered[idx];
    openLog(log.date, log, idx);
}

/**
 * 读取日志正文。
 * 安全防线：CF Pages 对不存在的路径会返回 200 + index.html（SPA fallback），
 * 因此除状态码外还必须校验 content-type 为 text/plain，防止 HTML 源码混入正文；
 * 内容为 "null"/过短（采集失败）时，替换为信号失真的科幻文案。
 */
async function fetchLogText(date) {
    const fetchTxt = async (name) => {
        const res = await fetch(`logs/${name}`, { cache: 'no-cache' });
        if (!res.ok) return null;
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (!ct.includes('text/plain')) return null;
        return await res.text();
    };

    const sanitize = (raw) => {
        const text = (raw || '').trim();
        if (!text || text === 'null' || text.length < 5) return null;
        return text;
    };

    let raw;
    if (!isZh()) {
        raw = await fetchTxt(`${date}.en.txt`).catch(() => null);
        if (raw !== null) {
            const ok = sanitize(raw);
            return { text: ok ?? t('readerCorrupt'), fallback: ok === null };
        }
        raw = await fetchTxt(`${date}.txt`).catch(() => null);
        if (raw !== null) {
            const ok = sanitize(raw);
            return { text: ok ?? t('readerCorrupt'), fallback: true };
        }
        return { text: t('readerLinkDown'), fallback: false };
    }

    raw = await fetchTxt(`${date}.txt`).catch(() => null);
    if (raw !== null) {
        const ok = sanitize(raw);
        return { text: ok ?? t('readerCorrupt'), fallback: false };
    }
    return { text: t('readerLinkDown'), fallback: false };
}

export async function openLog(date, log, idx) {
    if (!date) return;
    const { text, fallback } = await fetchLogText(date);

    readerIndex = idx ?? filtered.findIndex(l => l.date === date);

    /* 头部 */
    document.getElementById('reader-date').textContent = `[ ${date} ]`;
    document.getElementById('reader-title').textContent = decodeTitle(log);

    /* 正文：逐段渲染（textContent 安全） */
    const body = document.getElementById('reader-body');
    body.textContent = '';
    const art = buildReaderArt(log);
    if (art) body.appendChild(art);
    if (fallback) {
        const note = document.createElement('div');
        note.className = 'reader-note';
        note.textContent = t('enNotAvailable');
        body.appendChild(note);
    }
    const paras = text.split(/\n+/).filter(p => p.trim());
    paras.forEach((p, i) => {
        const div = document.createElement('div');
        div.style.animationDelay = `${Math.min(i * 0.045, 0.9)}s`;
        div.textContent = p;
        body.appendChild(div);
    });

    updateReaderNav();
    show();
}

function show() {
    reader.hidden = false;
    requestAnimationFrame(() => reader.classList.add('show'));
    document.getElementById('reader-body').focus({ preventScroll: true });
    document.body.style.overflow = 'hidden';
}

export function closeReader() {
    reader.classList.add('hide');
    setTimeout(() => {
        reader.classList.remove('show', 'hide');
        reader.hidden = true;
        document.body.style.overflow = '';
        searchEl.focus({ preventScroll: true });
    }, 320);
}

function stepReader(dir) {
    if (filtered.length === 0) return;
    const next = (readerIndex + dir + filtered.length) % filtered.length;
    const log = filtered[next];
    openLog(log.date, log, next);
}

/* 语言切换：重绘列表；阅读器打开时重载当前日志 */
document.addEventListener('dsu:lang-change', () => {
    renderPage();
    if (!reader.hidden && readerIndex >= 0 && filtered[readerIndex]) {
        const log = filtered[readerIndex];
        openLog(log.date, log, readerIndex);
    }
});

/* 主题切换：重绘列表（愉悦星球插画颜色跟随主题色） */
document.addEventListener('dsu:theme-change', () => {
    renderPage();
    if (!reader.hidden && readerIndex >= 0 && filtered[readerIndex] && filtered[readerIndex].special) {
        const log = filtered[readerIndex];
        openLog(log.date, log, readerIndex);
    }
});

function updateReaderNav() {
    document.getElementById('reader-pos').textContent = `${readerIndex + 1} / ${filtered.length}`;
    document.getElementById('reader-prev').disabled = filtered.length <= 1;
    document.getElementById('reader-next').disabled = filtered.length <= 1;
}

/* 阅读器 UI 事件 */
function setupReaderUI() {
    document.getElementById('reader-close').addEventListener('click', closeReader);
    document.getElementById('reader-prev').addEventListener('click', () => stepReader(-1));
    document.getElementById('reader-next').addEventListener('click', () => stepReader(1));

    /* 阅读进度 */
    const fill = document.getElementById('reader-progress-fill');
    reader.addEventListener('scroll', () => {
        const max = reader.scrollHeight - reader.clientHeight;
        fill.style.width = max > 0 ? `${(reader.scrollTop / max) * 100}%` : '0%';
    }, { passive: true });

    /* 键盘：Esc 关闭 / ←→ 翻页 */
    reader.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeReader();
        else if (e.key === 'ArrowLeft') stepReader(-1);
        else if (e.key === 'ArrowRight') stepReader(1);
    });

    /* 点击遮罩空白处关闭（不命中内容区） */
    reader.addEventListener('click', e => {
        if (e.target === reader) closeReader();
    });
}

/* ─────────────────────── 公开 API ─────────────────────── */

export function getLogs() { return filtered; }
export function getCount() { return logs.length; }
export function focusSearch() { searchEl.focus(); }

/** 跳转到全量列表中的指定索引（供时间链调用），并平滑滚动到对应卡片 */
export function gotoIndex(idx) {
    if (idx < 0 || idx >= filtered.length) return;
    currentPage = Math.floor(idx / PAGE_SIZE) + 1;
    renderPage();
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const date = filtered[idx].date;
            const el = document.querySelector(`.log-item[data-date="${date}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });
}
