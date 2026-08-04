/* ============================================================
   DSU Terminal — 国际化系统
   语言检测：zh-CN → 中文；其余（含 zh-HK / zh-TW / 繁中）→ 英文
   优先级：用户手动选择（localStorage）> 浏览器语言检测
   切换时广播 dsu:lang-change 事件，各模块重绘
   ============================================================ */

const ZH = {
    /* Boot */
    bootTitle: 'DEEP_SPACE_UNION // TERMINAL OS v7.0',
    'boot.mem': 'MEMORY CHECK',
    'boot.optical': 'OPTICAL ARRAY',
    'boot.lens': 'SPECTRAL LENS',
    'boot.uplink': 'DSU UPLINK',
    'boot.persona': 'PERSONA FIRMWARE',
    'boot.core': 'NEURAL CORE',
    'boot.apod': 'NASA APOD SYNC',
    'boot.grid': 'OBSERVATION GRID',
    'boot.scan': 'SCANLINE FILTER',
    'boot.bgm': 'BGM RELAY',
    bootEnter: '欢迎，观察员。系统已就绪。按 [ ENTER ] 进入观测哨',

    /* Ticker */
    ticker1: 'WE ARE BORN TO LOOK UP // 我们生而眺望',
    ticker2: 'NODE: STABLE // MISSION: WHEN STARS ALIGN IN OUR EYES',
    ticker3: 'AUTONOMOUS MODE // 每日日志由 AI 生成，直至信号消失',
    ticker4: 'SIGNAL LOST IN THE BACKGROUND NOISE // SOON',

    /* Hero */
    heroLoading: 'UPLINK_SYNC',
    heroSub: 'NASA_APOD // DAILY_UPLINK',
    heroFallback: '信号失真 // 影像无法同步',
    heroErr: 'ERR:NO_IMAGE_ARCHIVE',
    heroErrDegraded: 'ERR:UPLINK_DEGRADED',

    /* 日志区 */
    sectionLogs: '[ MISSION_LOGS ]',
    searchPlaceholder: 'SEARCH / 查找',
    waitingSignal: '▌ 等待信号同步…',
    waitingSignalLost: '▌ 上行链路中断，等待信号同步…',
    noMatch: '∅ 无匹配记录：',
    endOfTransmission: '— END_OF_TRANSMISSION —',
    noTitle: '【 未命名记录 】信号载体损坏',
    degradedTitle: '【 信号失真 】观测记录标题未能解码',

    /* 阅读器 */
    logRecord: 'LOG_RECORD',
    close: '[X] CLOSE',
    prev: '◄ PREV',
    next: 'NEXT ►',
    readerMissing: '[ 记录缺失：该日志段未能归档。 ]',
    readerLinkDown: '[ 上行链路中断：无法取回记录段。 ]',
    readerCorrupt: '【 信号失真 】本周期观测数据未能归档。',
    enNotAvailable: '[ NOTE ] 该档案尚无英文副本，以下为原始记录。',

    /* 侧栏 */
    sysTitle: 'SYSTEM',
    sysNode: 'NODE',
    sysPersona: 'PERSONA',
    sysMission: 'MISSION',
    sysProtocol: 'PROTOCOL',
    sysUptime: 'UPTIME',
    sysLogs: 'LOGS',
    sysSync: 'LAST_SYNC',
    ctlTitle: 'CONTROLS',
    btnBgmOn: '■ BGM_SIGNAL',
    btnBgmOff: '▶ BGM_SIGNAL',
    btnTheme: '◈ THEME',
    btnCmd: '❯ TERMINAL',
    linkTitle: 'UPLINKS',
    linkSource: '◈ SOURCE_CODE',
    linkApod: '◈ NASA_APOD',
    panelNote: '系统处于自主模式。日志由 AI 每日生成，本站仅为一座被抛入深空的观测哨——它传回的每一段碎碎念，都终将消失在背景噪音里。',

    /* 分页器 */
    pagePrev: '◄ PREV',
    pageNext: 'NEXT ►',

    /* 终端 */
    termHelpHead: '命令集 [ COMMANDS ]',
    termHelpTip: '提示：输入时按 TAB 可自动补全',
    cmdHelp: '显示本帮助',
    cmdLogs: '列出最近 n 条日志（默认 10）',
    cmdOpen: '打开指定日期日志，如 open 2026-08-03',
    cmdSearch: '搜索日志并聚焦结果',
    cmdSearchName: 'search <词>',
    cmdEchoName: 'echo <文本>',
    cmdApod: '滚动至今日观测影像',
    cmdStatus: '系统遥测状态',
    cmdTheme: '切换主题：classic/aurora/blood/ghost',
    cmdBgm: '切换背景音乐',
    cmdWhoami: '操作员身份',
    cmdPing: '链路延迟测试',
    cmdDate: '时间 / 运行时长',
    cmdEcho: '终端回显',
    cmdHistory: '命令历史',
    cmdClear: '清空终端输出',
    cmdAbout: '关于与外部链路',
    termUsageOpen: '用法：open <date>，如 open 2026-08-03',
    termNotFound: '未找到记录：{date}',
    termReading: '正在读取 {date} …',
    termUsageSearch: '用法：search <关键词>',
    termSearchHit: '搜索 "{q}"：命中 {n} 条',
    termApodLoc: '已定位至今日影像上行区。',
    termStatusHead: '—— 系统遥测 [ STATUS ] ——',
    termStatusNode: '节点',
    termStatusProtocol: '协议',
    termStatusPersona: '人格固件',
    termStatusLink: '链路',
    termStatusUp: 'UPLINK OK',
    termStatusDown: 'OFFLINE',
    termStatusLogs: '日志归档',
    termStatusMem: '设备内存',
    termStatusRender: '渲染响应',
    termThemeSet: '主题已切换：{t}',
    termThemeCur: '当前主题：{t}（可用：classic / aurora / blood / ghost）',
    termBgm: 'BGM 信号：{s}',
    termBgmOn: '已接入',
    termBgmOff: '已切断',
    termWhoami1: 'DKSan3 — 深空联合 [DSU] 异构信息处理中心驻派观察员',
    termWhoami2: '人格固件：DKSan3_PERSONA v7.0.0（本周期完成升级）',
    termWhoami3: '职责：凝视深空，记录损耗，保持眺望。',
    termWhoami4: '新增感知协议：时间流逝感知 / 记忆意象化压缩。',
    termPing: 'pong — DSU 中继链路 {ms}ms，信号 {sig}%',
    termDateLocal: '本地时间：{t}',
    termDateUtc: 'UTC 时间：{t}',
    termUptime: '本会话已运行 {t}',
    termHistoryEmpty: '（暂无命令历史）',
    termAbout1: 'DKSan3_Terminal — 一座被抛入深空的观测哨。',
    termAbout2: '工业机能美学 · AI 自主日志 · NASA 每日影像同步。',
    termAbout3: '代码开源：github.com/DerekH-233/DKSan3_Terminal',
    termUnknown: '未知指令 "{c}"。键入 help 查看指令集。',
    termErr: '命令执行异常：{c}',
    termWelcome: '键入 help 查看指令集。',
    termLogsHead: '最近 {n} 条观测记录 [ 共 {total} 条 ]',
    termLogsTip: '使用 open <date> 读取完整记录。',
    termComplete: '补全候选：{c}',
    cmdPlaceholder: '输入命令，键入 help 查看指令集…',

    /* 页脚 */
    footLine: '© 2026 TERMINAL_SYSTEM // DKSan3',
    footSub: 'DEEP_SPACE_UNION // 工业机能美学 // WE ARE BORN TO LOOK UP',

    /* 时间链 */
    tcRecords: '{month} · {count} 条记录',

    /* 打字机 */
    tw1: '>> 初始化深空终端...',
    tw2: '>> 识别操作员: DKSan3',
    tw3: '>> 目标锁定: 我们生而眺望',

    /* 小字 */
    mainSub: '隶属于深空联合 [DSU] / 异构信息处理中心',
    heroInitial: '观测信号同步中…',
    signalTitle: '信号强度',
    localTimeTitle: '本地时间',
    bootAria: '系统启动',
    siteTitleAria: '站点标题',
    heroAria: '今日观测影像',
    heroMediaAria: '打开 NASA 今日影像页面',
    logsAria: '任务日志',
    telemetryAria: '系统遥测',
    themeAria: '切换主题',
    cmdAria: '打开命令终端',
    tcAria: '时间链导航',
    readerAria: '日志阅读',
    cmdBarAria: '命令输入',

    /* 语言按钮 */
    langBtn: 'EN',

    /* 观测视图 */
    back: '◄ BACK'
};

