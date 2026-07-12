import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const BASE_SCALE = 0.5; // tamanho base da lente na tela (zoom multiplica)
const R = 1;            // raio geométrico (diâmetro = 2)
const ESP_SCALE = 0.08; // mm -> unidades (exagera p/ ver a espessura)
const BC = 0.6;         // curvatura base (dome do bloco — mostra a espessura interna)

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
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.35, 3.3);

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

    const key = new THREE.DirectionalLight(0xffffff, 3.4); key.position.set(3, 4, 3); scene.add(key);
    const spec = new THREE.DirectionalLight(0xffffff, 2.6); spec.position.set(-2.5, 3, 4); scene.add(spec);
    const fill = new THREE.DirectionalLight(0x88aaff, 1.2); fill.position.set(-3, 1, 2); scene.add(fill);
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    // Vidro reflexivo/espelhado (reflexos fortes p/ a lente "brilhar" e aparecer)
    const glass = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(cor), metalness: 0, roughness: 0.02,
      clearcoat: 1, clearcoatRoughness: 0.02, reflectivity: 1,
      transparent: true, opacity: 0.33, envMapIntensity: 2.6, side: THREE.DoubleSide,
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

    // Pivô: inclina p/ revelar a curvatura interna e oscila (vista 3/4, nunca de perfil)
    const pivot = new THREE.Group();
    pivot.add(group);
    pivot.rotation.x = -0.34;
    scene.add(pivot);
    pivotRef.current = pivot;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false; controls.enablePan = false;
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.autoRotate = false;
    controls.target.set(0, 0, 0);

    let dragging = false;
    controls.addEventListener('start', () => { dragging = true; });
    controls.addEventListener('end', () => { dragging = false; });

    const t0 = performance.now();
    let raf = 0;
    const animate = () => {
      if (!dragging) pivot.rotation.y = Math.sin((performance.now() - t0) * 0.0006) * 0.6;
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

const espAt = (r: number, Tc: number, Te: number) => Tc + (Te - Tc) * (r / R) * (r / R);
const midAt = (r: number) => -BC * (r / R) * (r / R);

// Corpo da lente (perfil revolvido, com curvatura base tipo bloco).
function buildLensGeometry(centerMm: number, edgeMm: number): THREE.LatheGeometry {
  const Tc = Math.max(0.02, centerMm * ESP_SCALE);
  const Te = Math.max(0.02, edgeMm * ESP_SCALE);
  const seg = 40;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= seg; i++) { const r = (i / seg) * R; pts.push(new THREE.Vector2(r, midAt(r) - espAt(r, Tc, Te) / 2)); }
  for (let i = seg; i >= 0; i--) { const r = (i / seg) * R; pts.push(new THREE.Vector2(r, midAt(r) + espAt(r, Tc, Te) / 2)); }
  const geo = new THREE.LatheGeometry(pts, 96);
  geo.computeVertexNormals();
  return geo;
}

// Anel da borda: mostra a espessura no bordo com cor sólida de contraste.
function buildRimGeometry(edgeMm: number): THREE.CylinderGeometry {
  const Te = Math.max(0.02, edgeMm * ESP_SCALE);
  const geo = new THREE.CylinderGeometry(R + 0.004, R + 0.004, Te, 96, 1, true);
  geo.translate(0, midAt(R), 0); // acompanha a curvatura base no bordo
  return geo;
}
