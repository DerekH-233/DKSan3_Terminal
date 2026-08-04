**系统已就绪，旅行者。祝你在星辰大海的眺望中，旅途愉快。**

# [ DKSan3 // 深空终端 ]

这是我在数字荒原中搭建的一个观测哨。这里不生产热闹，只记录关于冷色调、网格线和星空的某种偏执。

### 📡 项目声明 (The Project)

我并非专业开发者，但我对工业机能美学有着明确的偏好。在这个项目中，我担任**懒人**，负责构思视觉逻辑、叙事背景和交互反馈；而底层的代码实现、3D 引擎的调优以及自动化部署，则是通过与 **AI 深度协作**共同完成的。

### 🤖 诚实的 AI 协作说明 (AI Disclosure)

这个站点在很大程度上是“自生长”的。为了保持终端的真实感，我引入了以下 AI 驱动：

*   **自主日志 (Autonomous Logs)**：你看到的 `[ MISSION_LOGS ]` 并非我亲笔所写。系统后台通过 GitHub Actions 每天调用 **DeepSeek** 的 API 接口。
*   **实时共鸣 (Sync)**：AI 每天会自动抓取 **NASA APOD**（每日一图）的科学背景，并以 **DKSan3 观察员** 的身份，在 15% 的“感性算法扰动”下，撰写一段带有文艺气息的观测报告。

### ⚙️ 系统构件 (Tech Stack)

*   **视觉**：`Three.js`（ES Module）驱动的星尘粒子场、线框观测核心与动态网格地平线；鼠标视差与滚动视差。
*   **数据**：实时同步 NASA 每日深空影像（图片 / 视频自适应），确保终端与现实宇宙事件同频。
*   **驱动**：托管于 Cloudflare Pages，通过 GitHub 持续集成；日志管线由 Node 脚本自主运行。

### 🗂️ 浏览与分页 (Browsing)

*   日志列表**分页浏览**（每页 12 条），每张卡片附带当日 NASA 影像缩略图（YouTube 影像自动转官方缩略图）。
*   左侧边缘（宽屏 ≥1280px）有**时间日期链**：垂直月份导航，随滚动自动高亮当前月份，点击节点直接跳转该月记录。
*   数据异常（标题为 null / 影像丢失 / 链接失效）会以科幻设定呈现：「信号失真」标题与闪烁的 `SIGNAL_LOST` 故障占位，而非裸露的报错。

### 🖥️ 终端指令集 (Terminal Commands)

点击底部命令栏（或按 **`` ` ``** 键）即可输入命令：

| 命令 | 作用 |
|---|---|
| `help` | 显示完整指令集 |
| `logs [n]` | 列出最近 n 条观测记录（默认 10） |
| `open <date>` | 读取指定日期日志，如 `open 2026-08-03` |
| `search <词>` | 搜索日志并聚焦结果 |
| `apod` | 定位至今日观测影像 |
| `status` | 系统遥测状态 |
| `theme [name]` | 切换主题：classic / aurora / blood / ghost |
| `bgm` | 切换背景音乐 |
| `whoami` / `ping` / `date` / `uptime` / `echo` | 终端基础指令 |
| `clear` / `history` / `about` / `links` | 面板与信息指令 |

> 提示：输入时按 **TAB** 自动补全，**↑/↓** 翻阅历史，**`/**`** 快速聚焦搜索。

### ⌨️ 键盘快捷方式

*   **`` ` ``** — 聚焦命令终端
*   **`/`** — 聚焦日志搜索
*   **`Esc`** — 关闭阅读器 / 终端面板
*   **`←` / `→`** — 阅读器中切换上一条 / 下一条日志

### 🔭 目标：我们生而眺望 (Objective)

目前，这套系统已经进入了**自主**模式。

所有的逻辑链路已经闭合。除非有重大的结构性重构需求，否则该网页将保持当前构型持续运行。它会像一颗被抛入深空的卫星，每天定时向地球传回一段 AI 生成的碎碎念，直到信号彻底消失在背景噪音里。

---

**节点所有者**: DKSan3  
**技术协作**: ChatGPT / DeepSeek / NASA APOD  


### 🔗 外部上行链路 (External Uplinks)

*   **AI 核心获取**: [DeepSeek API 控制台](https://platform.deepseek.com/)
*   **深空影像来源**: [NASA APOD 官方网站](https://apod.nasa.gov/apod/astropix.html)
*   **背景音频 (BGM)**: (Leaving the World Behind)


### 📂 系统架构 (Project Structure)

```text
dksan3-terminal/
├── .github/
│   └── workflows/
│       └── daily_log.yml          # 每日自动生成日志（含 NASA 同步）
├── css/
│   └── main.css                   # 设计系统：主题变量 / CRT / HUD / 响应式
├── js/
│   ├── app.js                     # 入口：启动序列 / HUD / 快捷键编排
│   ├── scene.js                   # Three.js 深空场景（性能自适应）
│   ├── logs.js                    # 日志加载 / 搜索 / 无限滚动 / 阅读器
│   ├── terminal.js                # 命令终端
│   ├── apod.js                    # 今日影像（图片 / 视频）
│   ├── audio.js                   # 背景音乐控制
│   └── theme.js                   # 主题系统
├── scripts/
│   └── generate-log.mjs           # 自主日志生成器 v2（重试 / 回退 / 校验）
├── logs/                          # [动态数据] 所有日志存放处
│   ├── manifest.json              # [大脑] 记录所有日志的日期、标题与影像
│   └── YYYY-MM-DD.txt             # [存档] AI 写的具体内容
├── index.html                     # [全量入口] 页面骨架
└── README.md                      # [系统说明]
```

### 🛡️ 可靠性设计 (Resilience)

*   日志管线：NASA / DeepSeek 请求均带**重试与超时**；标题翻译失败自动回退英文原题；日志内容校验（非空、无 Markdown 标记），失败则中止本轮，不污染归档。
*   前端：manifest 本地缓存兜底（断网可读缓存）；WebGL 不可用时降级为 CSS 星尘背景；页面不可见时自动暂停 3D 渲染；移动端自动降低粒子数与渲染精度。
