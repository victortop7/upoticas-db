import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const BASE_SCALE = 0.5; // tamanho base da lente na tela (zoom multiplica)
const R = 1;            // raio geométrico (R=1 ↔ 32,5mm; Ø65mm de referência)
const ESP_SCALE = 0.05; // mm -> unidades (~1.6× a escala real, só p/ a espessura ficar visível)
const BC = 0.12;        // sag da curvatura base (menisco SUTIL — disco fino, nunca tigela)
const THICK_GAIN = 4;   // exagera o volume de refração (transmission) p/ a lupa ficar visível

// Lente 3D girável (arraste para rodar). Espessura muda por grau/índice.
// `cor` = tom do vidro; `edgeCor` = cor sólida da borda (contraste p/ ver a espessura).
export default function LenteEspessura3D({
  centerMm, edgeMm, cor, edgeCor = '#38bdf8', zoom = 1,
}: { centerMm: number; edgeMm: number; cor: string; edgeCor?: string; zoom?: number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<THREE.Mesh | null>(null);
  const rimRef = useRef<THREE.Mesh | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const pivotRef = useRef<THREE.Group | null>(null);
  const glassRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const rimMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // ── Setup (uma vez) ──
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // leve no celular
    // transmission é caro: renderiza o buffer de refração em meia resolução (ok p/ G9 Play)
    renderer.transmissionResolutionScale = 0.5;
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.35, 3.3);

    // ── Lightbox: plano com grade quadriculada azul ATRÁS da lente ──
    // A lente refrata esse plano (transmission) — a grade distorce e dá noção de espessura/curvatura.
    const gridTex = makeGridTexture();
    const gridMat = new THREE.MeshBasicMaterial({ map: gridTex });
    const gridPlane = new THREE.Mesh(new THREE.PlaneGeometry(20, 12.5), gridMat);
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
    const spec = new THREE.DirectionalLight(0xffffff, 3.4); spec.position.set(-2.5, 3, 4); scene.add(spec); // ping especular forte (caustica/estúdio)
    const fill = new THREE.DirectionalLight(0x88aaff, 1.0); fill.position.set(-3, 1, 2); scene.add(fill);
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    // Vidro FÍSICO com refração de verdade: a grade atrás aparece distorcida (lupa)
    const glass = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(cor), metalness: 0, roughness: 0.02,
      transmission: 1, ior: 1.5, thickness: thicknessFor(centerMm, edgeMm),
      clearcoat: 1, clearcoatRoughness: 0.04, specularIntensity: 1.1,
      envMapIntensity: 1.4, side: THREE.DoubleSide,
    });
    glassRef.current = glass;

    // Borda sólida de contraste (mostra a espessura pro cliente)
    const rimMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(edgeCor), roughness: 0.3, metalness: 0.1,
      emissive: new THREE.Color(edgeCor), emissiveIntensity: 0.28,
    });
    rimMatRef.current = rimMat;

    const lens = new THREE.Mesh(buildLensGeometry(centerMm, edgeMm), glass);
    const rim = new THREE.Mesh(buildRimGeometry(edgeMm), rimMat);
    lensRef.current = lens; rimRef.current = rim;

    const group = new THREE.Group();
    group.add(lens); group.add(rim);
    group.rotation.x = Math.PI / 2;              // eixo óptico p/ frente
    group.scale.setScalar(BASE_SCALE * zoom);
    groupRef.current = group;

    // Pivô: leve inclinação + oscilação ampla (vai da frente até quase o perfil lateral,
    // onde o corte centro×borda da lente fica evidente)
    const pivot = new THREE.Group();
    pivot.add(group);
    pivot.rotation.x = -0.18;
    scene.add(pivot);
    pivotRef.current = pivot;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false; controls.enablePan = false;
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.autoRotate = false;
    controls.target.set(0, 0, 0);
    // Limita a órbita p/ a câmera nunca sair da frente do lightbox (grade sempre atrás)
    controls.minAzimuthAngle = -1.05; controls.maxAzimuthAngle = 1.05;
    controls.minPolarAngle = 1.0; controls.maxPolarAngle = 2.05;

    let dragging = false;
    controls.addEventListener('start', () => { dragging = true; });
    controls.addEventListener('end', () => { dragging = false; });

    const t0 = performance.now();
    let raf = 0;
    const animate = () => {
      if (!dragging) pivot.rotation.y = Math.sin((performance.now() - t0) * 0.00042) * 1.5;
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
      lens.geometry.dispose(); rim.geometry.dispose();
      gridPlane.geometry.dispose(); gridMat.dispose(); gridTex.dispose();
      glass.dispose(); rimMat.dispose();
      env.dispose(); pmrem.dispose(); renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Geometria (grau/índice) ──
  useEffect(() => {
    if (lensRef.current) { lensRef.current.geometry.dispose(); lensRef.current.geometry = buildLensGeometry(centerMm, edgeMm); }
    if (rimRef.current) { rimRef.current.geometry.dispose(); rimRef.current.geometry = buildRimGeometry(edgeMm); }
    if (glassRef.current) glassRef.current.thickness = thicknessFor(centerMm, edgeMm); // refração acompanha a espessura
  }, [centerMm, edgeMm]);

  // ── Cores ──
  useEffect(() => { if (glassRef.current) glassRef.current.color = new THREE.Color(cor); }, [cor]);
  useEffect(() => {
    if (rimMatRef.current) { rimMatRef.current.color = new THREE.Color(edgeCor); rimMatRef.current.emissive = new THREE.Color(edgeCor); }
  }, [edgeCor]);

  // ── Zoom ──
  useEffect(() => { if (groupRef.current) groupRef.current.scale.setScalar(BASE_SCALE * zoom); }, [zoom]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />;
}

// Volume de refração do vidro (unidades locais — o scale do objeto é aplicado pelo shader)
const thicknessFor = (centerMm: number, edgeMm: number) =>
  Math.max(0.06, Math.max(centerMm, edgeMm) * ESP_SCALE * THICK_GAIN);

// Textura procedural do lightbox: grade quadriculada clara sobre azul + ponto de luz central
function makeGridTexture(): THREE.CanvasTexture {
  const W = 1024, H = 640; // proporção do plano (20 × 12.5) → células quadradas
  const cnv = document.createElement('canvas');
  cnv.width = W; cnv.height = H;
  const ctx = cnv.getContext('2d')!;

  // Fundo azul iluminado (lightbox): mais claro no centro, escurece nas bordas
  const bg = ctx.createRadialGradient(W * 0.5, H * 0.44, H * 0.05, W * 0.5, H * 0.5, W * 0.62);
  bg.addColorStop(0, '#2e5f9f');
  bg.addColorStop(0.45, '#173a6e');
  bg.addColorStop(1, '#081630');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Ponto de luz concentrado (a "caustica" do lightbox atrás da lente)
  const hot = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, H * 0.32);
  hot.addColorStop(0, 'rgba(238,248,255,0.85)');
  hot.addColorStop(0.35, 'rgba(180,220,255,0.32)');
  hot.addColorStop(1, 'rgba(180,220,255,0)');
  ctx.fillStyle = hot;
  ctx.fillRect(0, 0, W, H);

  const cell = 32; // grade fina
  ctx.strokeStyle = 'rgba(160,205,255,0.38)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= W; x += cell) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
  for (let y = 0; y <= H; y += cell) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
  ctx.stroke();

  const major = cell * 4; // grade maior (mais brilhante)
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
// Grau negativo (Te > Tc) → perfil ") (" côncavo, centro fino e borda grossa.
// Grau positivo (Tc > Te) → perfil "( )" convexo tipo lupa, centro grosso e borda fina.
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
  geo.translate(0, midAt(R), 0); // acompanha o menisco no bordo
  return geo;
}
