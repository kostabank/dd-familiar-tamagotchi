'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HeartBurstProps {
  /** Increments to trigger a new burst. */
  trigger: number;
  color?: string;
}

/**
 * Renders a burst of N glowing hearts/octahedrons that float up and fade out
 * whenever `trigger` increments. Sits inside the FamiliarCanvas.
 */
export default function HeartBurst({ trigger, color = '#ec4899' }: HeartBurstProps) {
  const COUNT = 10;
  const groupRef = useRef<THREE.Group>(null);
  const lastTrigger = useRef(0);
  const particles = useRef(
    Array.from({ length: COUNT }, () => ({
      active: false,
      t: 0, // 0..1 progress
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      rot: 0,
    })),
  );
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  const positions = useMemo(() => {
    // Pre-allocate; actual positions set per-burst.
    return new Float32Array(COUNT * 3);
  }, []);

  useFrame((_, delta) => {
    // Detect a new trigger.
    if (trigger !== lastTrigger.current) {
      lastTrigger.current = trigger;
      for (let i = 0; i < COUNT; i++) {
        const p = particles.current[i];
        p.active = true;
        p.t = 0;
        p.x = (Math.random() - 0.5) * 0.4;
        p.y = 0.2;
        p.z = (Math.random() - 0.5) * 0.4;
        p.vx = (Math.random() - 0.5) * 0.6;
        p.vy = 1.2 + Math.random() * 0.8;
        p.vz = (Math.random() - 0.5) * 0.6;
        p.rot = Math.random() * Math.PI;
      }
    }

    for (let i = 0; i < COUNT; i++) {
      const p = particles.current[i];
      const mesh = meshRefs.current[i];
      if (!mesh) continue;
      if (!p.active) {
        mesh.visible = false;
        continue;
      }
      p.t += delta * 0.6; // ~1.6s lifetime
      if (p.t >= 1) {
        p.active = false;
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;
      // Slow upward drift, slight horizontal settle.
      p.vy *= 0.96;
      mesh.position.set(p.x, p.y, p.z);
      mesh.rotation.z = p.rot + p.t * 2;
      mesh.rotation.y = p.t * 1.5;
      const scale = 0.12 * (1 - Math.abs(p.t - 0.3));
      mesh.scale.setScalar(Math.max(0.01, scale));
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = 1 - p.t;
      mat.emissiveIntensity = 1.4 * (1 - p.t);
    }
    void positions;
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: COUNT }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { meshRefs.current[i] = el; }}
          visible={false}
        >
          {/* Heart-ish: use a small octahedron scaled wider — stylized. */}
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.4}
            transparent
            opacity={0}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
