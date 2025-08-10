import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { GLTFLoader } from 'three-stdlib';
import * as THREE from 'three';

export interface PreviewModel {
  id: string;
  url: string;
  title?: string;
}

interface RoomPreviewProps {
  models: PreviewModel[];
  onClose: () => void;
}

export function RoomPreview({ models, onClose }: RoomPreviewProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80">
      <div className="absolute inset-0 bg-white">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 px-3 py-1 text-xs bg-gray-800 text-white rounded"
        >
          Close
        </button>
        <Canvas
          shadows
          camera={{ position: [0, 6, 9], fov: 50, near: 0.1, far: 200 }}
          dpr={[1, 2]}
        >
          <RendererSettings />
          <color attach="background" args={[0.95, 0.96, 0.98]} />
          {/* Floor only */}
          <Floor />
          {/* Lights */}
          <ambientLight intensity={0.35} />
          <hemisphereLight color={0xffffff} groundColor={0x777777} intensity={1.0} />
          <directionalLight castShadow position={[4, 8, 6]} intensity={1.4} shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
          <ObliqueCamera count={models.length} />

          {/* Place models with spacing; custom floor-constrained drag logic */}
          {models.map((m, idx) => (
            <DraggableModel key={m.id} url={m.url} index={idx} total={models.length} />
          ))}
        </Canvas>
      </div>
    </div>
  );
}

function Floor() {
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0 });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color={floorMat.color} roughness={floorMat.roughness} metalness={floorMat.metalness} />
      </mesh>
      <gridHelper args={[14, 28, 0xdddddd, 0xeeeeee]} position={[0, 0.01, 0]} />
    </group>
  );
}

