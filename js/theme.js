/* ============================================================
   DSU Terminal — 主题系统
   4 套主题：CLASSIC / AURORA / BLOOD / GHOST
   持久化于 localStorage，CSS 变量切换
   ============================================================ */

const THEMES = ['classic', 'aurora', 'blood', 'ghost'];
const STORE_KEY = 'dsu_theme_v1';

let current = 'classic';

/** 应用主题 */
export function set(name) {
    const t = THEMES.includes(name) ? name : 'classic';
    current = t;
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem(STORE_KEY, t); } catch (_) { /* 隐私模式忽略 */ }
    /* 广播主题变更，供依赖主题色的动态内容（愉悦星球插画等）重绘 */
    document.dispatchEvent(new CustomEvent('dsu:theme-change'));
}

/** 循环到下一套主题 */
export function cycle() {
    const i = THEMES.indexOf(current);
    set(THEMES[(i + 1) % THEMES.length]);
    return current;
}

/** 初始化：读取持久化主题 */
export function init() {
    let saved = 'classic';
    try { saved = localStorage.getItem(STORE_KEY) || 'classic'; } catch (_) { /* 忽略 */ }
    set(saved);
    return current;
}

export function get() { return current.toUpperCase(); }
