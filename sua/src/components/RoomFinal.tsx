import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PerspectiveCamera, CubeCamera, Grid, useGLTF, TransformControls } from '@react-three/drei'
import * as THREE from 'three'

export interface RoomFinalModel {
  id: string
  url: string
  title?: string
}

interface RoomFinalProps {
  models: RoomFinalModel[]
  onClose: () => void
}

export function RoomFinal({ models, onClose }: RoomFinalProps) {
  // Keep floor and grid size in one place for consistency
  const FLOOR_SIZE = 14
  return (
    <div className="fixed inset-0 z-50 bg-black/80">
      <div className="absolute inset-0 bg-white">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 px-3 py-1 text-xs bg-gray-800 text-white rounded"
        >
          Close
        </button>

        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[0, 8, 18]} fov={45} near={0.1} far={300} />

          {/* Lights */}
          <ambientLight intensity={0.35} />
          <hemisphereLight color={0xffffff} groundColor={0x777777} intensity={1.0} />
          <directionalLight castShadow position={[4, 8, 6]} intensity={1.4} shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

          {/* Floor */}
          <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
              <meshStandardMaterial color={0xffffff} roughness={0.9} metalness={0} />
            </mesh>
            <Grid infiniteGrid={false} args={[FLOOR_SIZE, FLOOR_SIZE]} cellSize={0.5} sectionSize={1} fadeDistance={0} position={[0, 0.01, 0]} />
          </group>

          {/* Simple reflection source for materials */}
          <CubeCamera frames={2} resolution={256}>
            {(texture) => (
              <group>
                <DraggableLayer envMap={texture} models={models} floorSize={FLOOR_SIZE} />
              </group>
            )}
          </CubeCamera>

          {/* Keep the entire floor and items framed */}
          <AutoFrame />
        </Canvas>
      </div>
    </div>
  )
}

function DraggableLayer({ models, envMap, floorSize }: { models: RoomFinalModel[]; envMap: THREE.Texture; floorSize: number }) {
  // Place models with spacing across X
  const positions = useMemo(() => models.map((_, i) => [i * 2.0 - (models.length - 1) * 1.0, 0, 0] as [number, number, number]), [models])
  const groupRefs = useRef<Array<THREE.Group | null>>([])
  const [selected, setSelected] = useState<number | null>(null)
  const lastSelectedRef = useRef<number | null>(null)
  const persisted = useRef<THREE.Vector3[]>(positions.map((p) => new THREE.Vector3(p[0], p[1], p[2])))
  const boundsHalf = floorSize * 0.5 - 0.25

  return (
    <group>
      {models.map((m, idx) => (
        <DraggableItem
          key={m.id}
          initialPosition={positions[idx]}
          onSelect={() => {
            lastSelectedRef.current = idx
            setSelected(idx)
          }}
          registerRef={(ref) => (groupRefs.current[idx] = ref)}
          onDragBegin={() => setSelected(null)}
          onDragFinished={() => setSelected(lastSelectedRef.current)}
          persistedPosition={persisted.current[idx]}
          boundsHalf={boundsHalf}
        >
          <GLTFItem url={m.url} envMap={envMap} />
        </DraggableItem>
      ))}

      {selected !== null && groupRefs.current[selected] && (
        <TransformControls object={groupRefs.current[selected]!} mode="rotate" size={0.6} showX={false} showZ={false} />
      )}
    </group>
  )
}

