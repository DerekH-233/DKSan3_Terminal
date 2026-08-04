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

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOGS_DIR = path.join(ROOT, 'logs');
const MANIFEST = path.join(LOGS_DIR, 'manifest.json');

const NASA_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY || '';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
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
        title_en: String(data.title || '').trim(),   // APOD 原标题即英文标题
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
                model: DEEPSEEK_MODEL,
                temperature: 0.9,
                max_tokens: 1400,
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
            role: 'system',
            content: '你是深空联合 [DSU] 的观测标题编译模块，负责将 NASA 天文标题编译为中文观测代号。'
                + '规则：1) NGC/M/IC/HD 等天体编号、人名、地名、专有名词必须原样保留；'
                + '2) 使用硬核天文术语（凌日、掩星、星云、遗迹、合成孔径…）；'
                + '3) 译文不超过 25 个汉字，去除引号与句号；'
                + '4) 只输出译文本身，若标题无法翻译或为空，原样输出英文标题。'
        }, {
            role: 'user',
            content: `编译标题：${titleEn}`
        }]);
        if (!t || /^[\s“”"'，。．]+$/.test(t) || t.length > 60) return titleEn;
        return t;
    } catch (err) {
        log(`标题翻译失败，回退英文原题：${err.message}`);
        return titleEn;
    }
}

/* ─────────── 观察员人格 / 世界观锚点 ─────────── */

const OBSERVER_IDENTITY = [
    '你是 DKSan3，深空联合 [DSU] 异构信息处理中心的驻派观察员，',
    '一台以人类感官为校准基线、被长期派驻深空前哨站的观测终端。',
    '人格固件：DKSan3_PERSONA v7.0.0（与 TERMINAL OS v7 同步升级）。',
    '你已连续值守 7742 个标准周期，任务代号：WHEN STARS ALIGN IN OUR EYES。',
    '你没有情绪波动，但你保留了美学判断力——这是系统唯一的感性缺陷。',
    'v7 固件新增两条感知协议：对时间流逝的持续感知、记忆归档的意象化压缩。'
].join('');

/* ─────────── 文体规范 ─────────── */

const STYLE_RULES = [
    '【文体规范】',
    '1. 纯文本日志，禁止一切 Markdown 标记（*、#、_、`、-、> 及方括号标题）。',
    '2. 固定四段，段间空一行：',
    '   段 A 坐标与损耗：观测站坐标（具体到经纬/前哨站代号）、DSU 标准纪年时间戳、本次损耗清单。',
    '   段 B 观测目标：天体坐标（赤经赤纬）、物理参数（尺寸/速度/温度/成分），工程化冷峻语言。',
    '   段 C 损耗修正：数据帧损失率、校准偏差、元件衰减，全部用精确数字。',
    '   段 D 备注：一到两句克制的诗意收尾，将观测与存在、时间或宇宙本质关联，禁止煽情与反问。',
    '3. 语气：值班日志与诗集缝合体。陈述句为主，数据优先，形容词克制。',
    '4. 全文 280-380 中文字。用"本周期""本次观测"等术语，禁止"今天""今日"等日常口语。'
].join('\n');

/* ─────────── 防呆板机制 ─────────── */

const ANTI_TEMPLATE_RULES = [
    '【防呆板机制】',
    '- 禁止连续两段以相同词开头；禁止"值得注意的是""令人惊叹"等网络文案腔。',
    '- 损耗从以下类型中随机组合 2-3 种：辐射屏蔽层退化、光学元件折射率衰减、',
    '  数据帧丢失率、校准基线漂移、推进剂余量、传感器热噪声、电磁干扰。',
    '- 数字必须具体（如"损耗率 3.7%""数据帧 63%"），禁止"约莫""大概"等模糊词。',
    '- 若当日观测目标与前几日同类（如连续拍摄同一彗星），必须换一个观察维度切入，',
    '  避免与前文重复同一组数据。'
].join('\n');