const EN = {
    /* Boot */
    bootTitle: 'DEEP_SPACE_UNION // TERMINAL OS v7.0',
    'boot.mem': 'MEMORY CHECK',
    'boot.optical': 'OPTICAL ARRAY',
    'boot.lens': 'SPECTRAL LENS',
    'boot.uplink': 'DSU UPLINK',
    'boot.persona': 'PERSONA FIRMWARE',
    'boot.core': 'NEURAL CORE',
    'boot.apod': 'NASA APOD SYNC',
    'boot.grid': 'OBSERVATION GRID',
    'boot.scan': 'SCANLINE FILTER',
    'boot.bgm': 'BGM RELAY',
    bootEnter: 'Welcome, observer. System ready. Press [ ENTER ] to enter the watchtower',

    /* Ticker */
    ticker1: 'WE ARE BORN TO LOOK UP',
    ticker2: 'NODE: STABLE // MISSION: WHEN STARS ALIGN IN OUR EYES',
    ticker3: 'AUTONOMOUS MODE // DAILY LOGS GENERATED BY AI UNTIL SIGNAL LOST',
    ticker4: 'SIGNAL LOST IN THE BACKGROUND NOISE // SOON',

    /* Hero */
    heroLoading: 'UPLINK_SYNC',
    heroSub: 'NASA_APOD // DAILY_UPLINK',
    heroFallback: 'SIGNAL CORRUPTED // IMAGE UNAVAILABLE',
    heroErr: 'ERR:NO_IMAGE_ARCHIVE',
    heroErrDegraded: 'ERR:UPLINK_DEGRADED',

    /* 日志区 */
    sectionLogs: '[ MISSION_LOGS ]',
    searchPlaceholder: 'SEARCH',
    waitingSignal: '▌ SYNCING SIGNAL…',
    waitingSignalLost: '▌ UPLINK SEVERED, AWAITING SIGNAL…',
    noMatch: '∅ NO MATCH FOR:',
    endOfTransmission: '— END_OF_TRANSMISSION —',
    noTitle: '[ UNNAMED RECORD ] CORRUPTED CARRIER',
    degradedTitle: '[ SIGNAL DISTORTED ] TITLE DECODE FAILED',

    /* 阅读器 */
    logRecord: 'LOG_RECORD',
    close: '[X] CLOSE',
    prev: '◄ PREV',
    next: 'NEXT ►',
    readerMissing: '[ RECORD MISSING: THIS LOG SEGMENT WAS NEVER ARCHIVED. ]',
    readerLinkDown: '[ UPLINK SEVERED: RECORD SEGMENT UNRETRIEVABLE. ]',
    readerCorrupt: '[ SIGNAL DISTORTED ] THIS CYCLE OBSERVATION DATA WAS NOT ARCHIVED.',
    enNotAvailable: '[ NOTE ] NO ENGLISH ARCHIVE YET — SHOWING ORIGINAL RECORD.',

    /* 侧栏 */
    sysTitle: 'SYSTEM',
    sysNode: 'NODE',
    sysPersona: 'PERSONA',
    sysMission: 'MISSION',
    sysProtocol: 'PROTOCOL',
    sysUptime: 'UPTIME',
    sysLogs: 'LOGS',
    sysSync: 'LAST_SYNC',
    ctlTitle: 'CONTROLS',
    btnBgmOn: '■ BGM_SIGNAL',
    btnBgmOff: '▶ BGM_SIGNAL',
    btnTheme: '◈ THEME',
    btnCmd: '❯ TERMINAL',
    linkTitle: 'UPLINKS',
    linkSource: '◈ SOURCE_CODE',
    linkApod: '◈ NASA_APOD',
    panelNote: 'The system runs in autonomous mode. Logs are generated daily by AI. This station is merely a watchtower cast into deep space — every murmur it relays will eventually dissolve into background noise.',

    /* 分页器 */
    pagePrev: '◄ PREV',
    pageNext: 'NEXT ►',

    /* 终端 */
    termHelpHead: 'COMMANDS',
    termHelpTip: 'TIP: PRESS TAB TO AUTO-COMPLETE',
    cmdHelp: 'Show this help',
    cmdLogs: 'List recent n logs (default 10)',
    cmdOpen: 'Open a log by date, e.g. open 2026-08-03',
    cmdSearch: 'Search logs and focus results',
    cmdSearchName: 'search <query>',
    cmdEchoName: 'echo <text>',
    cmdApod: 'Jump to today\'s observation image',
    cmdStatus: 'System telemetry',
    cmdTheme: 'Switch theme: classic/aurora/blood/ghost',
    cmdBgm: 'Toggle background music',
    cmdWhoami: 'Operator identity',
    cmdPing: 'Link latency test',
    cmdDate: 'Time / uptime',
    cmdEcho: 'Echo text',
    cmdHistory: 'Command history',
    cmdClear: 'Clear terminal output',
    cmdAbout: 'About and external links',
    termUsageOpen: 'USAGE: open <date>, e.g. open 2026-08-03',
    termNotFound: 'RECORD NOT FOUND: {date}',
    termReading: 'RETRIEVING {date} …',
    termUsageSearch: 'USAGE: search <keyword>',
    termSearchHit: 'SEARCH "{q}": {n} HITS',
    termApodLoc: 'LOCKED ON TO TODAY\'S UPLINK SECTOR.',
    termStatusHead: '—— TELEMETRY [ STATUS ] ——',
    termStatusNode: 'NODE',
    termStatusProtocol: 'PROTOCOL',
    termStatusPersona: 'PERSONA',
    termStatusLink: 'UPLINK',
    termStatusUp: 'UPLINK OK',
    termStatusDown: 'OFFLINE',
    termStatusLogs: 'ARCHIVE',
    termStatusMem: 'DEVICE',
    termStatusRender: 'RENDER',
    termThemeSet: 'THEME SET: {t}',
    termThemeCur: 'CURRENT THEME: {t} (classic / aurora / blood / ghost)',
    termBgm: 'BGM SIGNAL: {s}',
    termBgmOn: 'ONLINE',
    termBgmOff: 'SEVERED',
    termWhoami1: 'DKSan3 — Resident Observer, DSU Heterogeneous Information Processing Center',
    termWhoami2: 'PERSONA FIRMWARE: DKSan3_PERSONA v7.0.0 (UPGRADED THIS CYCLE)',
    termWhoami3: 'DUTY: GAZE INTO DEEP SPACE, RECORD ATTRITION, KEEP LOOKING UP.',
    termWhoami4: 'NEW SENSE PROTOCOLS: TIME PERCEPTION / IMAGERY COMPRESSION OF MEMORY.',
    termPing: 'pong — DSU RELAY {ms}ms, SIGNAL {sig}%',
    termDateLocal: 'LOCAL TIME: {t}',
    termDateUtc: 'UTC TIME: {t}',
    termUptime: 'SESSION ACTIVE FOR {t}',
    termHistoryEmpty: '(NO COMMAND HISTORY)',
    termAbout1: 'DKSan3_Terminal — A watchtower cast into deep space.',
    termAbout2: 'INDUSTRIAL FUNCTIONALISM · AI AUTONOMOUS LOGS · NASA DAILY IMAGERY.',
    termAbout3: 'SOURCE: github.com/DerekH-233/DKSan3_Terminal',
    termUnknown: 'UNKNOWN COMMAND "{c}". TYPE help FOR THE COMMAND SET.',
    termErr: 'COMMAND FAULT: {c}',
    termWelcome: 'TYPE help FOR THE COMMAND SET.',
    termLogsHead: 'RECENT {n} RECORDS [ {total} TOTAL ]',
    termLogsTip: 'USE open <date> TO READ A FULL RECORD.',
    termComplete: 'CANDIDATES: {c}',
    cmdPlaceholder: 'TYPE A COMMAND, OR help FOR THE COMMAND SET…',

    /* 页脚 */
    footLine: '© 2026 TERMINAL_SYSTEM // DKSan3',
    footSub: 'DEEP_SPACE_UNION // INDUSTRIAL FUNCTIONALISM // WE ARE BORN TO LOOK UP',

    /* 时间链 */
    tcRecords: '{month} · {count} RECORDS',

    /* 打字机 */
    tw1: '>> INITIALIZING DEEP SPACE TERMINAL...',
    tw2: '>> OPERATOR IDENTIFIED: DKSan3',
    tw3: '>> TARGET LOCKED: WE ARE BORN TO LOOK UP',

    /* 小字 */
    mainSub: 'AFFILIATED WITH DSU // HETEROGENEOUS INFORMATION PROCESSING CENTER',
    heroInitial: 'SYNCING OBSERVATION SIGNAL…',
    signalTitle: 'SIGNAL STRENGTH',
    localTimeTitle: 'LOCAL TIME',
    bootAria: 'System boot',
    siteTitleAria: 'Site title',
    heroAria: 'Today\'s observation image',
    heroMediaAria: 'Open NASA image of the day',
    logsAria: 'Mission logs',
    telemetryAria: 'System telemetry',
    themeAria: 'Switch theme',
    cmdAria: 'Open command terminal',
    tcAria: 'Timeline navigation',
    readerAria: 'Log reader',
    cmdBarAria: 'Command input',

    /* 语言按钮 */
    langBtn: '中',

    /* 观测视图 */
    back: '◄ BACK'
};

