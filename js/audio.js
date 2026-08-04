/* ============================================================
   DSU Terminal — 背景音乐控制
   状态持久化；自动播放策略失败时静默降级
   ============================================================ */

import { t } from './i18n.js?v=7.8';

const KEY = 'dsu_bgm_v1';
let audio = null;
let btn = null;

export function init() {
    audio = document.getElementById('bgm');
    btn = document.getElementById('btn-bgm');
    if (!audio || !btn) return;

    audio.volume = 0.55;

    let enabled = true;
    try { enabled = localStorage.getItem(KEY) !== '0'; } catch (_) {}

    btn.addEventListener('click', () => toggle());
    btn.setAttribute('aria-pressed', String(enabled));

    /* 启动手势后尝试播放（用户在启动画面已交互，通常可放行） */
    if (enabled) {
        audio.play().then(() => render(true)).catch(() => render(false));
    } else {
        render(false);
    }

    /* 语言切换时更新按钮文本 */
    document.addEventListener('dsu:lang-change', () => render(!audio.paused));
}

export function toggle() {
    if (!audio) return;
    if (audio.paused) {
        audio.play().then(() => {
            render(true);
            try { localStorage.setItem(KEY, '1'); } catch (_) {}
        }).catch(() => render(false));
    } else {
        audio.pause();
        render(false);
        try { localStorage.setItem(KEY, '0'); } catch (_) {}
    }
}

function render(on) {
    btn.textContent = on ? t('btnBgmOn') : t('btnBgmOff');
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', String(on));
}

export function isPlaying() { return audio ? !audio.paused : false; }
