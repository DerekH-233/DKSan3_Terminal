const DSU_RENDERER = {
    scene: null, camera: null, renderer: null, grid: null,

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('three-canvas'), 
            alpha: true, 
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // 动态地底网格
        this.grid = new THREE.GridHelper(100, 50, 0xff5a09, 0x222222);
        this.grid.position.y = -5;
        this.scene.add(this.grid);

        // 星空粒子
        const pGeo = new THREE.BufferGeometry();
        const pCount = 1000;
        const posArray = new Float32Array(pCount * 3);
        for(let i=0; i < pCount * 3; i++) { posArray[i] = (Math.random() - 0.5) * 80; }
        pGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const pMat = new THREE.PointsMaterial({ size: 0.05, color: 0x00f0ff, transparent: true, opacity: 0.5 });
        this.scene.add(new THREE.Points(pGeo, pMat));

        this.camera.position.z = 15;
        this.camera.position.y = 2;
        this.animate();
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        this.grid.position.z += 0.04;
        if (this.grid.position.z > 2) this.grid.position.z = 0;
        this.renderer.render(this.scene, this.camera);
    }
};

window.addEventListener('resize', () => {
    if (DSU_RENDERER.camera) {
        DSU_RENDERER.camera.aspect = window.innerWidth / window.innerHeight;
        DSU_RENDERER.camera.updateProjectionMatrix();
        DSU_RENDERER.renderer.setSize(window.innerWidth, window.innerHeight);
    }
});