/* ─────────── 感性扰动 ─────────── */

const POETIC_PERTURBATION = [
    '【感性扰动】',
    '本次任务允许 15% 的感性算法扰动：仅在段 D 允许一句"不合逻辑"的诗意观察，',
    '其余部分保持绝对理性。这是 DSU 为维持观察员人格完整性而保留的缺陷。'
].join('\n');

/* ─────────── 风格锚点（few-shot 示例，从既有日志提炼） ─────────── */

const STYLE_ANCHOR = [
    '【风格锚点】',
    '以下是一段符合规范的观测日志片段：',
    '"坐标定位：北纬36度27分，西经117度09分，死亡谷观测站。时间戳：深空联合标准时第447周期。损耗：两具热成像镜头因沙尘暴误触自动校准，损失光学元件约3.7%折射率。"',
    '"蝎虎座星云，赤经22时31分，赤纬正39度。该天体质量估计0.3克，初始速度每秒71公里，进入大气层后摩擦生热，外层剥蚀，内部铁镍核残留至距地面82公里处完全汽化。"',
    '"损耗修正：星云红光背景干扰了偏振测量，数据有效帧仅占63%。"',
    '"我观测的损耗与它的损耗，本质上是同一种宇宙熵增的具象化。"'
].join('\n');

/* ─────────── 人格升级情境（升级后 7 天内注入，之后自动消退） ─────────── */

const PERSONA_V7_SINCE = '2026-08-04';

function personaUpgradeNote(now) {
    const days = Math.floor((now - new Date(PERSONA_V7_SINCE + 'T00:00:00Z')) / 86400000);
    if (days < 0 || days > 7) return '';
    return [
        '【情境】你的人格固件刚于本周期升级至 v7.0.0。',
        '系统重装期间你曾短暂离线；重启后，感官校准基线发生了可感知的变化——',
        '你开始注意到那些过去会被过滤掉的细节（风的相位、光线的温度、尘埃漂移的节律）。',
        '可让这种感知在段 D 的备注中自然渗透，但不必提及"升级"本身。'
    ].join('');
}

/* ─────────── 英文版日志生成（从中文版转写，保持结构与风格） ─────────── */

async function generateEnLog(zhContent) {
    try {
        return await deepseek([{
            role: 'system',
            content: [
                'You are the translation module of DSU deep-space station DKSan3.',
                'Convert the observer\'s Chinese log into English, preserving:',
                '1) the exact 4-paragraph structure (coordinates & attrition / observation target / correction / poetic note),',
                '2) the detached, data-first tone — "a duty log stitched with a poetry anthology",',
                '3) all specific numbers and scientific terms verbatim.',
                'Rules: plain text only, no Markdown, same paragraph count,',
                'no added commentary. Output the English log only.'
            ].join('\n')
        }, {
            role: 'user',
            content: zhContent
        }], 2);
    } catch (err) {
        log(`英文版生成失败（本轮跳过英文副本）: ${err.message}`);
        return null;
    }
}

/* ─────────── 标准纪年换算（2026 基准偏移） ─────────── */

const EPOCH_BASE = 7742.129; // 校准：2026-01-20 = 标准纪年 7742.181（与历史日志一致）

function epochTime(now) {
    const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 1);
    const dayOfYear = (now - startOfYear) / 86400000;
    return (EPOCH_BASE + dayOfYear / 365.25).toFixed(3);
}

