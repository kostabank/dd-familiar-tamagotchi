'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';

interface AuraProps {
  color: string;
  /** 0..1 — controls sparkle opacity + ring emissive. */
  intensity?: number;
}

/**
 * Stage-3 magical aura: a slowly rotating halo ring + orbiting sigil ring on
 * the ground + drifting sparkle cloud. Shared across all species to give the
 * "evolved to maximum" feel.
 *
 * Sits inside the species model group (which already applies stage scale), so
 * all coordinates are in the model's local space.
 */
export default function Aura({ color, intensity = 1 }: AuraProps) {
  const haloRef = useRef<THREE.Mesh>(null);
  const sigilRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (haloRef.current) {
      haloRef.current.rotation.z += delta * 0.4;
      haloRef.current.rotation.y += delta * 0.15;
    }
    if (sigilRef.current) {
      sigilRef.current.rotation.z -= delta * 0.6;
    }
  });

  return (
    <group>
      {/* Halo ring above the head */}
      <mesh ref={haloRef} position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.025, 12, 64]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.6 * intensity}
          toneMapped={false}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Glowing sigil beneath the creature */}
      <mesh ref={sigilRef} position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.1, 0.04, 12, 6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.4 * intensity}
          toneMapped={false}
          transparent
          opacity={0.75}
        />
      </mesh>
      {/* Sigil inner triangle (decorative) */}
      <mesh position={[0, -1.04, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 6]}>
        <ringGeometry args={[0.6, 0.7, 3]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.0 * intensity}
          toneMapped={false}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Drifting sparkle cloud around the creature */}
      <Sparkles
        count={50}
        scale={[2.6, 2.6, 2.6]}
        size={3}
        speed={0.35}
        opacity={0.7 * intensity}
        color={color}
      />
    </group>
  );
}