function Model({ url, position = [0, 0, 0] as [number, number, number] }: { url: string; position?: [number, number, number] }) {
  const gltf = useLoader(GLTFLoader, url);
  console.log('gltf url: ', url);
  // Auto-scale model to a sensible size and place on floor
  const scene = gltf.scene.clone(true);
  let materialCount = 0;
  try {
    scene.traverse((obj: any) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) {
            // Ensure physically-based materials render with color and textures
            if (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshPhysicalMaterial) {
              materialCount += 1;
              // Debug logs to validate materials/textures
              console.log('[RoomPreview] Material found', {
                url,
                mesh: obj.name,
                name: m.name,
                color: m.color?.getHexString?.(),
                metalness: (m as any).metalness,
                roughness: (m as any).roughness,
                map: !!m.map,
                normalMap: !!m.normalMap,
                envMap: !!m.envMap,
              });
              m.needsUpdate = true;
              m.side = THREE.FrontSide;
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('[RoomPreview] Error while traversing materials', { url, error });
  }
  if (materialCount === 0) {
    console.warn('[RoomPreview] No PBR materials detected on model', { url });
  }

  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const scale = size.y > 0 ? 1.2 / size.y : 1;
  scene.scale.setScalar(scale);
  scene.position.set(-center.x * scale + position[0], -box.min.y * scale + position[1], -center.z * scale + position[2]);

  return <primitive object={scene} />;
}

function DraggableModel({ url, index, total }: { url: string; index: number; total: number }) {
  // Initial spread placement along X-axis with generous spacing to avoid overlap
  const startX = index * 2.0 - (total - 1) * 1.0;
  const start = [startX, 0, 0] as [number, number, number];
  const { camera, gl } = useThree();
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // y=0 floor
  const ndc = new THREE.Vector2();
  const tempVec = new THREE.Vector3();
  const groupRef = useRef<THREE.Group | null>(null);

  // Pointer tracking for drag vs rotate
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const isDraggingRef = useRef<boolean>(false);
  const isRotatingRef = useRef<boolean>(false);
  const offsetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const lastAngleRef = useRef<number>(0);

  // We wrap the loaded model in a group to update its position/rotation interactively
  // The child model stays at local origin; the group manages world translation
  const model = <Model url={url} position={[0, 0, 0]} />;

  function getFloorPoint(event: any): THREE.Vector3 {
    // Normalize across mouse/touch/pointer events
    const cx = event.clientX ?? event?.nativeEvent?.clientX ?? (event.touches?.[0]?.clientX ?? 0);
    const cy = event.clientY ?? event?.nativeEvent?.clientY ?? (event.touches?.[0]?.clientY ?? 0);
    const rect = gl.domElement.getBoundingClientRect();
    ndc.x = ((cx - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((cy - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    raycaster.ray.intersectPlane(plane, tempVec);
    return tempVec.clone();
  }

  function updatePointer(e: any, add: boolean) {
    const cx = e.clientX ?? e?.nativeEvent?.clientX ?? (e.touches?.[0]?.clientX ?? 0);
    const cy = e.clientY ?? e?.nativeEvent?.clientY ?? (e.touches?.[0]?.clientY ?? 0);
    const pt = { x: cx, y: cy };
    const map = pointersRef.current;
    if (add) map.set(e.pointerId, pt); else map.delete(e.pointerId);
  }

  function computeAngle(): number | null {
    const entries = Array.from(pointersRef.current.values());
    if (entries.length < 2) return null;
    const [a, b] = entries;
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  function onPointerDown(e: any) {
    e.stopPropagation();
    updatePointer(e, true);
    const twoFinger = pointersRef.current.size >= 2 || e.touches?.length >= 2;
    if (twoFinger) {
      isRotatingRef.current = true;
      isDraggingRef.current = false;
      const angle = computeAngle();
      if (angle != null) lastAngleRef.current = angle;
    } else {
      isDraggingRef.current = true;
      isRotatingRef.current = false;
      const hit = getFloorPoint(e);
      const group = groupRef.current;
      if (!group) return;
      offsetRef.current.copy(group.position).sub(hit);
    }
    // Avoid pointer capture to ensure pointerup/cancel bubble back reliably
  }

  function onPointerMove(e: any) {
    const group = groupRef.current;
    if (!group) return;
    // Track pointer coordinates continuously
    updatePointer(e, true);

    // If a second finger is introduced mid-gesture, switch to rotate mode
    if (pointersRef.current.size >= 2 && !isRotatingRef.current) {
      isRotatingRef.current = true;
      isDraggingRef.current = false;
      const ang = computeAngle();
      if (ang != null) lastAngleRef.current = ang;
    }

    if (isRotatingRef.current) {
      const angle = computeAngle();
      if (angle == null) return;
      const delta = angle - lastAngleRef.current;
      lastAngleRef.current = angle;
      group.rotation.y += delta;
      return;
    }
    if (!isDraggingRef.current) return;
    const hit = getFloorPoint(e);
    // Recompute NDC bounds each move to avoid stale offset limits
    const pos = hit.add(offsetRef.current);
    group.position.set(pos.x, 0, pos.z);
  }

  function onPointerUp(e: any) {
    updatePointer(e, false);
    if (pointersRef.current.size < 2) {
      isRotatingRef.current = false;
    }
    if (pointersRef.current.size === 0) {
      isDraggingRef.current = false;
    } else if (pointersRef.current.size === 1) {
      // Return to dragging with the remaining pointer; recompute offset
      const remaining = Array.from(pointersRef.current.values())[0];
      const fakeEvt = { clientX: remaining.x, clientY: remaining.y } as any;
      const hit = getFloorPoint(fakeEvt);
      const group = groupRef.current;
      if (group) offsetRef.current.copy(group.position).sub(hit);
      isDraggingRef.current = true;
    }
  }

  function onPointerCancel(e: any) {
    updatePointer(e, false);
    isDraggingRef.current = false;
    isRotatingRef.current = false;
  }

  return (
    <group
      ref={(node: any) => {
        if (node && groupRef.current !== node) {
          groupRef.current = node;
          // Set initial position once, then manage imperatively
          node.position.set(start[0], start[1], start[2]);
        }
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerCancel}
    >
      {model}
    </group>
  );
}

function ObliqueCamera({ count }: { count: number }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const spacing = 2.0;
    const halfWidth = Math.max(1, (count - 1) * spacing * 0.5 + 1.2);
    // compute horizontal fov
    const aspect = size.width / size.height;
    const vFov = ((camera as any).fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(1, aspect));
    const distance = halfWidth / Math.tan(hFov / 2) + 3; // margin
    (camera as any).position.set(0, 5.5, Math.min(Math.max(distance, 6), 18));
    (camera as any).lookAt(0, 0.5, 0);
    (camera as any).updateProjectionMatrix();
  }, [camera, size, count]);
  return null;
}

function RendererSettings() {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    // Slightly higher exposure to brighten materials
    // @ts-ignore - toneMappingExposure exists on WebGLRenderer
    gl.toneMappingExposure = 1.25;
    // Ensure correct color space for textures
    // @ts-ignore - outputColorSpace exists on WebGLRenderer in newer three
    gl.outputColorSpace = (THREE as any).SRGBColorSpace ?? (THREE as any).sRGBEncoding;
  }, [gl]);
  return null;
}

// Removed AutoFrame; FixedCamera provides a stable top-down view


