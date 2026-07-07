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
 * Magpie Familiar — a sleek black-feathered bird with a vivid
 * orange beak and a long metallic tail. Black/white/orange palette
 * for a sharp, slightly ominous silhouette.
 */
export default function MagpieFamiliar({ config, state }: Props) {
  const rootRef = useRef<THREE.Group>(null);
  const wingLRef = useRef<THREE.Group>(null);
  const wingRRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const bellyMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((frameState, delta) => {
    const t = frameState.clock.elapsedTime;
    const targets = getStateTargets(state);
    applyStateToGroup(rootRef.current, targets, t, delta);

    // Wing flap
    const flapMul = state === 'happy' ? 1.8 : state === 'sleeping' ? 0.15 : state === 'tired' ? 0.4 : 1;
    const flap = Math.sin(t * 5) * 0.25 * flapMul;
    if (wingLRef.current) wingLRef.current.rotation.z = 0.2 + flap;
    if (wingRRef.current) wingRRef.current.rotation.z = -0.2 - flap;

    // Tail wag — subtle sideways swing.
    const wagAmp = state === 'happy' ? 0.3 : state === 'sleeping' ? 0.05 : 0.15;
    if (tailRef.current) tailRef.current.rotation.y = Math.sin(t * 3) * wagAmp;

    // Belly sheen shift.
    if (bellyMatRef.current) {
      bellyMatRef.current.emissiveIntensity =
        config.emissiveIntensity * targets.emissiveMultiplier * 0.5;
    }

    // Tired: nod. Sad: shake.
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

  const targets = getStateTargets(state);
  const bellyColor = config.accentColor ?? '#f8fafc';
  const beakColor = config.ornamentColor ?? '#f97316';

  return (
    <group ref={rootRef}>
      <Float
        speed={targets.floatSpeed}
        floatIntensity={targets.floatIntensity}
        rotationIntensity={targets.rotationIntensity}
      >
        {/* Body — glossy black sphere */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.55, 32, 32]} />
          <meshStandardMaterial
            color={config.primaryColor}
            metalness={config.metalness}
            roughness={config.roughness}
          />
        </mesh>

        {/* Belly — flattened white sphere in front */}
        <mesh position={[0, -0.05, 0.32]} scale={[0.7, 0.85, 0.55]} castShadow>
          <sphereGeometry args={[0.4, 24, 24]} />
          <meshStandardMaterial
            ref={bellyMatRef}
            color={bellyColor}
            emissive={config.emissiveColor}
            emissiveIntensity={config.emissiveIntensity * 0.5}
            metalness={0.2}
            roughness={0.5}
          />
        </mesh>

        {/* Head — smaller black sphere on top */}
        <mesh position={[0, 0.55, 0.05]} castShadow>
          <sphereGeometry args={[0.34, 32, 32]} />
          <meshStandardMaterial
            color={config.primaryColor}
            metalness={config.metalness}
            roughness={config.roughness}
          />
        </mesh>

        {/* Beak — orange cone pointing forward */}
        <mesh position={[0, 0.5, 0.42]} rotation={[Math.PI * 0.5, 0, 0]} castShadow>
          <coneGeometry args={[0.1, 0.35, 8]} />
          <meshStandardMaterial color={beakColor} metalness={0.3} roughness={0.45} />
        </mesh>

        {/* Eyes — white spheres with tiny black pupils */}
        <mesh position={[0.12, 0.62, 0.27]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color={bellyColor} roughness={0.3} />
        </mesh>
        <mesh position={[-0.12, 0.62, 0.27]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color={bellyColor} roughness={0.3} />
        </mesh>
        <mesh position={[0.13, 0.62, 0.31]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshStandardMaterial color="#000000" metalness={0.5} roughness={0.2} />
        </mesh>
        <mesh position={[-0.13, 0.62, 0.31]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshStandardMaterial color="#000000" metalness={0.5} roughness={0.2} />
        </mesh>

        {/* Left wing — long horizontal feathered plane extending sideways */}
        <group ref={wingLRef} position={[0.45, 0.1, -0.05]} rotation={[0, 0, 0.2]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.25, 0, 0]} castShadow>
            <planeGeometry args={[0.9, 0.35]} />
            <meshStandardMaterial
              color={config.primaryColor}
              metalness={0.7}
              roughness={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* Right wing — mirrored */}
        <group ref={wingRRef} position={[-0.45, 0.1, -0.05]} rotation={[0, 0, -0.2]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[-0.25, 0, 0]} castShadow>
            <planeGeometry args={[0.9, 0.35]} />
            <meshStandardMaterial
              color={config.primaryColor}
              metalness={0.7}
              roughness={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* Tail — long metallic black plane behind, wagging */}
        <group ref={tailRef} position={[0, -0.05, -0.55]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.7]} castShadow>
            <planeGeometry args={[0.25, 1.4]} />
            <meshStandardMaterial
              color={config.primaryColor}
              metalness={0.85}
              roughness={0.25}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      </Float>
    </group>
  );
}