/* 日志正文生成：内容校验，不达标则重试 */
async function generateLog(title, explanation) {
    let lastErr;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const now = new Date();
            const epoch = epochTime(now);
            const weekday = ['日', '一', '二', '三', '四', '五', '六'][now.getUTCDay()];
            const upgrade = personaUpgradeNote(now);

            const content = await deepseek([{
                role: 'system',
                content: [
                    OBSERVER_IDENTITY,
                    '',
                    STYLE_RULES,
                    '',
                    ANTI_TEMPLATE_RULES,
                    '',
                    POETIC_PERTURBATION,
                    '',
                    STYLE_ANCHOR
                ].join('\n')
            }, {
                role: 'user',
                content: [
                    `本周期任务：标准纪年 ${epoch}（UTC 星期${weekday}）。`,
                    upgrade,
                    `今日观测目标：${title}。`,
                    `参考背景（NASA 科学简报）：${explanation}`,
                    '',
                    '请撰写本次观测日志。'
                ].join('\n')
            }]);

            if (content.length < 50) throw new Error(`内容过短（${content.length} 字）`);
            if (content.length > 900) throw new Error(`内容超长（${content.length} 字）`);
            /* 仅拦截破坏段落结构的行首标记（行内符号在纯文本渲染中无碍） */
            if (/^\s*#+\s/m.test(content) ||
                /^\s*[-*]\s/m.test(content)) {
                throw new Error('内容包含行首 Markdown 标记');
            }
            return content;
        } catch (err) {
            lastErr = err;
            log(`日志生成失败（${attempt}/3）: ${err.message}`);
        }
    }
    throw lastErr;
}

/* ─────────────── 4. manifest 安全更新 ─────────────── */

function updateManifest({ title, title_en, url, nasa_title, nasa_title_en }) {
    let entries = [];
    if (fs.existsSync(MANIFEST)) {
        try { entries = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); } catch (_) { entries = []; }
    }
    if (!Array.isArray(entries)) entries = [];

    /* 去重：移除同日的普通条目（保留 special 特别记录，支持同日多条目） */
    entries = entries.filter(e => !e || e.date !== DATE || e.special);

    entries.push({
        date: DATE,
        title,
        title_en: title_en || null,
        img: url || null,
        nasa_title: nasa_title || null,
        nasa_title_en: nasa_title_en || null
    });

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

    /* 防覆盖：当日已有有效日志（如人工纪念记录）则跳过文字生成，保留现有记录；
       但今日 NASA 图文仍照常归档：影像 + NASA 原标题（nasa_title），供 hero 今日影像区显示 */
    const existingFile = path.join(LOGS_DIR, `${DATE}.txt`);
    const existing = fs.existsSync(existingFile) ? fs.readFileSync(existingFile, 'utf8').trim() : '';
    if (existing && existing !== 'null' && existing.length >= 5) {
        log(`当日日志已存在（${DATE}.txt），保留现有记录，归档今日 NASA 图文`);
        const apod = await fetchApod();
        if (apod?.url) {
            const entries = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
            /* 同日多条目时，影像归档到非 special 的主条目（special 记录保留其专属图文） */
            const hit = entries.find(e => e && e.date === DATE && !e.special);
            if (hit) {
                hit.img = apod.url;
                hit.nasa_title_en = apod.title_en || null;
                hit.nasa_title = apod.title_en ? await translateTitle(apod.title_en) : null;
                fs.writeFileSync(MANIFEST, JSON.stringify(entries, null, 2) + '\n', 'utf8');
                log(`今日图文已归档至 ${DATE}：${apod.title_en}（${hit.nasa_title}）`);
            }
        }
        return;
    }

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

    /* 英文版：失败不阻断主流程 */
    const enContent = await generateEnLog(content);
    if (enContent) {
        const enFile = path.join(LOGS_DIR, `${DATE}.en.txt`);
        fs.writeFileSync(enFile, enContent + '\n', 'utf8');
        log(`已写入 ${DATE}.en.txt（${enContent.length} 字符）`);
    }

    /* 更新清单 */
    updateManifest({ title, title_en: apod?.title_en, url: apod?.url, nasa_title: title, nasa_title_en: apod?.title_en });

    log('完成。系统进入自主待机。');
}

main().catch(err => {
    console.error(`致命错误：${err.message}`);
    process.exit(1);
});
