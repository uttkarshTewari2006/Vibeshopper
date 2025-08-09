import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { Group } from "three";

const MODEL_URL = new URL("../public/model.glb", import.meta.url).href;

type RotatingCartProps = {
  radius?: number;
  speed?: number;
  heightClassName?: string;
  scale?: number;
};

function CartModel({ scale = 1 }: { scale?: number }) {
  const gltf = useGLTF(MODEL_URL);
  return <primitive object={gltf.scene} scale={scale} />;
}

function OrbitingCart({
  radius,
  speed,
  scale,
}: {
  radius: number;
  speed: number;
  scale: number;
}) {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius;
    if (groupRef.current) {
      groupRef.current.position.set(x, 0, z);
      groupRef.current.rotation.y = -t + Math.PI / 2;
    }
  });

  return (
    <group ref={groupRef}>
      <CartModel scale={scale} />
    </group>
  );
}

export function RotatingCart({
  radius = 1.2,
  speed = 0.7,
  heightClassName = "h-48",
  scale = 0.5,
}: RotatingCartProps) {
  return (
    <div
      className={`w-full ${heightClassName} rounded-xl overflow-hidden bg-white`}
    >
      <Canvas camera={{ position: [0, 1.2, 3], fov: 55 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <OrbitingCart radius={radius} speed={speed} scale={scale} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
