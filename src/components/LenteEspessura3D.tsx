import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const BASE_SCALE = 0.42; // tamanho base de cada lente (menor: cabem as duas)
const R = 1;            // raio geométrico (R=1 ↔ 32,5mm; Ø65mm de referência)
const ESP_SCALE = 0.05; // mm -> unidades (~1.6× a escala real, só p/ a espessura ficar visível)
const BC = 0.12;        // sag da curvatura base (menisco SUTIL — disco fino, nunca tigela)
const THICK_GAIN = 4;   // exagera o volume de refração (transmission) p/ a lupa ficar visível
const OFFSET = 1.02;    // distância de cada lente ao centro (OD à esquerda, OE à direita)

interface EyeThick { centerMm: number; edgeMm: number; }
interface Asm {
  eyeGroup: THREE.Group; lensGroup: THREE.Group;
  lens: THREE.Mesh; rim: THREE.Mesh;
  glass: THREE.MeshPhysicalMaterial; rimMat: THREE.MeshStandardMaterial;
}

// Par de lentes 3D girável (arraste para rodar). Cada olho tem sua espessura por grau/índice.
// `od` = olho direito (esquerda da tela), `oe` = olho esquerdo (direita da tela).
export default function LenteEspessura3D({
  od, oe, cor, edgeCor = '#38bdf8', zoom = 1,
}: { od: EyeThick; oe: EyeThick; cor: string; edgeCor?: string; zoom?: number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const asmRef = useRef<Asm[]>([]);

  // ── Setup (uma vez) ──
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // leve no celular
    // transmissão é cara: renderiza o buffer de refração em meia resolução (ok p/ G9 Play)
    renderer.transmissionResolutionScale = 0.5;
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.35, 4.4);

    // ── Lightbox: plano com grade quadriculada azul ATRÁS das lentes ──
    const gridTex = makeGridTexture();
    const gridMat = new THREE.MeshBasicMaterial({ map: gridTex });
    const gridPlane = new THREE.Mesh(new THREE.PlaneGeometry(24, 15), gridMat);
    gridPlane.position.set(0, 0, -2.3);
    scene.add(gridPlane);

    // Ambiente p/ reflexos: estúdio + faixas de luz brilhantes (efeito espelho na lente)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envBase = new RoomEnvironment();
    const barMat = new THREE.MeshBasicMaterial(); barMat.color.setRGB(5, 5.3, 6);
    const addBar = (w: number, h: number, px: number, py: number, pz: number, rx: number, ry: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), barMat);
      m.position.set(px, py, pz); m.rotation.set(rx, ry, 0); envBase.add(m);
    };
    addBar(12, 2.6, 0, 6, -1, -Math.PI / 2.2, 0);   // faixa de luz superior
    addBar(2.6, 9, -6.5, 1, 2, 0, Math.PI / 2.4);   // softbox lateral esquerdo
    addBar(2.2, 8, 6, 2, 3, 0, -Math.PI / 3);       // reflexo lateral direito
    const env = pmrem.fromScene(envBase, 0.02).texture;
    scene.environment = env;

    const key = new THREE.DirectionalLight(0xffffff, 3.0); key.position.set(3, 4, 3); scene.add(key);
    const spec = new THREE.DirectionalLight(0xffffff, 3.4); spec.position.set(-2.5, 3, 4); scene.add(spec);
    const fill = new THREE.DirectionalLight(0x88aaff, 1.0); fill.position.set(-3, 1, 2); scene.add(fill);
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    // Container (leve inclinação). Cada olho gira em torno do seu próprio eixo.
    const pivot = new THREE.Group();
    pivot.rotation.x = -0.18;
    scene.add(pivot);

    const buildAsm = (t: EyeThick, xOffset: number): Asm => {
      const glass = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(cor), metalness: 0, roughness: 0.02,
        transmission: 1, ior: 1.5, thickness: thicknessFor(t.centerMm, t.edgeMm),
        clearcoat: 1, clearcoatRoughness: 0.04, specularIntensity: 1.1,
        envMapIntensity: 1.4, side: THREE.DoubleSide,
      });
      const rimMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(edgeCor), roughness: 0.3, metalness: 0.1,
        emissive: new THREE.Color(edgeCor), emissiveIntensity: 0.28,
      });
      const lens = new THREE.Mesh(buildLensGeometry(t.centerMm, t.edgeMm), glass);
      const rim = new THREE.Mesh(buildRimGeometry(t.edgeMm), rimMat);
      const lensGroup = new THREE.Group();
      lensGroup.add(lens); lensGroup.add(rim);
      lensGroup.rotation.x = Math.PI / 2;            // eixo óptico p/ frente
      lensGroup.scale.setScalar(BASE_SCALE * zoom);
      const eyeGroup = new THREE.Group();
      eyeGroup.add(lensGroup);
      eyeGroup.position.x = xOffset;                 // posição do olho (gira em torno de si)
      pivot.add(eyeGroup);
      return { eyeGroup, lensGroup, lens, rim, glass, rimMat };
    };

    // OD à esquerda da tela, OE à direita
    asmRef.current = [buildAsm(od, -OFFSET), buildAsm(oe, +OFFSET)];

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false; controls.enablePan = false;
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.target.set(0, 0, 0);
    controls.minAzimuthAngle = -1.05; controls.maxAzimuthAngle = 1.05;
    controls.minPolarAngle = 1.0; controls.maxPolarAngle = 2.05;

    let dragging = false;
    controls.addEventListener('start', () => { dragging = true; });
    controls.addEventListener('end', () => { dragging = false; });

    const t0 = performance.now();
    let raf = 0;
    const animate = () => {
      if (!dragging) {
        const osc = Math.sin((performance.now() - t0) * 0.00042) * 1.5;
        for (const a of asmRef.current) a.eyeGroup.rotation.y = osc;
      }
      controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      for (const a of asmRef.current) {
        a.lens.geometry.dispose(); a.rim.geometry.dispose();
        a.glass.dispose(); a.rimMat.dispose();
      }
      asmRef.current = [];
      gridPlane.geometry.dispose(); gridMat.dispose(); gridTex.dispose();
      env.dispose(); pmrem.dispose(); renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Geometria (grau/índice) por olho ──
  useEffect(() => {
    const eyes = [od, oe];
    asmRef.current.forEach((a, i) => {
      const t = eyes[i]; if (!t) return;
      a.lens.geometry.dispose(); a.lens.geometry = buildLensGeometry(t.centerMm, t.edgeMm);
      a.rim.geometry.dispose(); a.rim.geometry = buildRimGeometry(t.edgeMm);
      a.glass.thickness = thicknessFor(t.centerMm, t.edgeMm);
    });
  }, [od.centerMm, od.edgeMm, oe.centerMm, oe.edgeMm]);

  // ── Cores ──
  useEffect(() => { for (const a of asmRef.current) a.glass.color = new THREE.Color(cor); }, [cor]);
  useEffect(() => {
    for (const a of asmRef.current) { a.rimMat.color = new THREE.Color(edgeCor); a.rimMat.emissive = new THREE.Color(edgeCor); }
  }, [edgeCor]);

  // ── Zoom ──
  useEffect(() => { for (const a of asmRef.current) a.lensGroup.scale.setScalar(BASE_SCALE * zoom); }, [zoom]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />;
}

// Volume de refração do vidro (unidades locais — o scale do objeto é aplicado pelo shader)
const thicknessFor = (centerMm: number, edgeMm: number) =>
  Math.max(0.06, Math.max(centerMm, edgeMm) * ESP_SCALE * THICK_GAIN);

// Textura procedural do lightbox: grade quadriculada clara sobre azul + ponto de luz central
function makeGridTexture(): THREE.CanvasTexture {
  const W = 1024, H = 640;
  const cnv = document.createElement('canvas');
  cnv.width = W; cnv.height = H;
  const ctx = cnv.getContext('2d')!;

  const bg = ctx.createRadialGradient(W * 0.5, H * 0.44, H * 0.05, W * 0.5, H * 0.5, W * 0.62);
  bg.addColorStop(0, '#2e5f9f');
  bg.addColorStop(0.45, '#173a6e');
  bg.addColorStop(1, '#081630');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const hot = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, H * 0.32);
  hot.addColorStop(0, 'rgba(238,248,255,0.85)');
  hot.addColorStop(0.35, 'rgba(180,220,255,0.32)');
  hot.addColorStop(1, 'rgba(180,220,255,0)');
  ctx.fillStyle = hot;
  ctx.fillRect(0, 0, W, H);

  const cell = 32;
  ctx.strokeStyle = 'rgba(160,205,255,0.38)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= W; x += cell) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
  for (let y = 0; y <= H; y += cell) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
  ctx.stroke();

  const major = cell * 4;
  ctx.strokeStyle = 'rgba(205,232,255,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= W; x += major) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y <= H; y += major) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();

  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Espessura no raio r: interpola centro→borda (quadrático, como numa lente esférica).
const espAt = (r: number, Tc: number, Te: number) => Tc + (Te - Tc) * (r / R) * (r / R);
// Superfície média: menisco sutil (sag BC). A forma vem da espessura, não da curvatura.
const midAt = (r: number) => -BC * (r / R) * (r / R);

// Corpo da lente: disco fino revolvido em torno da superfície média curva.
function buildLensGeometry(centerMm: number, edgeMm: number): THREE.LatheGeometry {
  const Tc = Math.max(0.02, centerMm * ESP_SCALE);
  const Te = Math.max(0.02, edgeMm * ESP_SCALE);
  const seg = 36;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= seg; i++) { const r = (i / seg) * R; pts.push(new THREE.Vector2(r, midAt(r) - espAt(r, Tc, Te) / 2)); }
  for (let i = seg; i >= 0; i--) { const r = (i / seg) * R; pts.push(new THREE.Vector2(r, midAt(r) + espAt(r, Tc, Te) / 2)); }
  const geo = new THREE.LatheGeometry(pts, 64);
  geo.computeVertexNormals();
  return geo;
}

// Anel da borda: mostra a espessura no bordo com cor sólida de contraste.
function buildRimGeometry(edgeMm: number): THREE.CylinderGeometry {
  const Te = Math.max(0.02, edgeMm * ESP_SCALE);
  const geo = new THREE.CylinderGeometry(R + 0.004, R + 0.004, Te, 64, 1, true);
  geo.translate(0, midAt(R), 0);
  return geo;
}
