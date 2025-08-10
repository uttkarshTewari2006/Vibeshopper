import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { Group } from "three";

const MODEL_URL = new URL("../public/model.glb", import.meta.url).href;

type RotatingCartProps = {
  // Kept for backward compatibility (no longer used for orbit)
  radius?: number;
  // Alias for spinSpeed if provided
  speed?: number;
  heightClassName?: string;
  scale?: number;
  spinSpeed?: number;
  swayAmplitude?: number;
  swaySpeed?: number;
  bobAmplitude?: number;
  bobSpeed?: number;
};

function CartModel({ scale = 1 }: { scale?: number }) {
  const gltf = useGLTF(MODEL_URL);
  return <primitive object={gltf.scene} scale={scale} />;
}

function AnimatedCart({
  scale,
  spinSpeed,
  swayAmplitude,
  swaySpeed,
  bobAmplitude,
  bobSpeed,
}: {
  scale: number;
  spinSpeed: number;
  swayAmplitude: number;
  swaySpeed: number;
  bobAmplitude: number;
  bobSpeed: number;
}) {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    const sway = Math.sin(t * swaySpeed) * swayAmplitude; // left-right
    const bob = Math.sin(t * bobSpeed + Math.PI / 2) * bobAmplitude; // subtle up-down
    const yaw = t * spinSpeed; // spin in place
    const roll = Math.sin(t * swaySpeed) * 0.08; // slight tilt while swaying
    const pitch = 0.15; // tilt slightly forward

    if (groupRef.current) {
      groupRef.current.position.set(sway, bob, 0);
      groupRef.current.rotation.set(pitch, yaw, roll);
    }
  });

  return (
    <group ref={groupRef}>
      <CartModel scale={scale} />
    </group>
  );
}

export function RotatingCart({
  radius = 0, // ignored now
  speed,
  heightClassName = "h-48",
  scale = 0.5,
  spinSpeed = speed ?? 0.9,
  swayAmplitude = 0.2,
  swaySpeed = 1.2,
  bobAmplitude = 0.1,
  bobSpeed = 1.0,
}: RotatingCartProps) {
  return (
    <div
      className={`relative w-full ${heightClassName} rounded-xl overflow-hidden bg-white p-0`}
    >
      <Canvas
        className="absolute inset-0 m-0 block w-full h-full"
        camera={{ position: [0, 1.2, 3], fov: 55 }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <AnimatedCart
            scale={scale}
            spinSpeed={spinSpeed}
            swayAmplitude={swayAmplitude}
            swaySpeed={swaySpeed}
            bobAmplitude={bobAmplitude}
            bobSpeed={bobSpeed}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