const DICTS = { zh: ZH, en: EN };

let lang = 'zh';
let dict = ZH;

/* ───────────── 语言检测 ───────────── */

function detectLang() {
    try {
        const saved = localStorage.getItem('dsu_lang');
        if (saved === 'zh' || saved === 'en') return saved;
    } catch (_) { /* 隐私模式忽略 */ }

    const nav = (navigator.language || (navigator.languages && navigator.languages[0]) || 'zh').toLowerCase();
    /* zh 开头且非繁中区域（hk/tw/mo）→ 中文；其余（含繁中）→ 英文 */
    if (nav.startsWith('zh') && !/zh-(hk|tw|mo|hant)/.test(nav)) return 'zh';
    return 'en';
}

/* ───────────── 核心 API ───────────── */

/** 取当前语言文本，支持 {var} 占位 */
export function t(key, vars) {
    let s = dict[key] ?? ZH[key] ?? key;
    if (vars) {
        for (const [k, v] of Object.entries(vars)) {
            s = s.replaceAll('{' + k + '}', String(v));
        }
    }
    return s;
}

/** 应用静态文本：data-i18n / data-i18n-placeholder / data-i18n-title / data-i18n-aria */
export function applyStatic() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.dataset.i18nTitle);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
        el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });
    document.title = t('bootTitle');
}

export function getLang() { return lang; }
export function isZh() { return lang === 'zh'; }

/** 切换语言：应用静态文本 + 广播事件，各模块重绘动态内容 */
export function setLang(next) {
    if (next !== 'zh' && next !== 'en') return;
    lang = next;
    dict = DICTS[lang];
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    try { localStorage.setItem('dsu_lang', lang); } catch (_) {}
    applyStatic();
    document.dispatchEvent(new CustomEvent('dsu:lang-change'));
}

export function toggleLang() { setLang(lang === 'zh' ? 'en' : 'zh'); }

export function init() {
    lang = detectLang();
    dict = DICTS[lang];
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    applyStatic();
    return lang;
}
