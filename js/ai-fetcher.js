const DSU_AI = {
    async fetchLogs() {
        const list = document.getElementById('article-list');
        if (!list) return;
        list.innerHTML = "LOADING_DATA...";

        try {
            // 加上时间戳防止浏览器缓存 manifest
            const resp = await fetch('logs/manifest.json?t=' + new Date().getTime());
            const logs = await resp.json();
            list.innerHTML = "";

            logs.forEach(log => {
                const div = document.createElement('div');
                div.style.cssText = "border:1px solid rgba(255,90,9,0.3); padding:20px; margin-bottom:20px; cursor:pointer; position:relative; z-index:999; background:rgba(0,0,0,0.8);";
                div.innerHTML = `<small style="color:#ff5a09">${log.date}</small><h3 style="color:#fff;margin-top:5px;">${log.title}</h3>`;
                
                // 强制绑定点击
                div.onclick = () => {
                    console.log("Card Clicked!");
                    this.loadContent(log.date, log.title);
                };
                list.appendChild(div);
            });
        } catch (e) {
            list.innerHTML = "OFFLINE: MANIFEST_NOT_FOUND";
        }
    },

    async loadContent(date, title) {
        try {
            const resp = await fetch(`logs/${date}.txt`);
            const txt = await resp.text();
            this.show(title, txt, date);
        } catch (e) { alert("ERROR_EXTRACTING_LOG"); }
    },

    show(title, content, date) {
        const reader = document.getElementById('reader');
        reader.innerHTML = `
            <div style="max-width:800px; margin:0 auto; color:#00f0ff;">
                <button onclick="DSU_UI.closeReader()" style="position:fixed; top:20px; right:20px; background:#000; color:#ff5a09; border:1px solid #ff5a09; padding:10px; cursor:pointer; z-index:4000;">[ CLOSE ]</button>
                <h1>${title}</h1><hr><div style="white-space:pre-wrap; margin-top:20px;">${content}</div>
            </div>`;
        reader.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
};

window.DSU_UI = {
    closeReader: () => {
        document.getElementById('reader').style.display = 'none';
        document.body.style.overflow = '';
    }
};