function DraggableItem({
  initialPosition,
  children,
  onSelect,
  registerRef,
  gridSnap = 0.5,
  onDragBegin,
  onDragFinished,
  boundsHalf,
  persistedPosition,
}: {
  initialPosition: [number, number, number]
  children: React.ReactNode
  onSelect?: () => void
  registerRef?: (ref: THREE.Group | null) => void
  gridSnap?: number
  onDragBegin?: () => void
  onDragFinished?: () => void
  boundsHalf: number
  persistedPosition?: THREE.Vector3
}) {
  const groupRef = useRef<THREE.Group | null>(null)
  const { camera } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])
  const floorPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const grabOffset = useRef<THREE.Vector3>(new THREE.Vector3())
  const dragging = useRef<boolean>(false)

  // removed; matrix-based dragging replaced by plane-ray dragging

  return (
    <group>
      <group
        ref={(ref) => {
          groupRef.current = ref
          registerRef?.(ref)
          if (ref && !ref.userData.__init) {
            if (persistedPosition) {
              ref.position.copy(persistedPosition)
            } else {
              ref.position.set(...initialPosition)
            }
            ref.updateMatrix()
            ref.userData.__init = true
          }
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
          onSelect?.()
          onDragBegin?.()
          const rect = (e.target as HTMLElement).getBoundingClientRect()
          const cx = e.clientX ?? e?.nativeEvent?.clientX
          const cy = e.clientY ?? e?.nativeEvent?.clientY
          ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1)
          raycaster.setFromCamera(ndc, camera as THREE.Camera)
          const hit = new THREE.Vector3()
          if (raycaster.ray.intersectPlane(floorPlane, hit) && groupRef.current) {
            grabOffset.current.copy(groupRef.current.position).sub(hit)
            dragging.current = true
          }
        }}
        onPointerMove={(e) => {
          if (!dragging.current || !groupRef.current) return
          const rect = (e.target as HTMLElement).getBoundingClientRect()
          const cx = e.clientX ?? e?.nativeEvent?.clientX
          const cy = e.clientY ?? e?.nativeEvent?.clientY
          ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1)
          raycaster.setFromCamera(ndc, camera as THREE.Camera)
          const hit = new THREE.Vector3()
          if (raycaster.ray.intersectPlane(floorPlane, hit)) {
            const next = hit.add(grabOffset.current)
            next.x = THREE.MathUtils.clamp(next.x, -boundsHalf, boundsHalf)
            next.z = THREE.MathUtils.clamp(next.z, -boundsHalf, boundsHalf)
            groupRef.current.position.set(next.x, 0, next.z)
          }
        }}
        onPointerUp={() => {
          if (!groupRef.current) return
          dragging.current = false
          const snapped = groupRef.current.position.clone()
          if (gridSnap > 0) {
            snapped.x = Math.round(snapped.x / gridSnap) * gridSnap
            snapped.z = Math.round(snapped.z / gridSnap) * gridSnap
          }
          groupRef.current.position.set(snapped.x, 0, snapped.z)
          onDragFinished?.()
        }}
        onPointerCancel={() => {
          dragging.current = false
        }}
      >
        {children}
      </group>
    </group>
  )
}

function AutoFrame() {
  const { camera, size } = useThree()
  useEffect(() => {
    // Push camera back a bit more to ensure edges are visible
    const halfWidth = 7
    const aspect = size.width / size.height
    const persp = camera as THREE.PerspectiveCamera
    const vFov = (persp.fov * Math.PI) / 180
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(1, aspect))
    const distance = halfWidth / Math.tan(hFov / 2) + 6
    persp.position.set(0, 8.5, Math.min(Math.max(distance, 12), 30))
    persp.lookAt(0, 0.5, 0)
    persp.updateProjectionMatrix()
  }, [camera, size])
  return null
}

function GLTFItem({ url, envMap }: { url: string; envMap: THREE.Texture }) {
  const gltf = useGLTF(url)

  const cloned = useMemo(() => gltf.scene.clone(true), [gltf.scene])

  useEffect(() => {
    // Apply basic PBR setup and ground to y=0
    let minY = Infinity
    cloned.traverse((obj: any) => {
      if (obj.isMesh) {
        obj.castShadow = true
        obj.receiveShadow = true
        if (obj.material && (obj.material instanceof THREE.MeshStandardMaterial || obj.material instanceof THREE.MeshPhysicalMaterial)) {
          obj.material.needsUpdate = true
          obj.material.side = THREE.FrontSide
          obj.material.envMap = envMap
          obj.material.envMapIntensity = 0.25
        }
      }
      if (obj.isMesh) {
        obj.geometry.computeBoundingBox?.()
        const bb = obj.geometry.boundingBox as THREE.Box3 | null
        if (bb) minY = Math.min(minY, bb.min.y)
      }
    })
    if (isFinite(minY)) {
      cloned.position.y -= minY
    }
  }, [cloned, envMap])

  return <primitive object={cloned} />
}

useGLTF.preload?.('/placeholder.gltf')


