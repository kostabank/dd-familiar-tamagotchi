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
 * Dragon Familiar — a small wyrm-pup with iridescent wings
 * and a sinuous tail. Teal/cyan low-poly dark-fantasy styling.
 */
export default function DragonFamiliar({ config, state }: Props) {
  const rootRef = useRef<THREE.Group>(null);
  const wingLRef = useRef<THREE.Group>(null);
  const wingRRef = useRef<THREE.Group>(null);
  const tail1Ref = useRef<THREE.Group>(null);
  const tail2Ref = useRef<THREE.Group>(null);
  const tail3Ref = useRef<THREE.Group>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const headMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((frameState, delta) => {
    const t = frameState.clock.elapsedTime;
    const targets = getStateTargets(state);
    applyStateToGroup(rootRef.current, targets, t, delta);

    const flapMul = state === 'happy' ? 1.6 : state === 'sleeping' ? 0.2 : state === 'tired' ? 0.5 : 1;
    const flap = Math.sin(t * 4) * 0.2 * flapMul;
    if (wingLRef.current) wingLRef.current.rotation.z = 0.5 + flap;
    if (wingRRef.current) wingRRef.current.rotation.z = -0.5 - flap;

    // Sinuous tail — each segment adds an offset rotation.
    const tailAmp = state === 'happy' ? 0.35 : state === 'sleeping' ? 0.08 : 0.22;
    if (tail1Ref.current) tail1Ref.current.rotation.y = Math.sin(t * 1.8) * tailAmp;
    if (tail2Ref.current) tail2Ref.current.rotation.y = Math.sin(t * 1.8 + 0.8) * tailAmp;
    if (tail3Ref.current) tail3Ref.current.rotation.y = Math.sin(t * 1.8 + 1.6) * tailAmp;

    // Emissive dim on body/head subtle glow.
    if (bodyMatRef.current) {
      bodyMatRef.current.emissiveIntensity =
        config.emissiveIntensity * targets.emissiveMultiplier * 0.6;
    }
    if (headMatRef.current) {
      headMatRef.current.emissiveIntensity =
        config.emissiveIntensity * targets.emissiveMultiplier * 0.6;
    }

    // Tired: gentle nod. Sad: shake.
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

  return (
    <group ref={rootRef}>
      <Float
        speed={targets.floatSpeed}
        floatIntensity={targets.floatIntensity}
        rotationIntensity={targets.rotationIntensity}
      >
        {/* Body — elongated teal sphere */}
        <mesh scale={[1, 0.7, 1.4]} castShadow receiveShadow>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial
            ref={bodyMatRef}
            color={config.primaryColor}
            emissive={config.emissiveColor}
            emissiveIntensity={config.emissiveIntensity * 0.6}
            metalness={config.metalness}
            roughness={config.roughness}
          />
        </mesh>

        {/* Head — smaller sphere at the front */}
        <mesh position={[0, 0.15, 0.9]} castShadow>
          <sphereGeometry args={[0.42, 32, 32]} />
          <meshStandardMaterial
            ref={headMatRef}
            color={config.primaryColor}
            emissive={config.emissiveColor}
            emissiveIntensity={config.emissiveIntensity * 0.6}
            metalness={config.metalness}
            roughness={config.roughness}
          />
        </mesh>

        {/* Horn — small forward-tilted cone on the nose */}
        <mesh position={[0, 0.4, 1.15]} rotation={[Math.PI * 0.65, 0, 0]} castShadow>
          <coneGeometry args={[0.08, 0.3, 8]} />
          <meshStandardMaterial
            color={config.ornamentColor ?? '#134e4a'}
            metalness={0.3}
            roughness={0.6}
          />
        </mesh>

        {/* Eyes — two tiny dark spheres on the head */}
        <mesh position={[0.15, 0.28, 1.22]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.4} roughness={0.2} />
        </mesh>
        <mesh position={[-0.15, 0.28, 1.22]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.4} roughness={0.2} />
        </mesh>

        {/* Left wing — iridescent membrane plane */}
        <group ref={wingLRef} position={[0.5, 0.2, 0.1]} rotation={[0, 0, 0.5]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <planeGeometry args={[0.8, 0.5]} />
            <meshPhysicalMaterial
              color={config.accentColor ?? '#5eead4'}
              transmission={0.6}
              roughness={0.1}
              thickness={0.5}
              iridescence={1}
              iridescenceIOR={1.5}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
            />
          </mesh>
        </group>

        {/* Right wing */}
        <group ref={wingRRef} position={[-0.5, 0.2, 0.1]} rotation={[0, 0, -0.5]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <planeGeometry args={[0.8, 0.5]} />
            <meshPhysicalMaterial
              color={config.accentColor ?? '#5eead4'}
              transmission={0.6}
              roughness={0.1}
              thickness={0.5}
              iridescence={1}
              iridescenceIOR={1.5}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
            />
          </mesh>
        </group>

        {/* Tail — chained spheres, each parented to the previous */}
        <group ref={tail1Ref} position={[0, 0, -0.85]}>
          <mesh castShadow>
            <sphereGeometry args={[0.28, 20, 20]} />
            <meshStandardMaterial
              color={config.primaryColor}
              emissive={config.emissiveColor}
              emissiveIntensity={config.emissiveIntensity * 0.4}
              metalness={config.metalness}
              roughness={config.roughness}
            />
          </mesh>
          <group ref={tail2Ref} position={[0, 0, -0.3]}>
            <mesh castShadow>
              <sphereGeometry args={[0.22, 20, 20]} />
              <meshStandardMaterial
                color={config.primaryColor}
                emissive={config.emissiveColor}
                emissiveIntensity={config.emissiveIntensity * 0.4}
                metalness={config.metalness}
                roughness={config.roughness}
              />
            </mesh>
            <group ref={tail3Ref} position={[0, 0, -0.28]}>
              <mesh castShadow>
                <sphereGeometry args={[0.16, 20, 20]} />
                <meshStandardMaterial
                  color={config.accentColor ?? '#5eead4'}
                  emissive={config.emissiveColor}
                  emissiveIntensity={config.emissiveIntensity * 0.6}
                  metalness={config.metalness}
                  roughness={config.roughness}
                />
              </mesh>
              {/* Tail tip spike */}
              <mesh position={[0, 0, -0.18]} rotation={[Math.PI * 0.5, 0, 0]}>
                <coneGeometry args={[0.06, 0.2, 8]} />
                <meshStandardMaterial
                  color={config.ornamentColor ?? '#134e4a'}
                  metalness={0.5}
                  roughness={0.4}
                />
              </mesh>
            </group>
          </group>
        </group>
      </Float>
    </group>
  );
}
