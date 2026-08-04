/* ============================================================
   DSU Terminal — 观测视图（二级页面）
   view.html?date=YYYY-MM-DD
   左侧：今日 NASA 大图 + 标题；右侧：观测日志 + 右下角原链接
   双语：标题/正文随界面语言；数据异常科幻化处理
   ============================================================ */

import * as theme from './theme.js?v=7.15';
import * as i18n from './i18n.js?v=7.15';
import { joyImageDataUri } from './logs.js?v=7.15';

const CACHE_KEY = 'dsu_manifest_v2';

const BAD = new Set(['null', '空值', 'none', 'undefined', '']);

/* ───────────── 数据加载 ───────────── */

async function loadManifest() {
    try {
        const res = await fetch(`logs/manifest.json?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length) {
                try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data })); } catch (_) {}
                return data;
            }
        }
    } catch (_) { /* 网络失败回退缓存 */ }
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) return JSON.parse(raw).data;
    } catch (_) {}
    return [];
}

/* ───────────── 标题/正文解码（与 logs.js 一致） ───────────── */

function decodeTitle(log) {
    if (!log || typeof log !== 'object') return i18n.t('degradedTitle');
    const zhTitle = (log.title || '').trim();
    const enTitle = (log.title_en || '').trim();
    if (!i18n.isZh()) {
        if (BAD.has(enTitle.toLowerCase())) return i18n.t('degradedTitle');
        return enTitle || (BAD.has(zhTitle.toLowerCase()) ? i18n.t('degradedTitle') : zhTitle);
    }
    if (BAD.has(zhTitle.toLowerCase())) return i18n.t('degradedTitle');
    return zhTitle || i18n.t('noTitle');
}

function nasaTitle(entry) {
    if (!entry) return i18n.t('heroFallback');
    if (i18n.isZh()) return (entry.nasa_title && !BAD.has(String(entry.nasa_title).trim().toLowerCase()))
        ? entry.nasa_title : (entry.title || i18n.t('heroFallback'));
    return (entry.nasa_title_en && !BAD.has(String(entry.nasa_title_en).trim().toLowerCase()))
        ? entry.nasa_title_en
        : ((entry.title_en && !BAD.has(String(entry.title_en).trim().toLowerCase()))
            ? entry.title_en : (entry.title || i18n.t('heroFallback')));
}

/* 双语正文（content-type 防线 + null 处理，与 logs.js 一致） */
async function fetchLogText(log) {
    const base = (log && log.file) || (typeof log === 'string' ? log : (log && log.date));
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
    if (!i18n.isZh()) {
        raw = await fetchTxt(`${base}.en.txt`).catch(() => null);
        if (raw !== null) {
            const ok = sanitize(raw);
            return { text: ok ?? i18n.t('readerCorrupt'), fallback: ok === null };
        }
        raw = await fetchTxt(`${base}.txt`).catch(() => null);
        if (raw !== null) {
            const ok = sanitize(raw);
            return { text: ok ?? i18n.t('readerCorrupt'), fallback: true };
        }
        return { text: i18n.t('readerLinkDown'), fallback: false };
    }
    raw = await fetchTxt(`${base}.txt`).catch(() => null);
    if (raw !== null) {
        const ok = sanitize(raw);
        return { text: ok ?? i18n.t('readerCorrupt'), fallback: false };
    }
    return { text: i18n.t('readerLinkDown'), fallback: false };
}

/* ───────────── 渲染 ───────────── */

async function render(entry) {
    document.title = `DKSan3 // ${entry.date}`;

    /* 左侧大图：特别记录 → 愉悦星球插画（主题色联动）；普通日志 → 当日影像 */
    const media = document.getElementById('view-media');
    if (entry.special) {
        media.style.backgroundImage = `url("${joyImageDataUri()}")`;
    } else {
        const imgUrl = entry.img && entry.img !== 'null' ? entry.img : null;
        if (imgUrl && !/\.(mp4|webm|mov)(\?|$)/i.test(imgUrl)) {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => { media.style.backgroundImage = `url("${imgUrl}")`; };
            img.onerror = () => media.classList.add('fail');
            img.src = imgUrl;
        } else {
            media.classList.add('fail');
        }
    }
    document.getElementById('view-nasa-date').textContent = `[ ${entry.date} ]`;
    document.getElementById('view-nasa-title').textContent = nasaTitle(entry);

    /* 右侧：日志 */
    document.getElementById('view-log-date').textContent = `[ ${entry.date} ]`;
    document.getElementById('view-log-title').textContent = decodeTitle(entry);

    const { text, fallback } = await fetchLogText(entry);
    const body = document.getElementById('view-log-body');
    body.textContent = '';
    if (fallback) {
        const note = document.createElement('div');
        note.className = 'reader-note';
        note.textContent = i18n.t('enNotAvailable');
        body.appendChild(note);
    }
    const paras = text.split(/\n+/).filter(p => p.trim());
    paras.forEach((p, i) => {
        const div = document.createElement('div');
        div.style.animationDelay = `${Math.min(i * 0.04, 0.8)}s`;
        div.textContent = p;
        body.appendChild(div);
    });

    /* 右下角原链接（仅更新按钮文本；点击行为在 init 中绑定一次，防止监听器累积） */
    const origin = document.getElementById('view-origin');
    origin.textContent = i18n.t('linkApod');
}

/* ───────────── 启动 ───────────── */

let currentEntry = null;
let manifestList = [];

const ORIGIN_URL = 'https://apod.nasa.gov/apod/';

/* 主日志序列（排除 special 特别记录） */
function mainLogs() { return manifestList.filter(e => e && !e.special); }

/* 键盘翻页：←/→ 在相邻主日志间切换（越界不循环，停在边界；特别记录不参与翻页） */
function step(dir) {
    const seq = mainLogs();
    if (seq.length < 2 || !currentEntry || currentEntry.special) return;
    const idx = seq.findIndex(e => e.date === currentEntry.date);
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= seq.length) return;
    const next = seq[nextIdx];
    currentEntry = next;
    history.replaceState(null, '', `view.html?date=${encodeURIComponent(next.date)}`);
    render(next);
    updateNav();
    window.scrollTo({ top: 0 });
}

/* 上一篇/下一篇按钮状态：首条禁用 PREV，末条禁用 NEXT；特别记录整体禁用 */
function updateNav() {
    const seq = mainLogs();
    const prevBtn = document.getElementById('view-prev');
    const nextBtn = document.getElementById('view-next');
    if (!seq.length || !currentEntry || currentEntry.special) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }
    const idx = seq.findIndex(e => e.date === currentEntry.date);
    prevBtn.disabled = idx <= 0;
    nextBtn.disabled = idx >= seq.length - 1;
}

