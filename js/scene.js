/* ============================================================
   DSU Terminal — 3D 深空场景
   星尘粒子场 / 线框观测核心 / 轨道环 / 网格地平线 / 流星
   性能策略：
     - DPR 限制、粒子数按设备自适应
     - 页面不可见时暂停渲染（visibilitychange）
     - prefers-reduced-motion 仅渲染静态帧
     - WebGL 不可用时降级为 CSS 星空背景
   ============================================================ */

import * as THREE from 'three';

let renderer, scene, camera, rafId = 0;
let mouse = { x: 0, y: 0 };
let scrollY = 0;
let running = false;

/* ── 流星池 ── */
const meteors = [];
let meteorTimer = 0;

/* ── 设备能力检测 ── */
const isMobile = () => window.innerWidth < 768;
const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function particleCount() {
    const base = isMobile() ? 1400 : 3200;
    const cores = navigator.hardwareConcurrency || 4;
    return cores >= 6 ? base : Math.round(base * 0.6);
}

export async function init() {
    const canvas = document.getElementById('scene-canvas');
    try {
        renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: !isMobile(),
            powerPreference: 'high-performance'
        });
    } catch (_) {
        enableFallback();
        return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 1.5 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 300);
    camera.position.set(0, 2.2, 24);
    camera.lookAt(0, 0, 0);

    buildWorld();

    /* 鼠标视差 */
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    /* 滚动视差 */
    window.addEventListener('scroll', onScroll, { passive: true });
    /* 页面可见性：暂停渲染以省电 */
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);

    if (prefersReduced()) {
        renderFrame(); // 只渲染一帧
    } else {
        running = true;
        loop();
    }
}

/* ─────────────────────── 世界构建 ─────────────────────── */

function buildWorld() {
    /* 1. 星尘粒子场 — 两层深度，营造纵深 */
    const starsMat = new THREE.PointsMaterial({
        size: 0.07,
        color: 0xcfd8ff,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        sizeAttenuation: true
    });
    const starsGeo = new THREE.BufferGeometry();
    const count = particleCount();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        pos[i * 3]     = (Math.random() - 0.5) * 160;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 90;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    /* 近层微尘（更大、更透，鼠标视差更强） */
    const dustMat = new THREE.PointsMaterial({
        size: 0.11,
        color: 0xffffff,
        transparent: true,
        opacity: 0.28,
        depthWrite: false
    });
    const dustGeo = new THREE.BufferGeometry();
    const dCount = Math.round(count / 3);
    const dPos = new Float32Array(dCount * 3);
    for (let i = 0; i < dCount; i++) {
        dPos[i * 3]     = (Math.random() - 0.5) * 70;
        dPos[i * 3 + 1] = (Math.random() - 0.5) * 40;
        dPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    /* 2. 线框观测核心 — 深空联合的"眼睛" */
    const core = new THREE.Group();
    const sphereGeo = new THREE.SphereGeometry(5.2, 28, 28);
    const wireframe = new THREE.WireframeGeometry(sphereGeo);
    const coreMat = new THREE.LineBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.055,
        depthWrite: false
    });
    const coreLines = new THREE.LineSegments(wireframe, coreMat);
    core.add(coreLines);

    /* 核心内点云 — 星核 */
    const coreDustMat = new THREE.PointsMaterial({
        size: 0.14,
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        depthWrite: false
    });
    const coreDustGeo = new THREE.BufferGeometry();
    const cdCount = 260;
    const cdPos = new Float32Array(cdCount * 3);
    for (let i = 0; i < cdCount; i++) {
        const r = Math.cbrt(Math.random()) * 5.2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        cdPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
        cdPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        cdPos[i * 3 + 2] = r * Math.cos(phi);
    }
    coreDustGeo.setAttribute('position', new THREE.BufferAttribute(cdPos, 3));
    const coreDust = new THREE.Points(coreDustGeo, coreDustMat);
    core.add(coreDust);

    /* 3. 轨道环 — 双层 */
    const ringMat = new THREE.LineBasicMaterial({
        color: 0xff5a09,
        transparent: true,
        opacity: 0.22,
        depthWrite: false
    });
    const ringGeo = new THREE.EdgesGeometry(new THREE.TorusGeometry(8.6, 0.02, 4, 96));
    const ringA = new THREE.LineSegments(ringGeo, ringMat);
    ringA.rotation.x = Math.PI / 2.4;
    const ringB = new THREE.LineSegments(ringGeo.clone(), ringMat.clone());
    ringB.rotation.x = Math.PI / 1.7;
    ringB.rotation.z = 0.6;
    core.add(ringA, ringB);

    core.position.set(-17, 2, -10);
    scene.add(core);

    /* 4. 网格地平线 — 极淡蓝图网格 */
    const grid = new THREE.GridHelper(120, 60, 0x00f0ff, 0x223344);
    grid.position.y = -6.5;
    grid.material.transparent = true;
    grid.material.opacity = 0.13;
    scene.add(grid);

    /* 保存引用供动画使用 */
    scene.userData = { stars, dust, core, grid };
}

