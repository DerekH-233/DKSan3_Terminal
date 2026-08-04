/* ============================================================
   DSU Terminal — 观测视图（二级页面）
   view.html?date=YYYY-MM-DD
   左侧：今日 NASA 大图 + 标题；右侧：观测日志 + 右下角原链接
   双语：标题/正文随界面语言；数据异常科幻化处理
   ============================================================ */

import * as theme from './theme.js?v=7.10';
import * as i18n from './i18n.js?v=7.10';

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

    /* 左侧：NASA 大图 */
    const media = document.getElementById('view-media');
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

function main() {
    i18n.init();
    theme.init();

    document.getElementById('view-back').addEventListener('click', () => {
        if (history.length > 1) history.back();
        else location.href = './';
    });

    document.getElementById('btn-lang').addEventListener('click', () => {
        i18n.toggleLang();
        const entry = currentEntry;
        if (entry) render(entry);
    });

    const params = new URLSearchParams(location.search);
    const want = params.get('date');

    loadManifest().then(manifest => {
        const entry = manifest.find(e => e && e.date === want) || manifest[0];
        if (!entry) {
            document.getElementById('view-nasa-title').textContent = i18n.t('heroFallback');
            return;
        }
        currentEntry = entry;
        render(entry);
    });
}

let currentEntry = null;

const ORIGIN_URL = 'https://apod.nasa.gov/apod/';

function main() {
    i18n.init();
    theme.init();

    /* 原链接跳转：只绑定一次（修复语言切换重渲染导致监听器累积、一次点击开多窗）；
       跳转入口仅保留右下角按钮，左栏大图点击不跳转 */
    const openOriginal = () => window.open(ORIGIN_URL, '_blank', 'noopener');
    document.getElementById('view-origin').addEventListener('click', openOriginal);

    document.getElementById('view-back').addEventListener('click', () => {
        if (history.length > 1) history.back();
        else location.href = './';
    });

    document.getElementById('btn-lang').addEventListener('click', () => {
        i18n.toggleLang();
        const entry = currentEntry;
        if (entry) render(entry);
    });

    const params = new URLSearchParams(location.search);
    const want = params.get('date');

    loadManifest().then(manifest => {
        const entry = manifest.find(e => e && e.date === want) || manifest[0];
        if (!entry) {
            document.getElementById('view-nasa-title').textContent = i18n.t('heroFallback');
            return;
        }
        currentEntry = entry;
        render(entry);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}
