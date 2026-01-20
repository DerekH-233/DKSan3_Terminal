/**
 * DKSan3_Terminal // AI_FETCHER_MODULE // V8.2
 * 功能：自动从 logs 目录抓取 AI 生成的日志并渲染至 UI
 */

const DSU_AI = {
    // 基础路径配置
    // 注意：如果你的 index.html 在 DKSan3_Terminal 文件夹内，
    // 那么路径应该直接写 logs/，浏览器会自动拼接。
    CONFIG: {
        logDir: 'logs/',
        fallbackTitle: '深空同步延迟',
        fallbackContent: '>> [警告] 无法获取当前扇区的实时观测日志...\n>> [状态] 正在尝试建立次级量子链接...\n>> [提示] 我们生而眺望，直到星尘填满眼眶。'
    },

    async fetchLogs() {
        const list = document.getElementById('article-list');
        if (!list) return;

        // --- 修复点 1：每次加载前清空列表，防止重复生成标题 ---
        list.innerHTML = ""; 

        // 获取当前日期 (格式: YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];
        const logPath = `${this.CONFIG.logDir}${today}.txt`;

        try {
            // 尝试抓取今天的 AI 日志
            const response = await fetch(logPath);
            
            if (response.ok) {
                const content = await response.text();
                this.addCard(list, `LOG_${today}`, `深空自动监测报告 // ${today}`, content, today);
            } else {
                // 如果当天文件不存在 (404)，显示一条符合世界观的占位符
                console.warn(`[DSU] 日志文件 ${logPath} 尚未生成。`);
                this.addCard(list, 'SIGNAL_LOST', this.CONFIG.fallbackTitle, this.CONFIG.fallbackContent, today);
            }
        } catch (error) {
            console.error("[DSU] 关键性链路故障:", error);
            this.addCard(list, 'LINK_ERROR', '量子链路断开', '无法连接至深空联合数据库。', 'ERROR');
        }
    },

    /**
     * 渲染卡片至界面
     */
    addCard(container, id, title, content, date) {
        const div = document.createElement('div');
        div.className = 'article-card';
        
        // --- 修复点 2：使用按钮式交互，避免 <a> 标签导致页面意外刷新 ---
        div.innerHTML = `
            <div class="card-header">
                <small style="color:var(--primary)">ID: ${id}</small>
                <span style="font-size: 10px; opacity: 0.4; float: right;">${date}</span>
            </div>
            <h3 style="margin-top: 10px; font-size: 1.1rem;">${title}</h3>
            <div style="margin-top: 15px; font-size: 10px; color: var(--accent); opacity: 0.6;">[ 点击解密数据包 ]</div>
        `;

        // 点击事件：打开全屏阅读器
        div.onclick = (e) => {
            // 阻止冒泡
            e.preventDefault();
            this.openReader(title, content, date);
        };

        container.appendChild(div);
    },

    /**
     * 打开全屏阅读器逻辑
     */
    openReader(title, content, date) {
        const reader = document.getElementById('reader');
        const readerContent = document.getElementById('reader-content');
        
        if (reader && readerContent) {
            reader.style.display = 'block';
            // 禁止背景滚动
            document.body.style.overflow = 'hidden';
            
            readerContent.innerHTML = `
                <div style="border-left: 3px solid var(--primary); padding-left: 20px; margin-bottom: 40px;">
                    <h1 style="color:var(--primary); font-size: 2rem;">${title}</h1>
                    <small style="opacity:0.5;">DATE: ${date} // ACCESS: OMEGA</small>
                </div>
                <div style="white-space: pre-wrap; line-height: 1.8; font-size: 1.1rem; color: var(--accent);">
                    ${content}
                </div>
                <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid rgba(0,240,255,0.1); font-size: 10px; opacity: 0.3;">
                    >> END OF LOG // DEEP_SPACE_UNION_ENCRYPTION
                </div>
            `;
        }
    }
};

// 暴露关闭阅读器的全局函数
window.DSU_UI = {
    closeReader: function() {
        const reader = document.getElementById('reader');
        if (reader) {
            reader.style.display = 'none';
            document.body.style.overflow = 'auto'; // 恢复滚动
        }
    }
};
