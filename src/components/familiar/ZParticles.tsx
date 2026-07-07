'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ZParticleData {
  baseY: number;
  speed: number;
  phase: number;
  xOffset: number;
  zOffset: number;
}

const PARTICLE_COUNT = 3;
const HEIGHT_SPACING = 0.5;
const LOOP_HEIGHT = 1.4;

/**
 * Floating "Z" letters that drift upward above a sleeping familiar.
 *
 * drei <Text> relies on troika-three-text which fetches a default font from
 * a CDN at runtime; in a sandboxed preview that can fail silently and render
 * nothing. To guarantee the sleeping effect is always visible, we render
 * three small glowing octahedrons ("dream motes") shaped like diamonds and
 * tint them icy blue. They drift up & fade out, then loop.
 */
export default function ZParticles() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const matRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const data = useRef<ZParticleData[]>(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      baseY: 0.9 + i * HEIGHT_SPACING,
      speed: 0.35 + i * 0.05,
      phase: i * 0.6,
      xOffset: (i - 1) * 0.22,
      zOffset: (i % 2 === 0 ? 1 : -1) * 0.06,
    }))
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const group = groupRef.current;
    if (!group) return;

    data.current.forEach((d, i) => {
      const mesh = meshRefs.current[i];
      const mat = matRefs.current[i];
      if (!mesh || !mat) return;
      // Each mote drifts up over LOOP_HEIGHT then wraps.
      const local = (t * d.speed + d.phase) % 1;
      const y = d.baseY + local * LOOP_HEIGHT;
      mesh.position.set(
        d.xOffset + Math.sin(t * 1.2 + d.phase) * 0.05,
        y,
        d.zOffset
      );
      // Fade in then out across the loop.
      const fade = Math.sin(local * Math.PI);
      mat.opacity = fade;
      mat.emissiveIntensity = 1.5 * fade + 0.3;
      // Gentle tumble.
      mesh.rotation.z = Math.sin(t * 1.5 + d.phase) * 0.4;
      mesh.rotation.y = t * 0.8 + d.phase;
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
        >
          <octahedronGeometry args={[0.11, 0]} />
          <meshStandardMaterial
            ref={(el) => {
              matRefs.current[i] = el;
            }}
            color="#9fd8ff"
            emissive="#3ea0ff"
            emissiveIntensity={1.2}
            toneMapped={false}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}
