'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import type { FamiliarState, ModelConfig } from '@/lib/types';
import { getStateTargets, applyStateToGroup } from '../state-anim';

interface Props {
  config: ModelConfig;
  state: FamiliarState;
}

/**
 * Construct Familiar — a hovering low-poly arcane automaton.
 * Matte-metal octahedron shell with a glowing core inside,
 * encircled by two orbital rings of different radii & axes.
 * A single emissive eye sits on one face.
 */
export default function ConstructFamiliar({ config, state }: Props) {
  const rootRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const coreMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const eyeMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((frameState, delta) => {
    const t = frameState.clock.elapsedTime;
    const targets = getStateTargets(state);
    applyStateToGroup(rootRef.current, targets, t, delta);

    // Ring rotations — faster when happy, barely when sleeping.
    const ringMul =
      state === 'happy' ? 2.2 : state === 'sleeping' ? 0.15 : state === 'hungry' ? 0.4 : 1;
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * 0.6 * ringMul;
      ring1Ref.current.rotation.y += delta * 0.35 * ringMul;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y += delta * 0.8 * ringMul;
      ring2Ref.current.rotation.z += delta * 0.5 * ringMul;
    }

    // Core emissive pulse, scaled by state.
    const pulse = 0.85 + Math.sin(t * 2) * 0.15;
    if (coreMatRef.current) {
      coreMatRef.current.emissiveIntensity =
        config.emissiveIntensity * targets.emissiveMultiplier * pulse;
    }
    if (eyeMatRef.current) {
      eyeMatRef.current.emissiveIntensity =
        config.emissiveIntensity * targets.emissiveMultiplier * 1.2;
    }

    // Tired: nod off wobble. Sad: small shake.
    if (rootRef.current) {
      if (state === 'tired') {
        rootRef.current.rotation.x += Math.sin(t * 1.5) * 0.02;
      } else if (state === 'sad') {
        rootRef.current.position.x = Math.sin(t * 20) * 0.02;
      } else {
        rootRef.current.position.x = THREE.MathUtils.lerp(rootRef.current.position.x, 0, 0.1);
      }
    }
  });

  const floatSpeed = getStateTargets(state).floatSpeed;
  const floatIntensity = getStateTargets(state).floatIntensity;
  const rotationIntensity = getStateTargets(state).rotationIntensity;

  return (
    <group ref={rootRef}>
      <Float
        speed={floatSpeed}
        floatIntensity={floatIntensity}
        rotationIntensity={rotationIntensity}
      >
        {/* Outer shell — matte metal octahedron */}
        <mesh castShadow receiveShadow>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={config.primaryColor}
            metalness={config.metalness}
            roughness={config.roughness}
            flatShading
          />
        </mesh>

        {/* Glowing arcane core inside the shell */}
        <mesh>
          <sphereGeometry args={[0.28, 32, 32]} />
          <meshStandardMaterial
            ref={coreMatRef}
            color={config.emissiveColor}
            emissive={config.emissiveColor}
            emissiveIntensity={config.emissiveIntensity}
            toneMapped={false}
          />
        </mesh>

        {/* Eye — single emissive sphere on the +X+Y+Z face */}
        <mesh position={[0.45, 0.45, 0.45]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial
            ref={eyeMatRef}
            color={config.emissiveColor}
            emissive={config.emissiveColor}
            emissiveIntensity={config.emissiveIntensity}
            toneMapped={false}
          />
        </mesh>

        {/* Inner ring — tighter, faster */}
        <mesh ref={ring1Ref}>
          <torusGeometry args={[1.4, 0.03, 16, 80]} />
          <meshStandardMaterial
            color={config.emissiveColor}
            emissive={config.emissiveColor}
            emissiveIntensity={config.emissiveIntensity * 0.7}
            metalness={0.8}
            roughness={0.3}
            toneMapped={false}
          />
        </mesh>

        {/* Outer ring — perpendicular axis, larger */}
        <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.6, 0.02, 16, 80]} />
          <meshStandardMaterial
            color={config.primaryColor}
            metalness={config.metalness}
            roughness={0.35}
          />
        </mesh>
      </Float>
    </group>
  );
}
