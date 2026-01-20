const DSU_AI = {
    async fetchLogs() {
        const list = document.getElementById('article-list');
        if (!list) return;
        list.innerHTML = "<p style='opacity:0.5'>正在建立量子链路，检索存档列表...</p>";

        try {
            // 1. 先抓取索引清单
            const manifestResp = await fetch('logs/manifest.json');
            if (!manifestResp.ok) throw new Error('Manifest not found');
            const logs = await manifestResp.json();

            list.innerHTML = ""; // 清空加载提示

            if (logs.length === 0) {
                list.innerHTML = "<p>存档库为空。等待初始观测...</p>";
                return;
            }

            // 2. 遍历清单渲染所有日志卡片
            for (const log of logs) {
                this.addCard(list, log.date, log.title);
            }
        } catch (e) {
            console.error("Fetch Error:", e);
            list.innerHTML = "<p style='color:var(--primary)'>[错误] 无法获取存档清单。系统可能尚未初始化。</p>";
        }
    },

    addCard(container, date, title) {
        const div = document.createElement('div');
        div.className = 'article-card';
        div.innerHTML = `
            <small style="color:var(--primary)">DATA_LOG // ${date}</small>
            <h3 style="margin-top:10px;">${title}</h3>
            <div style="margin-top:10px; font-size:10px; opacity:0.4;">>> 点击提取字节流</div>
        `;
        
        div.onclick = async () => {
            try {
                const resp = await fetch(`logs/${date}.txt`);
                const content = await resp.text();
                this.openReader(title, content, date);
            } catch (err) {
                alert("文件内容提取失败。");
            }
        };
        container.appendChild(div);
    },

    openReader(title, content, date) {
        const reader = document.getElementById('reader');
        const readerContent = document.getElementById('reader-content');
        if (reader && readerContent) {
            readerContent.innerHTML = `
                <h1 style="color:var(--primary)">${title}</h1>
                <small>TIMESTAMP: ${date}</small>
                <hr style="margin:20px 0; opacity:0.1;">
                <div style="white-space: pre-wrap; font-size:1.1rem; line-height:1.8;">${content}</div>
                <div style="margin-top:40px; border-top:1px solid #222; padding-top:20px;">
                    <button onclick="DSU_UI.closeReader()" style="background:none; border:1px solid var(--primary); color:var(--primary); padding:10px 20px; cursor:pointer;">[ 退出阅读模式 ]</button>
                </div>
            `;
            reader.style.display = 'block';
            // Bug 1 修复：确保滚动条消失且位置固定
            document.body.style.overflow = 'hidden';
        }
    }
};

window.DSU_UI = {
    closeReader: function() {
        const reader = document.getElementById('reader');
        if (reader) {
            reader.style.display = 'none';
            // Bug 1 修复：恢复滚动的唯一正确方式
            document.body.style.overflow = ''; 
            document.body.style.height = 'auto';
        }
    }
};
