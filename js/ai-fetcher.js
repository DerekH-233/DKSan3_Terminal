const DSU_AI = {
    async fetchLogs() {
        const list = document.getElementById('article-list');
        if (!list) return;
        list.innerHTML = "<p style='opacity:0.5'>[ 正在同步深空存档... ]</p>";

        try {
            // 抓取索引清单，加时间戳防止缓存
            const response = await fetch('logs/manifest.json?t=' + new Date().getTime());
            if (!response.ok) throw new Error('MANIFEST_NOT_FOUND');
            const logs = await response.json();
            
            list.innerHTML = "";
            if (logs.length === 0) {
                list.innerHTML = "<p>存档库为空。等待初始观测...</p>";
                return;
            }

            logs.forEach(log => {
                const card = document.createElement('div');
                card.className = 'article-card';
                card.innerHTML = `
                    <small>LOG_ID // ${log.date}</small>
                    <h3>${log.title}</h3>
                    <div style="font-size:10px; opacity:0.3; margin-top:15px;">>> 点击提取字节流数据</div>
                `;
                card.onclick = () => this.loadPost(log.date, log.title);
                list.appendChild(card);
            });
        } catch (e) {
            console.error(e);
            list.innerHTML = "<p style='color:var(--primary)'>[错误] 无法建立连接。请检查 logs/manifest.json</p>";
        }
    },

    async loadPost(date, title) {
        try {
            const resp = await fetch(`logs/${date}.txt`);
            const content = await resp.text();
            this.showReader(title, content, date);
        } catch (e) { alert("数据包提取失败"); }
    },

    showReader(title, content, date) {
        const reader = document.getElementById('reader');
        reader.innerHTML = `
            <div class="reader-inner">
                <button onclick="window.DSU_UI.closeReader()" style="position:fixed; top:30px; right:40px; background:none; border:1px solid var(--primary); color:var(--primary); padding:10px 15px; cursor:pointer; font-family:'Share Tech Mono'; z-index:4000;">[X] CLOSE</button>
                <div style="border-left: 3px solid var(--primary); padding-left:20px; margin-bottom:40px;">
                    <h1 style="color:var(--primary); line-height:1.2;">${title}</h1>
                    <small style="opacity:0.5;">TIMESTAMP: ${date} // OMEGA_AUTH</small>
                </div>
                <div style="white-space:pre-wrap; line-height:1.8; font-size:1.1rem; color:var(--accent);">${content}</div>
                <div style="margin-top:60px; padding:40px 0; border-top:1px solid #222; text-align:center;">
                    <button onclick="window.DSU_UI.closeReader()" style="background:none; border:1px solid var(--primary); color:var(--primary); padding:15px 40px; cursor:pointer; width:100%; max-width:300px;">RETURN_TO_TERMINAL</button>
                </div>
            </div>
        `;
        reader.style.display = 'block';
        document.body.style.overflow = 'hidden';
        reader.scrollTop = 0;
    }
};

window.DSU_UI = {
    closeReader: function() {
        const reader = document.getElementById('reader');
        if (reader) {
            reader.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
};