function main() {
    i18n.init();
    theme.init();

    /* 原链接跳转：仅 hero 入口（origin=1）显示；
       只绑定一次（修复语言切换重渲染导致监听器累积、一次点击开多窗） */
    const params = new URLSearchParams(location.search);
    const fromHero = params.get('origin') === '1';
    const originBtn = document.getElementById('view-origin');
    if (fromHero) {
        const openOriginal = () => window.open(ORIGIN_URL, '_blank', 'noopener');
        originBtn.addEventListener('click', openOriginal);
    } else {
        originBtn.hidden = true;
    }

    document.getElementById('view-back').addEventListener('click', () => {
        if (history.length > 1) history.back();
        else location.href = './';
    });

    /* 上一篇/下一篇：主题色可视化按钮（与键盘 ←/→ 共用逻辑） */
    document.getElementById('view-prev').addEventListener('click', () => step(-1));
    document.getElementById('view-next').addEventListener('click', () => step(1));
    updateNav();

    document.getElementById('btn-lang').addEventListener('click', () => {
        i18n.toggleLang();
        if (currentEntry) render(currentEntry);
    });

    /* 键盘翻页 */
    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') step(-1);
        else if (e.key === 'ArrowRight') step(1);
    });

    /* 阅读进度条 */
    const fill = document.getElementById('view-progress-fill');
    window.addEventListener('scroll', () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        fill.style.width = max > 0 ? `${(window.scrollY / max) * 100}%` : '0%';
    }, { passive: true });

    const want = params.get('date');
    const wantSpecial = params.get('special') === '1';

    loadManifest().then(manifest => {
        manifestList = manifest;
        /* special=1 → 特别记录；否则 → 当天主日志（默认，hero 进入） */
        const entry = wantSpecial
            ? manifest.find(e => e && e.date === want && e.special)
            : manifest.find(e => e && e.date === want && !e.special) || manifest[0];
        if (!entry) {
            document.getElementById('view-nasa-title').textContent = i18n.t('heroFallback');
            return;
        }
        currentEntry = entry;
        render(entry);
        updateNav();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}
