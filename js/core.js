const DSU_CORE = {
    boot() {
        const initScreen = document.getElementById('init-screen');
        if (initScreen) {
            initScreen.style.opacity = '0'; // 先变透明
            setTimeout(() => initScreen.remove(), 500); // 0.5秒后彻底从网页中删除，绝不占位
        }
        
        document.getElementById('bgm').play();
        DSU_RENDERER.init();
        
        // ... 其他逻辑保持不变 ...
        DSU_AI.fetchLogs();
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
