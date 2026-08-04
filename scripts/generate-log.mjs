#!/usr/bin/env node
/* ============================================================
   DSU 自主日志生成器 v2
   每日由 GitHub Actions 调用：
     1. 拉取 NASA APOD（支持重试，失败不中断）
     2. DeepSeek 翻译标题（失败回退英文原题）
     3. DeepSeek 生成观测日志（失败重试，内容校验）
     4. 安全更新 logs/manifest.json（去重 / 排序 / 保留影像）
   运行环境：Node 18+（GitHub Actions runner 内置）
   ============================================================ */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const LOGS_DIR = path.join(ROOT, 'logs');
const MANIFEST = path.join(LOGS_DIR, 'manifest.json');

const NASA_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY || '';
const DATE = new Date().toISOString().slice(0, 10);

const log = (...args) => console.log(`[${new Date().toISOString()}]`, ...args);

/* ─────────────── 工具：带重试的 fetch ─────────────── */

async function fetchJSON(url, opts = {}, retries = 3) {
    let lastErr;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 25000);
            const res = await fetch(url, { ...opts, signal: ctrl.signal });
            clearTimeout(timer);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            lastErr = err;
            log(`请求失败（${attempt}/${retries}）: ${err.message}`);
            if (attempt < retries) await new Promise(r => setTimeout(r, 3000 * attempt));
        }
    }
    throw lastErr;
}

/* ─────────────── 1. NASA APOD ─────────────── */

async function fetchApod() {
    try {
        const data = await fetchJSON(
            `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(NASA_KEY)}`
        );
        return {
            title: String(data.title || '').trim(),
            explanation: String(data.explanation || '').trim().slice(0, 600),
            url: String(data.url || '').trim(),
            date: String(data.date || DATE)
        };
    } catch (err) {
        log(`NASA APOD 拉取失败：${err.message}（本轮沿用缓存影像）`);
        return null;
    }
}

/* ─────────────── 2/3. DeepSeek 调用 ─────────────── */

async function deepseek(messages, retries = 2) {
    if (!DEEPSEEK_KEY) throw new Error('缺少 DEEPSEEK_KEY');
    const data = await fetchJSON(
        'https://api.deepseek.com/v1/chat/completions',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                temperature: 0.9,
                max_tokens: 1200,
                messages
            })
        },
        retries
    );
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('DeepSeek 返回空内容');
    return content.trim();
}

/* 标题翻译：失败回退英文原题 */
async function translateTitle(titleEn) {
    try {
        const t = await deepseek([{
            role: 'user',
            content: `将这个天文观测标题翻译成简洁硬核的中文，只输出翻译结果，不要标点符号以外的任何内容：${titleEn}`
        }]);
        if (/^[\s“”"'，。]+$/.test(t) || t.length > 60) return titleEn;
        return t;
    } catch (err) {
        log(`标题翻译失败，回退英文原题：${err.message}`);
        return titleEn;
    }
}

/* 日志正文生成：内容校验，不达标则重试 */
async function generateLog(title, explanation) {
    let lastErr;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const content = await deepseek([{
                role: 'system',
                content: '你是一个名为 DKSan3 的深空观察员，隶属于深空联合 (DSU)。语气冷酷、克制。'
                    + '日志采用纯文本格式，包含：坐标定位、时间戳、观测目标、观测摘要、系统损耗、备注。'
                    + '禁止出现星号 *、井号 #、下划线 _ 等 Markdown 标记。'
            }, {
                role: 'user',
                content: `今日观测目标: ${title}。参考背景: ${explanation}。`
                    + '撰写约 300 字的中文观测日志，必须包含坐标与损耗描述。'
            }]);

            if (content.length < 50) throw new Error(`内容过短（${content.length} 字）`);
            if (/[#*_`]/.test(content)) throw new Error('内容包含 Markdown 标记');
            return content;
        } catch (err) {
            lastErr = err;
            log(`日志生成失败（${attempt}/3）: ${err.message}`);
        }
    }
    throw lastErr;
}

/* ─────────────── 4. manifest 安全更新 ─────────────── */

function updateManifest({ title, url }) {
    let entries = [];
    if (fs.existsSync(MANIFEST)) {
        try { entries = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); } catch (_) { entries = []; }
    }
    if (!Array.isArray(entries)) entries = [];

    /* 去重：以日期为准 */
    entries = entries.filter(e => e && e.date !== DATE);

    entries.push({ date: DATE, title, img: url || null });

    /* 倒序（最新在前）+ 截断到 400 条，防止仓库无限膨胀 */
    entries.sort((a, b) => (a.date < b.date ? 1 : -1));
    entries = entries.slice(0, 400);

    fs.writeFileSync(MANIFEST, JSON.stringify(entries, null, 2) + '\n', 'utf8');
    log(`manifest 已更新：${entries.length} 条记录`);
}

/* ─────────────── 主流程 ─────────────── */

async function main() {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
    log(`DSU 日志生成器 v2 启动 | 日期 ${DATE}`);

    const apod = await fetchApod();

    /* 标题：翻译失败用英文原题，NASA 失败用占位 */
    let title = apod ? await translateTitle(apod.title) : '信号中断记录';
    if (title === 'null' || !title) title = apod?.title || '信号中断记录';

    /* 日志正文（核心交付物，失败则本轮中止） */
    let content;
    try {
        content = await generateLog(title, apod?.explanation || '今日影像信息缺失，请基于通用天文观测撰写。');
    } catch (err) {
        console.error(`日志生成失败，本轮中止：${err.message}`);
        process.exit(1);
    }

    /* 写入日志文件 */
    const file = path.join(LOGS_DIR, `${DATE}.txt`);
    fs.writeFileSync(file, content + '\n', 'utf8');
    log(`已写入 ${DATE}.txt（${content.length} 字）`);

    /* 更新清单 */
    updateManifest({ title, url: apod?.url });

    log('完成。系统进入自主待机。');
}

main().catch(err => {
    console.error(`致命错误：${err.message}`);
    process.exit(1);
});
