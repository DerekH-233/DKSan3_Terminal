const DSU_AI = {
    async fetchLogs() {
        const list = document.getElementById('article-list');
        if (!list) return;
        list.innerHTML = "<p style='opacity:0.5'>正在连接深空存档清单...</p>";

        try {
            const manifestResp = await fetch('logs/manifest.json');
            if (!manifestResp.ok) throw new Error('Manifest not found');
            const logs = await manifestResp.json();
            list.innerHTML = "";

            if (logs.length === 0) {
                list.innerHTML = "<p>存档库为空。</p>";
                return;
            }

            logs.forEach(log => this.addCard(list, log.date, log.title));
        } catch (e) {
            console.error("Fetch Error:", e);
            list.innerHTML = "<p style='color:var(--primary)'>[错误] 存档清单获取失败。请检查 logs/manifest.json 是否存在。</p>";
        }
    },

    addCard(container, date, title) {
        const div = document.createElement('div');
        div.className = 'article-card';
        div.innerHTML = `
            <small style="color:var(--primary)">DATA_LOG // ${date}</small>
            <h3 style="margin-top:10px; cursor:pointer;">${title}</h3>
        `;
        
        div.onclick = async () => {
            try {
                const resp = await fetch(`logs/${date}.txt`);
                const content = await resp.text();
                this.openReader(title, content, date);
            } catch (err) {
                alert("无法加载日志内容。");
            }
        };
        container.appendChild(div);
    },

    openReader(title, content, date) {
        const reader = document.getElementById('reader');
        if (!reader) return;

        // 注入内容，包含右上角固定按钮和底部退出按钮
        reader.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto; position: relative; padding-top: 40px;">
                <!-- 右上角固定关闭按钮 -->
                <button onclick="DSU_UI.closeReader()" style="position:fixed; top:30px; right:40px; background:none; border:1px solid var(--primary); color:var(--primary); padding:10px 15px; cursor:pointer; font-family:'Share Tech Mono'; z-index:3001;">
                    [X] CLOSE
                </button>

                <div style="border-left: 3px solid var(--primary); padding-left: 20px; margin-bottom: 40px;">
                    <h1 style="color:var(--primary); font-size: 1.8rem;">${title}</h1>
                    <small style="opacity:0.5;">TIMESTAMP: ${date} // ACCESS: OMEGA</small>
                </div>

                <div style="white-space: pre-wrap; font-size:1.1rem; line-height:1.8; color:var(--accent); margin-bottom: 60px;">
                    ${content}
                </div>

                <!-- 底部大型退出按钮 -->
                <div style="margin-top:60px; border-top:1px solid #222; padding:40px 0; text-align:center;">
                    <button onclick="DSU_UI.closeReader()" style="background:none; border:1px solid var(--primary); color:var(--primary); padding:15px 40px; cursor:pointer; font-family:'Share Tech Mono'; width:100%; max-width:300px;">
                        RETURN_TO_TERMINAL
                    </button>
                </div>
            </div>
        `;

        reader.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 锁定主屏滚动
        reader.scrollTop = 0; // 确保从顶部开始读
    }
};

window.DSU_UI = {
    closeReader: function() {
        const reader = document.getElementById('reader');
        if (reader) {
            reader.style.display = 'none';
            // 彻底恢复滚动的修复
            document.body.style.overflow = ''; 
            document.body.style.height = ''; 
        }
    }
};
