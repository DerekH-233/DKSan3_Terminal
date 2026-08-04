/* ============================================================
   DSU Terminal — 今日观测影像（NASA APOD）
   数据直接取自 manifest.json 最新条目（无需额外 API 调用）
   支持：图片 / 视频 / 降级占位；标题随界面语言切换
   ============================================================ */

import { t, isZh } from './i18n.js?v=7.10';

const frame = document.getElementById('hero-frame');
const media = document.getElementById('hero-media');
const loading = document.getElementById('hero-loading');
const labelDate = document.getElementById('hero-date');
const labelTitle = document.getElementById('hero-title');
const labelSub = document.getElementById('hero-sub');

const isVideo = url => /\.(mp4|webm|mov)(\?|$)/i.test(url) || /youtube|youtu\.be/i.test(url);

/** 从 manifest 找到最近一张可用影像 */
export function init(manifestData) {
    const pool = Array.isArray(manifestData) ? manifestData : [];
    const entry = pool.find(l => l && l.img && l.img !== 'null' && isUsable(l.img)) || pool[0];

    if (!entry || !entry.img) {
        fail('NO_IMAGE_ARCHIVE');
        return;
    }

    labelDate.textContent = `[ ${entry.date || '----'} ]`;
    labelTitle.textContent = heroTitle(entry);
    labelSub.textContent = t('heroSub');

    /* 语言切换时刷新标题 */
    document.addEventListener('dsu:lang-change', () => {
        labelTitle.textContent = heroTitle(entry);
    });

    if (isVideo(entry.img)) {
        /* 视频影像：背景播放 + 点击外链 */
        const video = document.createElement('video');
        video.src = entry.img;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.autoplay = true;
        media.appendChild(video);
        video.play().catch(() => {});
        finish();
    } else {
        /* 图片：预加载成功后淡入 */
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
            media.style.backgroundImage = `url("${img.src}")`;
            finish();
        };
        img.onerror = () => fail('UPLINK_DEGRADED');
        img.src = entry.img;
    }

    /* 点击 → 站内二级页面（观测视图）：左大图 / 右阅读器 / 右下角原链接 */
    const openView = () => {
        location.href = `view.html?date=${encodeURIComponent(entry.date || '')}`;
    };
    media.addEventListener('click', openView);
    media.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openView(); }
    });
}

/**
 * hero 标题：今日影像区与 NASA 同步 —— 优先显示 NASA 今日标题（nasa_title，
 * AI 重构中文版 / NASA 原题英文版），无 NASA 文案时回退条目自身标题。
 */
function heroTitle(entry) {
    if (isZh()) return (entry.nasa_title && entry.nasa_title !== 'null') ? entry.nasa_title
        : (entry.title || t('heroFallback'));
    return (entry.nasa_title_en && entry.nasa_title_en !== 'null') ? entry.nasa_title_en
        : ((entry.title_en && entry.title_en !== 'null') ? entry.title_en
            : (entry.title || t('heroFallback')));
}

function finish() {
    loading.classList.add('done');
    labelTitle.style.opacity = '1';
}

function fail(msg) {
    loading.classList.add('done');
    media.style.background = 'radial-gradient(ellipse at 30% 20%, #0d1520 0%, #05080c 60%, #000 100%)';
    labelDate.textContent = '[ ---- ]';
    labelTitle.textContent = t('heroFallback');
    labelSub.textContent = `ERR:${msg}`;
}

function isUsable(url) {
    return typeof url === 'string' && !/youtube|youtu\.be/i.test(url);
}