/* ─────────────────────── 流星 ─────────────────────── */

function spawnMeteor() {
    const from = new THREE.Vector3(
        (Math.random() - 0.5) * 90,
        10 + Math.random() * 35,
        -25 - Math.random() * 30
    );
    const to = from.clone().add(
        new THREE.Vector3((Math.random() - 0.5) * 8, -(9 + Math.random() * 18), 6 + Math.random() * 10)
    );

    const mat = new THREE.LineBasicMaterial({
        color: 0x9be8ff,
        transparent: true,
        opacity: 0.9
    });
    const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
    const line = new THREE.Line(geo, mat);
    scene.add(line);

    meteors.push({ line, t: 0, life: 1.1 + Math.random() * 0.6, from: from.clone(), to: to.clone() });
}

/* ─────────────────────── 交互 ─────────────────────── */

function onPointerMove(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
}

function onScroll() {
    scrollY = window.scrollY;
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onVisibility() {
    if (document.hidden) {
        running = false;
        cancelAnimationFrame(rafId);
    } else if (!prefersReduced()) {
        running = true;
        loop();
    }
}

/* ─────────────────────── 渲染循环 ─────────────────────── */

let lastTime = 0;

function loop(now) {
    if (!running) return;
    const dt = Math.min((now - lastTime) / 1000, 0.05) || 0.016; // 钳制防跳帧
    lastTime = now;
    update(dt, now / 1000);
    renderFrame();
    rafId = requestAnimationFrame(loop);
}

function update(dt, t) {
    const { stars, dust, core, grid } = scene.userData;

    /* 场景缓慢自转 */
    stars.rotation.y += 0.00012 * dt * 60;
    dust.rotation.y -= 0.0002 * dt * 60;

    /* 观测核心缓慢旋转 */
    core.rotation.y += 0.0012 * dt * 60;
    core.rotation.x = Math.sin(t * 0.08) * 0.12;

    /* 网格向观察者流动（前进感） */
    grid.position.z = (grid.position.z + 0.035 * dt * 60) % 2.5;

    /* 相机视差：鼠标 + 滚动 */
    const targetX = mouse.x * 2.4;
    const targetY = 2.2 - mouse.y * 1.4 + scrollY * 0.0012;
    camera.position.x += (targetX - camera.position.x) * 0.03;
    camera.position.y += (targetY - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    /* 流星生命周期（基于真实帧间隔） */
    meteorTimer += dt;
    if (meteorTimer > 4.5 && meteors.length < 2) {
        meteorTimer = 0;
        if (Math.random() < 0.65) spawnMeteor();
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.t += dt;
        const k = m.t / m.life;
        if (k >= 1) {
            scene.remove(m.line);
            m.line.geometry.dispose();
            m.line.material.dispose();
            meteors.splice(i, 1);
            continue;
        }
        const p = m.from.clone().lerp(m.to, k);
        m.line.geometry.setFromPoints([p, p.clone().add(m.to.clone().sub(m.from).normalize().multiplyScalar(1.6))]);
        m.line.material.opacity = 0.9 * (1 - k);
    }
}

function renderFrame() {
    renderer.render(scene, camera);
}

/* ─────────────────────── 降级方案 ─────────────────────── */

function enableFallback() {
    document.body.classList.add('fallback-scene');
    if (renderer) renderer.dispose();
}

/* ─────────────────────── 公开 API ─────────────────────── */

export function isRunning() { return running; }
