import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Lente 3D girável (arraste para rodar). Espessura muda por grau/índice.
export default function LenteEspessura3D({ centerMm, edgeMm, cor }: { centerMm: number; edgeMm: number; cor: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const matRef = useRef<THREE.MeshPhysicalMaterial | null>(null);

  // ── Setup (uma vez) ──
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(1.4, 0.9, 3.0);

    // Ambiente para reflexos de vidro (sem arquivo externo)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;

    // Luzes
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 4, 3); scene.add(key);
    const fill = new THREE.DirectionalLight(0x88aaff, 1.0); fill.position.set(-3, 1, 2); scene.add(fill);
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    // Material de vidro
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(cor),
      metalness: 0, roughness: 0.05,
      transmission: 0.9, thickness: 1.2, ior: 1.52,
      clearcoat: 1, clearcoatRoughness: 0.06,
      transparent: true, opacity: 1, envMapIntensity: 1.4,
      side: THREE.DoubleSide,
    });
    matRef.current = mat;

    const mesh = new THREE.Mesh(buildLensGeometry(centerMm, edgeMm), mat);
    mesh.rotation.x = Math.PI / 2; // eixo óptico para frente
    const group = new THREE.Group(); group.add(mesh); scene.add(group);
    meshRef.current = mesh;

    // Controles: arrasta pra girar + gira sozinho
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false; controls.enablePan = false;
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.autoRotate = true; controls.autoRotateSpeed = 1.6;
    controls.target.set(0, 0, 0);

    let raf = 0;
    const animate = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(animate); };
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
      mesh.geometry.dispose();
      mat.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Atualiza geometria quando grau/índice mudam ──
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.geometry.dispose();
    mesh.geometry = buildLensGeometry(centerMm, edgeMm);
  }, [centerMm, edgeMm]);

  // ── Atualiza cor ──
  useEffect(() => {
    if (matRef.current) matRef.current.color = new THREE.Color(cor);
  }, [cor]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />;
}

// Gera a geometria da lente (perfil revolvido). Espessura exagerada p/ visualização.
function buildLensGeometry(centerMm: number, edgeMm: number): THREE.LatheGeometry {
  const R = 1;               // raio (diâmetro = 2)
  const scale = 0.05;        // mm -> unidades (exagera p/ ver a lente)
  const Tc = Math.max(0.02, centerMm * scale);
  const Te = Math.max(0.02, edgeMm * scale);
  const seg = 48;
  const pts: THREE.Vector2[] = [];
  // superfície de trás (r: 0 -> R)
  for (let i = 0; i <= seg; i++) {
    const r = (i / seg) * R;
    const t = Tc + (Te - Tc) * (r / R) * (r / R);
    pts.push(new THREE.Vector2(r, -t / 2));
  }
  // superfície da frente (r: R -> 0)
  for (let i = seg; i >= 0; i--) {
    const r = (i / seg) * R;
    const t = Tc + (Te - Tc) * (r / R) * (r / R);
    pts.push(new THREE.Vector2(r, t / 2));
  }
  const geo = new THREE.LatheGeometry(pts, 120);
  geo.computeVertexNormals();
  return geo;
}
