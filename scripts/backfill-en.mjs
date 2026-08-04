#!/usr/bin/env node
/* ============================================================
   DSU 历史日志英文版回填器
   一次性任务：为 archive 中所有缺少英文副本的日志生成：
     1. 英文标题（title_en）— 写入 manifest
     2. 英文正文（YYYY-MM-DD.en.txt）— 写入日志目录
   幂等：已有英文副本的条目自动跳过，可重复运行
   用法：DEEPSEEK_KEY=xxx node scripts/backfill-en.mjs
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOGS_DIR = path.join(ROOT, 'logs');
const MANIFEST = path.join(LOGS_DIR, 'manifest.json');

const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY || '';
const CONCURRENCY = 4;      // 并发数
const BAD = new Set(['null', '空值', 'none', 'undefined', '']);

const log = (...args) => console.log(`[backfill]`, ...args);

async function deepseek(messages, retries = 4) {
    if (!DEEPSEEK_KEY) throw new Error('缺少 DEEPSEEK_KEY');
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 45000);
            const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DEEPSEEK_KEY}`
                },
                body: JSON.stringify({
                    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
                    temperature: 0.8,
                    max_tokens: 1400,
                    messages
                }),
                signal: ctrl.signal
            });
            clearTimeout(timer);
            /* 503/429 为暂时性过载，指数退避重试 */
            if (res.status === 503 || res.status === 429) {
                throw new Error(`HTTP ${res.status} (overloaded)`);
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const content = data?.choices?.[0]?.message?.content;
            if (!content) throw new Error('空响应');
            return content.trim();
        } catch (err) {
            const delay = 5000 * attempt + Math.random() * 3000;
            log(`API 调用失败（${attempt}/${retries}）: ${err.message}，${Math.round(delay / 1000)}s 后重试`);
            if (attempt < retries) await new Promise(r => setTimeout(r, delay));
            if (attempt === retries) throw err;
        }
    }
}

/* ─────────── 英文标题（天文规范） ─────────── */

async function enTitle(zhTitle) {
    const t = await deepseek([{
        role: 'system',
        content: 'You are the translation module of DSU. Convert this Chinese astronomical observation '
            + 'title into concise, technical English. Keep NGC/M/IC/HD catalog numbers, names, and '
            + 'proper nouns as-is. Output only the title, no quotes, no period, max 60 chars.'
    }, {
        role: 'user',
        content: zhTitle
    }]);
    if (!t || t.length > 80) throw new Error('译文异常');
    return t;
}

/* ─────────── 英文正文（保持四段结构与风格） ─────────── */

async function enLog(zhContent) {
    const t = await deepseek([{
        role: 'system',
        content: 'You are the translation module of DSU deep-space station DKSan3. Convert the '
            + 'observer\'s Chinese log into English, preserving: 1) the exact paragraph structure '
            + '(coordinates & attrition / observation target / correction / poetic note), 2) the '
            + 'detached, data-first tone, 3) all numbers and scientific terms verbatim. Plain text '
            + 'only, no Markdown, no added commentary. Output the English log only.'
    }, {
        role: 'user',
        content: zhContent
    }], 3);
    if (t.length < 50) throw new Error('译文过短');
    if (/[#*_`]/.test(t)) throw new Error('包含 Markdown 标记');
    return t;
}

/* ─────────── 并发池 ─────────── */

async function mapLimit(items, limit, worker) {
    const results = new Array(items.length);
    let next = 0;
    async function run() {
        while (next < items.length) {
            const i = next++;
            try { results[i] = await worker(items[i], i); }
            catch (err) { results[i] = { error: err }; }
        }
    }
    const workers = Array.from({ length: Math.min(limit, items.length) }, run);
    await Promise.all(workers);
    return results;
}

/* ─────────── 主流程 ─────────── */

async function main() {
    if (!DEEPSEEK_KEY) {
        console.error('缺少 DEEPSEEK_KEY 环境变量');
        process.exit(1);
    }
    if (!fs.existsSync(MANIFEST)) {
        console.error('未找到 manifest.json');
        process.exit(1);
    }

    const entries = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    if (!Array.isArray(entries)) { console.error('manifest 格式异常'); process.exit(1); }

    /* 待回填清单 */
    const todo = [];
    for (const e of entries) {
        if (!e || !e.date) continue;
        const needTitle = !e.title_en || BAD.has(String(e.title_en).trim().toLowerCase());
        const enPath = path.join(LOGS_DIR, `${e.date}.en.txt`);
        const zhPath = path.join(LOGS_DIR, `${e.date}.txt`);
        const needBody = !fs.existsSync(enPath) && fs.existsSync(zhPath);
        if (needTitle || needBody) todo.push({ e, needTitle, needBody });
    }

    log(`共 ${entries.length} 条记录，待回填 ${todo.length} 条（标题 ${todo.filter(t => t.needTitle).length} / 正文 ${todo.filter(t => t.needBody).length}）`);

    let done = 0, failed = 0;

    await mapLimit(todo, CONCURRENCY, async ({ e, needTitle, needBody }) => {
        const zhTitle = String(e.title || '').trim();
        try {
            /* 标题回填 */
            if (needTitle) {
                if (BAD.has(zhTitle.toLowerCase())) {
                    e.title_en = null;
                } else {
                    e.title_en = await enTitle(zhTitle);
                    log(`标题 ${e.date}: "${zhTitle}" → "${e.title_en}"`);
                }
            }
            /* 正文回填 */
            if (needBody) {
                const zhContent = fs.readFileSync(path.join(LOGS_DIR, `${e.date}.txt`), 'utf8').trim();
                if (zhContent.length < 50) {
                    log(`跳过 ${e.date}：原文过短（${zhContent.length} 字）`);
                } else {
                    const en = await enLog(zhContent);
                    fs.writeFileSync(path.join(LOGS_DIR, `${e.date}.en.txt`), en + '\n', 'utf8');
                    log(`正文 ${e.date}.en.txt 已写入（${en.length} 字符）`);
                }
            }
            done++;
        } catch (err) {
            failed++;
            console.error(`回填失败 ${e.date}: ${err.message}`);
        }
        if ((done + failed) % 10 === 0) log(`进度 ${done + failed}/${todo.length}`);
    });

    /* 写回 manifest */
    fs.writeFileSync(MANIFEST, JSON.stringify(entries, null, 2) + '\n', 'utf8');
    log(`完成：成功 ${done}，失败 ${failed}。manifest 已更新。`);
}

main().catch(err => {
    console.error(`致命错误：${err.message}`);
    process.exit(1);
});
