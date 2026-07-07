'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
  active: boolean;
  emissiveColor?: string;
  onComplete: () => void;
}

const DURATION = 2.0; // seconds before onComplete fires
const PEAK_AT = 0.75; // seconds when point light is brightest
const CAMERA_DEFAULT_Z = 5;
const CAMERA_ZOOM_Z = 3.2;

/**
 * Evolution overlay rendered inside the Canvas.
 * When `active` becomes true:
 *   - spins a group very fast around Y,
 *   - flashes a point light 0 -> 10 -> 0,
 *   - bursts Sparkles,
 *   - dollies the camera slightly inward then back out,
 *   - after ~2s calls onComplete.
 */
export default function EvolutionAnimation({ active, emissiveColor = '#a855f7', onComplete }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const { camera } = useThree();

  const elapsedRef = useRef(0);
  const startedRef = useRef(false);
  const doneRef = useRef(false);

  // Reset state whenever `active` flips to true.
  useEffect(() => {
    if (active) {
      elapsedRef.current = 0;
      startedRef.current = true;
      doneRef.current = false;
    }
  }, [active]);

  useFrame((_, delta) => {
    if (!active || !startedRef.current) return;

    elapsedRef.current += delta;
    const elapsed = elapsedRef.current;

    // Spin fast throughout the animation.
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 8;
    }

    // Point light: rise to peak then fall, 0 over ~1.5s.
    if (lightRef.current) {
      const lightT = Math.min(elapsed / 1.5, 1);
      const intensity = Math.sin(lightT * Math.PI) * 10;
      lightRef.current.intensity = intensity;
    }

    // Camera dolly: zoom in for the first 60%, back out for the last 40%.
    const camT = Math.min(elapsed / DURATION, 1);
    const camCurve = camT < 0.6 ? camT / 0.6 : 1 - (camT - 0.6) / 0.4;
    const targetZ = CAMERA_DEFAULT_Z - (CAMERA_DEFAULT_Z - CAMERA_ZOOM_Z) * camCurve;
    // Direct camera mutation is an idiomatic R3F pattern inside useFrame.
    // eslint-disable-next-line react-hooks/immutability
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.15);

    // Fire onComplete once at the end.
    if (elapsed >= DURATION && !doneRef.current) {
      doneRef.current = true;
      // Snap camera back to default after the burst.
      camera.position.z = CAMERA_DEFAULT_Z;
      if (lightRef.current) lightRef.current.intensity = 0;
      onComplete();
    }
  });

  if (!active) return null;

  return (
    <group ref={groupRef}>
      <pointLight
        ref={lightRef}
        position={[0, 0, 0]}
        intensity={0}
        color={emissiveColor}
        distance={12}
        decay={2}
      />
      <Sparkles
        count={60}
        scale={6}
        size={4}
        speed={0.6}
        color={emissiveColor}
        opacity={1}
      />
    </group>
  );
}
