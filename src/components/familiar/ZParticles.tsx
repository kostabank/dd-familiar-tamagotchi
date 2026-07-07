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
  size: number;
}

const PARTICLE_COUNT = 5;
const HEIGHT_SPACING = 0.45;
const LOOP_HEIGHT = 1.6;

// Static per-particle config — derived once at module load so we don't read
// refs during render.
const PARTICLE_CONFIG = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  baseY: 0.7 + i * HEIGHT_SPACING,
  speed: 0.3 + i * 0.06,
  phase: i * 0.5,
  xOffset: (i - (PARTICLE_COUNT - 1) / 2) * 0.18,
  zOffset: (i % 2 === 0 ? 1 : -1) * 0.08,
  size: 0.13 - i * 0.012,
}));

/**
 * Floating "dream motes" that drift upward above a sleeping familiar.
 *
 * drei <Text> relies on troika-three-text which fetches a default font from
 * a CDN at runtime; in a sandboxed preview that can fail silently and render
 * nothing. To guarantee the sleeping effect is always visible, we render
 * small glowing octahedrons ("dream motes") shaped like diamonds and tint
 * them icy blue. They drift up, sway slightly, tumble, and fade out, then loop.
 *
 * A faint connecting "dream thread" line is implied by their staggered heights.
 */
export default function ZParticles() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const matRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const data = useRef<ZParticleData[]>(PARTICLE_CONFIG.map((c) => ({ ...c })));

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
        d.xOffset + Math.sin(t * 1.2 + d.phase) * 0.08,
        y,
        d.zOffset + Math.cos(t * 0.9 + d.phase) * 0.05
      );
      // Fade in then out across the loop.
      const fade = Math.sin(local * Math.PI);
      mat.opacity = fade * 0.9;
      mat.emissiveIntensity = 1.6 * fade + 0.3;
      // Gentle tumble.
      mesh.rotation.z = Math.sin(t * 1.5 + d.phase) * 0.5;
      mesh.rotation.y = t * 0.8 + d.phase;
      mesh.rotation.x = Math.cos(t * 1.1 + d.phase) * 0.4;
    });
  });

  return (
    <group ref={groupRef}>
      {PARTICLE_CONFIG.map((cfg, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
        >
          <octahedronGeometry args={[cfg.size, 0]} />
          <meshStandardMaterial
            ref={(el) => {
              matRefs.current[i] = el;
            }}
            color="#9fd8ff"
            emissive="#3ea0ff"
            emissiveIntensity={1.4}
            toneMapped={false}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
      {/* Soft glowing halo above the sleeping creature's head */}
      <mesh position={[0, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.28, 24]} />
        <meshBasicMaterial
          color="#9fd8ff"
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
