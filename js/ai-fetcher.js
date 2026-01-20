/**
 * DKSan3_Terminal // AI_FETCHER // V10.0_STABLE
 */

const DSU_AI = {
    // 自动探测路径：无论你在本地还是服务器，确保能找到 logs
    getLogPath(filename) {
        return `logs/${filename}`;
    },

    async fetchLogs() {
        const list = document.getElementById('article-list');
        if (!list) return;
        
        list.innerHTML = "<p style='opacity:0.5'>[ 正在检索深空存档清单... ]</p>";

        try {
            // 获取索引清单
            const response = await fetch(this.getLogPath('manifest.json'));
            if (!response.ok) throw new Error('MANIFEST_NOT_FOUND');
            
            const logs = await response.json();
            list.innerHTML = ""; // 清空加载提示

            if (logs.length === 0) {
                list.innerHTML = "<p>存档库为空。等待初始观测...</p>";
                return;
            }

            // 渲染日志列表
            logs.forEach(log => {
                const card = document.createElement('div');
                card.className = 'article-card';
                // 强制样式确保可点击
                card.style.cursor = 'pointer';
                card.style.position = 'relative';
                card.style.zIndex = '100';

                card.innerHTML = `
                    <small style="color:var(--primary); pointer-events:none;">DATA_LOG // ${log.date}</small>
                    <h3 style="margin-top:10px; pointer-events:none;">${log.title}</h3>
                    <div style="margin-top:10px; font-size:10px; opacity:0.4; pointer-events:none;">>> 提取数据包 (ENTER)</div>
                `;

                // 核心：点击交互逻辑
                card.onclick = async () => {
                    console.log(`[DSU] 正在提取日志: ${log.date}`);
                    try {
                        const contentResp = await fetch(this.getLogPath(`${log.date}.txt`));
                        if (!contentResp.ok) throw new Error('LOG_FILE_NOT_FOUND');
                        const content = await contentResp.text();
                        this.showReader(log.title, content, log.date);
                    } catch (err) {
                        console.error(err);
                        alert("无法读取日志内容，请检查 logs 文件夹。");
                    }
                };

                list.appendChild(card);
            });
        } catch (e) {
            console.error(e);
            list.innerHTML = "<p style='color:var(--primary)'>[错误] 无法建立数据连接。请确保 Action 已生成 manifest.json。</p>";
        }
    },

    showReader(title, content, date) {
        const reader = document.getElementById('reader');
        if (!reader) return;

        // 注入排版精美的阅读器内容
        reader.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto; position: relative;">
                <!-- 右上角关闭 -->
                <button onclick="window.DSU_UI.closeReader()" 
                        style="position:fixed; top:30px; right:40px; background:none; border:1px solid var(--primary); color:var(--primary); padding:10px 15px; cursor:pointer; font-family:'Share Tech Mono'; z-index:4000;">
                    [X] CLOSE
                </button>

                <div style="border-left: 3px solid var(--primary); padding-left: 20px; margin-bottom: 40px; margin-top: 40px;">
                    <h1 style="color:var(--primary); font-size: 1.8rem; line-height:1.2;">${title}</h1>
                    <small style="opacity:0.5;">TIMESTAMP: ${date} // ACCESS: OMEGA</small>
                </div>

                <div style="white-space: pre-wrap; font-size:1.1rem; line-height:1.8; color:var(--accent); margin-bottom: 80px;">
                    ${content}
                </div>

                <div style="margin: 60px 0; padding: 40px 0; border-top: 1px solid #222; text-align: center;">
                    <button onclick="window.DSU_UI.closeReader()" 
                            style="background:none; border:1px solid var(--primary); color:var(--primary); padding:15px 40px; cursor:pointer; font-family:'Share Tech Mono'; width:100%; max-width:300px;">
                        RETURN_TO_TERMINAL
                    </button>
                </div>
            </div>
        `;

        reader.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 彻底锁定主屏滚动
        reader.scrollTop = 0; // 回到顶部
    }
};

// 确保 DSU_UI 全局可用，无论在 HTML 还是按钮里调用
window.DSU_UI = {
    closeReader: function() {
        const reader = document.getElementById('reader');
        if (reader) {
            reader.style.display = 'none';
            document.body.style.overflow = ''; // 恢复滚动
            document.body.style.height = ''; 
            console.log("[DSU] 阅读器已关闭，主屏控制权已恢复。");
        }
    }
};
