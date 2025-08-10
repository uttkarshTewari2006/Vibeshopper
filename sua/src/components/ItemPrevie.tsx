import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { Gltf, Environment, CameraControls } from '@react-three/drei'

export default function App() {
  return (
    <Canvas camera={{ position: [-1, 0.5, 3] }}>
      <Scene />

      <Environment background>
        <mesh scale={100}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshBasicMaterial color="#393939" side={THREE.BackSide} />
        </mesh>
      </Environment>
      <spotLight position={[7, 7, 7]} castShadow intensity={50} shadow-bias={-0.0001} />
      <ambientLight intensity={1} />
      <CameraControls />
      <gridHelper args={[30, 30, 30]} position-y=".01" />
      <axesHelper args={[5]} />
    </Canvas>
  )
}

function Scene() {

  return (
    <>
      <Gltf src={'https://www.meubelbaas.nl/cdn/shop/3d/models/o/3dab4e5b5f7fb2ce/7806139457721.glb'} />
    </>
  )
}
