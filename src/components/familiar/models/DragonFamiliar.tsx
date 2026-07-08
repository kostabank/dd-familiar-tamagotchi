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
 * Dragon Familiar — a cute chibi wyrm-pup.
 *
 * Design goals (vs. the old primitive version):
 *  - Big head + huge expressive eyes → instantly reads as a "cute creature".
 *  - Chubby egg-shaped body, stubby limbs → tamagotchi proportions.
 *  - Recognizable dragon features: snout, nostrils, horns, dorsal spines,
 *    bat-style wings (finger bones + membrane), curled tail with spade tip.
 *  - Belly/underbelly in a lighter accent color for visual depth.
 *
 * Stage progression:
 *  - Stage 1: base baby dragon (small horns, tiny wings, nub tail).
 *  - Stage 2: bigger horns + dorsal crest + longer tail + wing claws.
 *  - Stage 3: + aura/halo/sigil + brighter emissive + extra spines.
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

  const ornaments = config.ornaments ?? [];
  const hasAura = stage >= 3 || ornaments.includes('aura');
  const hasSigil = stage >= 3 || ornaments.includes('sigil');
  const auraColor = config.auraColor ?? config.emissiveColor;
  const bellyColor = config.accentColor ?? '#f0fdfa';

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
    const flapMul = state === 'happy' ? 1.8 : state === 'sleeping' ? 0.15 : state === 'tired' ? 0.45 : 1;
    const flap = Math.sin(t * 5) * 0.3 * flapMul;
    if (wingLRef.current) wingLRef.current.rotation.z = 0.35 + flap;
    if (wingRRef.current) wingRRef.current.rotation.z = -0.35 - flap;
    const tailAmp = state === 'happy' ? 0.4 : state === 'sleeping' ? 0.06 : 0.22;
    if (tailRef.current) tailRef.current.rotation.y = Math.sin(t * 2) * tailAmp;
    const blink = blinkScale(state, t);
    if (eyeLRef.current) eyeLRef.current.scale.y = blink;
    if (eyeRRef.current) eyeRRef.current.scale.y = blink;
    const stageBoost = stage >= 3 ? 1.4 : stage === 2 ? 1.15 : 1;
    if (bodyMatRef.current) {
      bodyMatRef.current.emissiveIntensity = config.emissiveIntensity * targets.emissiveMultiplier * 0.4 * stageBoost;
    }
    if (bellyMatRef.current) {
      bellyMatRef.current.emissiveIntensity = config.emissiveIntensity * targets.emissiveMultiplier * 0.25 * stageBoost;
    }
    if (rootRef.current) {
      if (state === 'tired') {
        rootRef.current.rotation.x += Math.sin(t * 1.5) * 0.02;
      } else if (state === 'sad') {
        rootRef.current.position.x = Math.sin(t * 20) * 0.02;
        if (headRef.current) headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0.2, 0.05);
      } else if (state === 'hungry') {
        rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, 0.12, 0.05);
      } else {
        rootRef.current.position.x = THREE.MathUtils.lerp(rootRef.current.position.x, 0, 0.1);
        if (state !== 'tired') rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, 0, 0.05);
        if (headRef.current) headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0, 0.05);
      }
    }
  });

  const targets = getStateTargets(state);
  const hornColor = '#f5f0e0';
  const spineColor = '#f5f0e0';
  const clawColor = '#1a1a2e';

  return (
    <group ref={rootRef}>
      <Float speed={targets.floatSpeed} floatIntensity={targets.floatIntensity} rotationIntensity={targets.rotationIntensity}>
        <group ref={bodyRef}>
          {/* ===== BODY — chubby egg shape ===== */}
          <mesh scale={[0.85, 0.95, 0.85]} castShadow receiveShadow>
            <sphereGeometry args={[0.7, 40, 32]} />
            <meshStandardMaterial
              ref={bodyMatRef}
              color={config.primaryColor}
              emissive={config.emissiveColor}
              emissiveIntensity={config.emissiveIntensity * 0.4}
              metalness={config.metalness}
              roughness={config.roughness}
            />
          </mesh>

          {/* ===== BELLY — lighter underside ===== */}
          <mesh position={[0, -0.12, 0.42]} scale={[0.55, 0.6, 0.35]} castShadow>
            <sphereGeometry args={[0.5, 28, 24]} />
            <meshStandardMaterial
              ref={bellyMatRef}
              color={bellyColor}
              emissive={config.emissiveColor}
              emissiveIntensity={config.emissiveIntensity * 0.25}
              metalness={0.1}
              roughness={0.6}
            />
          </mesh>

          {/* Dorsal spines along the back (stage 2+: bigger crest) */}
          {Array.from({ length: stage >= 2 ? 5 : 3 }, (_, i) => {
            const z = -0.15 - i * 0.22;
            const y = 0.55 - Math.abs(i - 1) * 0.05;
            const h = stage >= 2 ? 0.18 - i * 0.02 : 0.12 - i * 0.02;
            return (
              <mesh key={i} position={[0, y, z]} rotation={[0.3, 0, 0]} castShadow>
                <coneGeometry args={[0.06, h, 5]} />
                <meshStandardMaterial color={spineColor} metalness={0.4} roughness={0.5} flatShading />
              </mesh>
            );
          })}

          {/* ===== HEAD — big, slightly squashed sphere ===== */}
          <group ref={headRef} position={[0, 0.72, 0.12]}>
            <mesh scale={[0.95, 0.9, 0.95]} castShadow>
              <sphereGeometry args={[0.55, 40, 32]} />
              <meshStandardMaterial
                color={config.primaryColor}
                emissive={config.emissiveColor}
                emissiveIntensity={config.emissiveIntensity * 0.4}
                metalness={config.metalness}
                roughness={config.roughness}
              />
            </mesh>

            {/* Snout / muzzle — rounded cone forward */}
            <mesh position={[0, -0.08, 0.5]} scale={[0.8, 0.65, 0.9]} castShadow>
              <sphereGeometry args={[0.28, 24, 20]} />
              <meshStandardMaterial color={bellyColor} metalness={0.1} roughness={0.6} />
            </mesh>

            {/* Nostrils */}
            <mesh position={[0.09, -0.02, 0.72]}>
              <sphereGeometry args={[0.035, 10, 10]} />
              <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
            </mesh>
            <mesh position={[-0.09, -0.02, 0.72]}>
              <sphereGeometry args={[0.035, 10, 10]} />
              <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
            </mesh>

            {/* Horns — two prominent curved-back cones (stage 2+: longer, branched) */}
            {([
              { x: 0.2, rot: 0.3 },
              { x: -0.2, rot: -0.3 },
            ] as const).map((h, i) => (
              <group key={i} position={[h.x, 0.48, -0.02]} rotation={[0.35, 0, h.rot]}>
                <mesh castShadow>
                  <coneGeometry args={[0.07, stage >= 2 ? 0.48 : 0.34, 8]} />
                  <meshStandardMaterial color={hornColor} metalness={0.5} roughness={0.4} flatShading />
                </mesh>
                {stage >= 2 && (
                  <mesh position={[0, 0.16, 0.06]} rotation={[-0.6, 0, 0]} castShadow>
                    <coneGeometry args={[0.04, 0.18, 6]} />
                    <meshStandardMaterial color={hornColor} metalness={0.5} roughness={0.4} flatShading />
                  </mesh>
                )}
              </group>
            ))}

            {/* ===== EYES — big, expressive, with whites + pupils + shine ===== */}
            {([
              { x: 0.2, group: eyeLRef },
              { x: -0.2, group: eyeRRef },
            ] as const).map((e, i) => (
              <group key={i} ref={e.group} position={[e.x, 0.06, 0.42]}>
                {/* Eye white */}
                <mesh scale={[1, 1.15, 0.6]}>
                  <sphereGeometry args={[0.16, 24, 20]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.25} metalness={0.05} />
                </mesh>
                {/* Iris (colored) */}
                <mesh position={[0, 0, 0.07]}>
                  <sphereGeometry args={[0.1, 20, 16]} />
                  <meshStandardMaterial
                    color={config.emissiveColor}
                    emissive={config.emissiveColor}
                    emissiveIntensity={0.5}
                    roughness={0.3}
                  />
                </mesh>
                {/* Pupil */}
                <mesh position={[0, 0, 0.13]}>
                  <sphereGeometry args={[0.055, 14, 12]} />
                  <meshStandardMaterial color="#0a0a0a" roughness={0.2} />
                </mesh>
                {/* Eye shine highlight */}
                <mesh position={[0.04, 0.05, 0.16]}>
                  <sphereGeometry args={[0.022, 8, 8]} />
                  <meshBasicMaterial color="#ffffff" toneMapped={false} />
                </mesh>
              </group>
            ))}

            {/* Little smile — curved torus arc */}
            <mesh position={[0, -0.2, 0.46]} rotation={[Math.PI * 0.5, 0, Math.PI]}>
              <torusGeometry args={[0.09, 0.015, 8, 16, Math.PI]} />
              <meshStandardMaterial color="#1a1a2e" roughness={0.6} />
            </mesh>
          </group>

          {/* ===== WINGS — bat-style: finger bones + membrane (big, visible from front) ===== */}
          {([
            { ref: wingLRef, x: 0.55, rot: 0.55, dir: 1 },
            { ref: wingRRef, x: -0.55, rot: -0.55, dir: -1 },
          ] as const).map((w, i) => (
            <group key={i} ref={w.ref} position={[w.x, 0.4, 0.05]} rotation={[0, 0, w.rot]}>
              {/* Wing arm bone */}
              <mesh rotation={[0, 0, 0]} castShadow>
                <cylinderGeometry args={[0.035, 0.028, 0.55, 8]} />
                <meshStandardMaterial color={hornColor} metalness={0.4} roughness={0.5} />
              </mesh>
              {/* Finger bones spreading the membrane — fan out */}
              {Array.from({ length: stage >= 2 ? 3 : 2 }, (_, j) => {
                const angle = -0.6 + j * 0.6;
                return (
                  <mesh
                    key={j}
                    position={[w.dir * (0.14 + j * 0.05), 0.22, 0]}
                    rotation={[0, 0, angle]}
                    castShadow
                  >
                    <cylinderGeometry args={[0.02, 0.013, 0.4, 6]} />
                    <meshStandardMaterial color={hornColor} metalness={0.4} roughness={0.5} />
                  </mesh>
                );
              })}
              {/* Membrane — larger, curved plane between the fingers */}
              <mesh position={[w.dir * 0.22, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <planeGeometry args={[0.62, 0.46]} />
                <meshStandardMaterial
                  color={config.accentColor ?? bellyColor}
                  roughness={0.35}
                  metalness={0.15}
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.95}
                  emissive={config.emissiveColor}
                  emissiveIntensity={config.emissiveIntensity * 0.4}
                />
              </mesh>
              {/* Wing claw tip (stage 2+) */}
              {stage >= 2 && (
                <mesh position={[w.dir * 0.38, 0.38, 0]} rotation={[0, 0, 0.3]} castShadow>
                  <coneGeometry args={[0.032, 0.11, 5]} />
                  <meshStandardMaterial color={clawColor} metalness={0.6} roughness={0.3} />
                </mesh>
              )}
            </group>
          ))}

          {/* ===== TAIL — curled, with spade tip ===== */}
          <group ref={tailRef} position={[0, -0.1, -0.6]}>
            {/* Tail base — tapering segments */}
            <mesh position={[0, -0.1, -0.15]} rotation={[0.5, 0, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.13, 0.4, 16]} />
              <meshStandardMaterial color={config.primaryColor} metalness={config.metalness} roughness={config.roughness} />
            </mesh>
            <mesh position={[0, -0.28, -0.42]} rotation={[1.0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.13, 0.08, 0.38, 14]} />
              <meshStandardMaterial color={config.primaryColor} metalness={config.metalness} roughness={config.roughness} />
            </mesh>
            {/* Spade tip */}
            <mesh position={[0, -0.42, -0.6]} rotation={[1.3, 0, 0]} castShadow>
              <coneGeometry args={[0.12, 0.22, 4]} />
              <meshStandardMaterial color={hornColor} metalness={0.5} roughness={0.4} flatShading />
            </mesh>
            {/* Small spade fins */}
            <mesh position={[0.07, -0.4, -0.58]} rotation={[1.3, 0, 0.6]} castShadow>
              <coneGeometry args={[0.05, 0.14, 4]} />
              <meshStandardMaterial color={hornColor} metalness={0.5} roughness={0.4} flatShading />
            </mesh>
            <mesh position={[-0.07, -0.4, -0.58]} rotation={[1.3, 0, -0.6]} castShadow>
              <coneGeometry args={[0.05, 0.14, 4]} />
              <meshStandardMaterial color={hornColor} metalness={0.5} roughness={0.4} flatShading />
            </mesh>
          </group>

          {/* ===== LEGS — stubby with claws ===== */}
          {([
            { x: 0.3, z: 0.45 },
            { x: -0.3, z: 0.45 },
            { x: 0.28, z: -0.25 },
            { x: -0.28, z: -0.25 },
          ] as const).map((leg, i) => (
            <group key={i} position={[leg.x, -0.6, leg.z]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.13, 0.1, 0.22, 14]} />
                <meshStandardMaterial color={config.primaryColor} metalness={config.metalness} roughness={config.roughness} />
              </mesh>
              {/* Foot */}
              <mesh position={[0, -0.14, 0.04]} scale={[1, 0.6, 1.3]} castShadow>
                <sphereGeometry args={[0.1, 14, 12]} />
                <meshStandardMaterial color={bellyColor} metalness={0.1} roughness={0.6} />
              </mesh>
              {/* Claws — 3 tiny tips */}
              {[0, 1, 2].map((c) => (
                <mesh key={c} position={[(c - 1) * 0.045, -0.2, 0.1]} rotation={[0.4, 0, (c - 1) * 0.25]} castShadow>
                  <coneGeometry args={[0.025, 0.07, 5]} />
                  <meshStandardMaterial color={clawColor} metalness={0.6} roughness={0.3} />
                </mesh>
              ))}
            </group>
          ))}
        </group>

        {/* Stage-3 aura / sigil */}
        {hasAura && <Aura color={auraColor} intensity={stage >= 3 ? 1 : 0.6} />}
        {!hasAura && hasSigil && (
          <mesh position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.0, 0.03, 10, 6]} />
            <meshStandardMaterial
              color={auraColor}
              emissive={auraColor}
              emissiveIntensity={1.1}
              toneMapped={false}
              transparent
              opacity={0.6}
            />
          </mesh>
        )}
      </Float>
    </group>
  );
}
