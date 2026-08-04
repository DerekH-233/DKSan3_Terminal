/* ============================================================
   DSU Terminal — 今日观测影像（NASA APOD）
   数据直接取自 manifest.json 最新条目（无需额外 API 调用）
   支持：图片 / 视频 / 降级占位
   ============================================================ */

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
    labelTitle.textContent = entry.title || '未知天体';
    labelSub.textContent = 'NASA_APOD // DAILY_UPLINK';

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

    /* 点击 → NASA 原始页面 */
    const openNasa = () => window.open('https://apod.nasa.gov/apod/', '_blank', 'noopener');
    media.addEventListener('click', openNasa);
    media.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openNasa(); }
    });
}

function finish() {
    loading.classList.add('done');
    labelTitle.style.opacity = '1';
}

function fail(msg) {
    loading.classList.add('done');
    media.style.background = 'radial-gradient(ellipse at 30% 20%, #0d1520 0%, #05080c 60%, #000 100%)';
    labelDate.textContent = '[ ---- ]';
    labelTitle.textContent = '信号失真 // 影像无法同步';
    labelSub.textContent = `ERR:${msg}`;
}

function isUsable(url) {
    return typeof url === 'string' && !/youtube|youtu\.be/i.test(url);
}
