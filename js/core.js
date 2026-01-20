const DSU_CORE = {
    boot() {
        // 1. 隐藏启动屏
        document.getElementById('init-screen').style.display = 'none';
        
        // 2. 启动音频与视觉
        document.getElementById('bgm').play();
        DSU_RENDERER.init();
        
        // 3. 加载外部资源
        document.getElementById('daily-img').style.backgroundImage = `url('https://apod.as93.net/image')`;
        document.getElementById('current-date').innerText = new Date().toLocaleDateString();
        
        // 4. 启动 AI 日志抓取
        DSU_AI.fetchLogs();
        
        // 5. 启动打字机
        this.runTypewriter();
    },

    runTypewriter() {
        const text = ">> 初始化深空联合终端...\n>> 识别操作员: DKSan3\n>> 目标锁定: 我们生而眺望\n>> 系统连接状态: 完美";
        let i = 0;
        const el = document.getElementById('typewriter');
        const type = () => {
            if (i < text.length) {
                el.innerHTML += text.charAt(i) === '\n' ? '<br>' : text.charAt(i);
                i++;
                setTimeout(type, 40);
            }
        };
        type();
    }
};

const DSU_UI = {
    closeReader() {
        document.getElementById('reader').style.display = 'none';
    }
};