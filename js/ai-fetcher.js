const DSU_AI = {
    async fetchLogs() {
        const list = document.getElementById('article-list');
        const today = new Date().toISOString().split('T')[0];
        const logPath = `logs/${today}.txt`;

        try {
            const response = await fetch(logPath);
            if (response.ok) {
                const content = await response.text();
                this.addCard(list, `LOG_${today}`, `深空自动监测报告`, content, today);
            } else {
                this.addCard(list, 'DSU-INIT', '系统初始化日志', '等待深空信号同步中...\n\n「我们生而眺望，并非为了答案。」', '2024.01.01');
            }
        } catch (e) {
            console.error("Signal Sync Failed.");
        }
    },

    addCard(container, id, title, content, date) {
        const div = document.createElement('div');
        div.className = 'article-card';
        div.innerHTML = `<small style="color:var(--primary)">ID: ${id} // ${date}</small><h3>${title}</h3>`;
        div.onclick = () => {
            document.getElementById('reader').style.display = 'block';
            document.getElementById('reader-content').innerHTML = `
                <h1 style="color:var(--primary)">${title}</h1>
                <small>${date}</small>
                <hr style="margin:20px 0; opacity:0.1;">
                <p style="white-space: pre-wrap;">${content}</p>
            `;
        };
        container.appendChild(div);
    }
};