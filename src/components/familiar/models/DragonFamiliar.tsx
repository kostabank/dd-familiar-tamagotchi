'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import type { FamiliarState, ModelConfig } from '@/lib/types';
import { getStateTargets, applyStateToGroup, breathingScale, blinkScale, idleBob } from '../state-anim';
import Aura from './Aura';

interface Props {
  config: ModelConfig;
  stage: 1 | 2 | 3;
  state: FamiliarState;
}

/**
 * Dragon Familiar — a cute, polished chibi wyrm.
 *
 * Design philosophy:
 *  - Strong, recognizable silhouette readable from any angle.
 *  - Chibi proportions: big head (~45% of body), huge glowing eyes, stubby limbs.
 *  - Layered detail: body + belly + horns + dorsal crest + wings + tail + claws.
 *  - Emissive eyes + belly glow → bloom makes them shine like a game character.
 *  - All materials use smooth shading (no flatShading) for an organic look.
 *
 * Stage progression:
 *  - Stage 1: baby — small nub horns, tiny wings, short tail, no crest.
 *  - Stage 2: juvenile — longer horns (branched), dorsal crest, bigger wings, longer tail + spade.
 *  - Stage 3: ancient — aura/halo, extra spines, brighter emissive, wing claws.
 */
export default function DragonFamiliar({ config, stage, state }: Props) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const wingLRef = useRef<THREE.Group>(null);
  const wingRRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const eyeLRef = useRef<THREE.Group>(null);
  const eyeRRef = useRef<THREE.Group>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const bellyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const eyeMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const ornaments = config.ornaments ?? [];
  const hasAura = stage >= 3 || ornaments.includes('aura');
  const hasSigil = stage >= 3 || ornaments.includes('sigil');
  const auraColor = config.auraColor ?? config.emissiveColor;
  const bellyColor = config.accentColor ?? '#f0fdfa';
  const hornColor = '#f5f0e0';
  const clawColor = '#2a2a3e';

  useFrame((frameState, delta) => {
    const t = frameState.clock.elapsedTime;
    const targets = getStateTargets(state);
    applyStateToGroup(rootRef.current, targets, t, delta);
    if (rootRef.current) {
      rootRef.current.position.y = targets.groupPositionY + idleBob(state, t);
    }
    if (bodyRef.current) {
      const b = breathingScale(state, t);
      bodyRef.current.scale.set(b, b, b);
    }
    const flapMul = state === 'happy' ? 1.9 : state === 'sleeping' ? 0.12 : state === 'tired' ? 0.4 : 1;
    const flap = Math.sin(t * 5) * 0.32 * flapMul;
    if (wingLRef.current) wingLRef.current.rotation.z = 0.4 + flap;
    if (wingRRef.current) wingRRef.current.rotation.z = -0.4 - flap;
    const tailAmp = state === 'happy' ? 0.42 : state === 'sleeping' ? 0.05 : 0.24;
    if (tailRef.current) tailRef.current.rotation.y = Math.sin(t * 2) * tailAmp;
    const blink = blinkScale(state, t);
    if (eyeLRef.current) eyeLRef.current.scale.y = blink;
    if (eyeRRef.current) eyeRRef.current.scale.y = blink;
    const stageBoost = stage >= 3 ? 1.5 : stage === 2 ? 1.2 : 1;
    if (bodyMatRef.current) bodyMatRef.current.emissiveIntensity = config.emissiveIntensity * targets.emissiveMultiplier * 0.35 * stageBoost;
    if (bellyMatRef.current) bellyMatRef.current.emissiveIntensity = config.emissiveIntensity * targets.emissiveMultiplier * 0.2 * stageBoost;
    if (eyeMatRef.current) eyeMatRef.current.emissiveIntensity = 1.4 * targets.emissiveMultiplier * stageBoost;
    if (rootRef.current) {
      if (state === 'tired') rootRef.current.rotation.x += Math.sin(t * 1.5) * 0.02;
      else if (state === 'sad') rootRef.current.position.x = Math.sin(t * 20) * 0.02;
      else if (state === 'hungry') rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, 0.12, 0.05);
      else {
        rootRef.current.position.x = THREE.MathUtils.lerp(rootRef.current.position.x, 0, 0.1);
        if (state !== 'tired') rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, 0, 0.05);
      }
      if (headRef.current) {
        if (state === 'sad') headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0.2, 0.05);
        else headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0, 0.05);
      }
    }
  });

  const targets = getStateTargets(state);

  return (
    <group ref={rootRef}>
      <Float speed={targets.floatSpeed} floatIntensity={targets.floatIntensity} rotationIntensity={targets.rotationIntensity}>
        <group ref={bodyRef}>
          {/* ===== BODY — chubby egg, smooth ===== */}
          <mesh scale={[0.9, 1.0, 0.85]} castShadow receiveShadow>
            <sphereGeometry args={[0.7, 48, 36]} />
            <meshStandardMaterial
              ref={bodyMatRef}
              color={config.primaryColor}
              emissive={config.emissiveColor}
              emissiveIntensity={config.emissiveIntensity * 0.35}
              metalness={config.metalness}
              roughness={config.roughness}
            />
          </mesh>

          {/* ===== BELLY — lighter underside ===== */}
          <mesh position={[0, -0.15, 0.42]} scale={[0.58, 0.65, 0.4]} castShadow>
            <sphereGeometry args={[0.5, 32, 28]} />
            <meshStandardMaterial
              ref={bellyMatRef}
              color={bellyColor}
              emissive={config.emissiveColor}
              emissiveIntensity={config.emissiveIntensity * 0.2}
              metalness={0.1}
              roughness={0.55}
            />
          </mesh>

          {/* Dorsal spines along the back */}
          {Array.from({ length: stage >= 2 ? 5 : 3 }, (_, i) => {
            const z = -0.1 - i * 0.24;
            const y = 0.58 - Math.abs(i - 1.5) * 0.04;
            const h = (stage >= 2 ? 0.2 : 0.14) - i * 0.02;
            return (
              <mesh key={i} position={[0, y, z]} rotation={[0.35, 0, 0]} castShadow>
                <coneGeometry args={[0.07, h, 8]} />
                <meshStandardMaterial color={hornColor} metalness={0.4} roughness={0.45} />
              </mesh>
            );
          })}

          {/* ===== HEAD — big, slightly squashed, smooth ===== */}
          <group ref={headRef} position={[0, 0.78, 0.15]}>
            <mesh scale={[1.0, 0.92, 0.98]} castShadow>
              <sphereGeometry args={[0.6, 48, 36]} />
              <meshStandardMaterial
                color={config.primaryColor}
                emissive={config.emissiveColor}
                emissiveIntensity={config.emissiveIntensity * 0.35}
                metalness={config.metalness}
                roughness={config.roughness}
              />
            </mesh>

            {/* Snout / muzzle */}
            <mesh position={[0, -0.1, 0.52]} scale={[0.85, 0.7, 0.95]} castShadow>
              <sphereGeometry args={[0.3, 32, 24]} />
              <meshStandardMaterial color={bellyColor} metalness={0.1} roughness={0.55} />
            </mesh>

            {/* Nostrils */}
            <mesh position={[0.1, -0.02, 0.74]}>
              <sphereGeometry args={[0.038, 12, 12]} />
              <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
            </mesh>
            <mesh position={[-0.1, -0.02, 0.74]}>
              <sphereGeometry args={[0.038, 12, 12]} />
              <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
            </mesh>

            {/* Horns — prominent, curved-back, bone-colored */}
            {([
              { x: 0.22, rot: 0.3 },
              { x: -0.22, rot: -0.3 },
            ] as const).map((h, i) => (
              <group key={i} position={[h.x, 0.52, -0.02]} rotation={[0.4, 0, h.rot]}>
                <mesh castShadow>
                  <coneGeometry args={[0.075, stage >= 2 ? 0.5 : 0.34, 10]} />
                  <meshStandardMaterial color={hornColor} metalness={0.5} roughness={0.4} />
                </mesh>
                {stage >= 2 && (
                  <mesh position={[0, 0.18, 0.07]} rotation={[-0.6, 0, 0]} castShadow>
                    <coneGeometry args={[0.042, 0.2, 8]} />
                    <meshStandardMaterial color={hornColor} metalness={0.5} roughness={0.4} />
                  </mesh>
                )}
              </group>
            ))}

            {/* ===== EYES — huge, glowing, with whites + iris + pupil + shine ===== */}
            {([
              { x: 0.22, group: eyeLRef },
              { x: -0.22, group: eyeRRef },
            ] as const).map((e, i) => (
              <group key={i} ref={e.group} position={[e.x, 0.08, 0.44]}>
                {/* Eye white */}
                <mesh scale={[1, 1.18, 0.6]}>
                  <sphereGeometry args={[0.17, 28, 24]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.05} />
                </mesh>
                {/* Iris — emissive, will bloom */}
                <mesh position={[0, 0, 0.08]}>
                  <sphereGeometry args={[0.105, 24, 20]} />
                  <meshStandardMaterial
                    ref={i === 0 ? eyeMatRef : undefined}
                    color={config.emissiveColor}
                    emissive={config.emissiveColor}
                    emissiveIntensity={1.4}
                    roughness={0.25}
                    toneMapped={false}
                  />
                </mesh>
                {/* Pupil */}
                <mesh position={[0, 0, 0.14]}>
                  <sphereGeometry args={[0.058, 16, 14]} />
                  <meshStandardMaterial color="#0a0a0a" roughness={0.2} />
                </mesh>
                {/* Eye shine highlight */}
                <mesh position={[0.045, 0.055, 0.17]}>
                  <sphereGeometry args={[0.024, 10, 10]} />
                  <meshBasicMaterial color="#ffffff" toneMapped={false} />
                </mesh>
              </group>
            ))}

            {/* Smile */}
            <mesh position={[0, -0.22, 0.48]} rotation={[Math.PI * 0.5, 0, Math.PI]}>
              <torusGeometry args={[0.1, 0.018, 10, 20, Math.PI]} />
              <meshStandardMaterial color="#1a1a2e" roughness={0.6} />
            </mesh>
          </group>

          {/* ===== WINGS — bat-style, large, visible from front ===== */}
          {([
            { ref: wingLRef, x: 0.6, rot: 0.6, dir: 1 },
            { ref: wingRRef, x: -0.6, rot: -0.6, dir: -1 },
          ] as const).map((w, i) => (
            <group key={i} ref={w.ref} position={[w.x, 0.45, 0.02]} rotation={[0, 0, w.rot]}>
              {/* Wing arm bone */}
              <mesh rotation={[0, 0, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.03, 0.6, 10]} />
                <meshStandardMaterial color={hornColor} metalness={0.4} roughness={0.5} />
              </mesh>
              {/* Finger bones — fan out */}
              {Array.from({ length: stage >= 2 ? 3 : 2 }, (_, j) => {
                const angle = -0.7 + j * 0.7;
                return (
                  <mesh key={j} position={[w.dir * (0.16 + j * 0.06), 0.25, 0]} rotation={[0, 0, angle]} castShadow>
                    <cylinderGeometry args={[0.022, 0.014, 0.44, 8]} />
                    <meshStandardMaterial color={hornColor} metalness={0.4} roughness={0.5} />
                  </mesh>
                );
              })}
              {/* Membrane — opaque, colored */}
              <mesh position={[w.dir * 0.26, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <planeGeometry args={[0.68, 0.5]} />
                <meshStandardMaterial
                  color={config.accentColor ?? bellyColor}
                  roughness={0.35}
                  metalness={0.15}
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.92}
                  emissive={config.emissiveColor}
                  emissiveIntensity={config.emissiveIntensity * 0.4}
                />
              </mesh>
              {stage >= 2 && (
                <mesh position={[w.dir * 0.42, 0.42, 0]} rotation={[0, 0, 0.3]} castShadow>
                  <coneGeometry args={[0.035, 0.12, 6]} />
                  <meshStandardMaterial color={clawColor} metalness={0.6} roughness={0.3} />
                </mesh>
              )}
            </group>
          ))}

          {/* ===== TAIL — curled, tapering, with spade tip ===== */}
          <group ref={tailRef} position={[0, -0.15, -0.62]}>
            <mesh position={[0, -0.1, -0.16]} rotation={[0.5, 0, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.14, 0.42, 18]} />
              <meshStandardMaterial color={config.primaryColor} metalness={config.metalness} roughness={config.roughness} />
            </mesh>
            <mesh position={[0, -0.3, -0.46]} rotation={[1.0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.14, 0.08, 0.4, 16]} />
              <meshStandardMaterial color={config.primaryColor} metalness={config.metalness} roughness={config.roughness} />
            </mesh>
            {/* Spade tip */}
            <mesh position={[0, -0.44, -0.66]} rotation={[1.3, 0, 0]} castShadow>
              <coneGeometry args={[0.13, 0.24, 5]} />
              <meshStandardMaterial color={hornColor} metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0.08, -0.42, -0.64]} rotation={[1.3, 0, 0.7]} castShadow>
              <coneGeometry args={[0.055, 0.15, 5]} />
              <meshStandardMaterial color={hornColor} metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[-0.08, -0.42, -0.64]} rotation={[1.3, 0, -0.7]} castShadow>
              <coneGeometry args={[0.055, 0.15, 5]} />
              <meshStandardMaterial color={hornColor} metalness={0.5} roughness={0.4} />
            </mesh>
          </group>

          {/* ===== LEGS — stubby with foot + claws ===== */}
          {([
            { x: 0.32, z: 0.45 },
            { x: -0.32, z: 0.45 },
            { x: 0.3, z: -0.25 },
            { x: -0.3, z: -0.25 },
          ] as const).map((leg, i) => (
            <group key={i} position={[leg.x, -0.62, leg.z]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.14, 0.11, 0.24, 16]} />
                <meshStandardMaterial color={config.primaryColor} metalness={config.metalness} roughness={config.roughness} />
              </mesh>
              <mesh position={[0, -0.15, 0.05]} scale={[1, 0.6, 1.35]} castShadow>
                <sphereGeometry args={[0.11, 16, 14]} />
                <meshStandardMaterial color={bellyColor} metalness={0.1} roughness={0.55} />
              </mesh>
              {[0, 1, 2].map((c) => (
                <mesh key={c} position={[(c - 1) * 0.05, -0.21, 0.11]} rotation={[0.4, 0, (c - 1) * 0.28]} castShadow>
                  <coneGeometry args={[0.027, 0.08, 6]} />
                  <meshStandardMaterial color={clawColor} metalness={0.6} roughness={0.3} />
                </mesh>
              ))}
            </group>
          ))}
        </group>

        {hasAura && <Aura color={auraColor} intensity={stage >= 3 ? 1 : 0.6} />}
        {!hasAura && hasSigil && (
          <mesh position={[0, -1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.1, 0.03, 10, 6]} />
            <meshStandardMaterial color={auraColor} emissive={auraColor} emissiveIntensity={1.1} toneMapped={false} transparent opacity={0.6} />
          </mesh>
        )}
      </Float>
    </group>
  );
}
