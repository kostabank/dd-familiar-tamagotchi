'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import type { FamiliarState, ModelConfig } from '@/lib/types';
import { getStateTargets, applyStateToGroup, breathingScale, idleBob } from '../state-anim';
import Aura from './Aura';

interface Props {
  config: ModelConfig;
  stage: 1 | 2 | 3;
  state: FamiliarState;
}

/**
 * Construct Familiar — a hovering low-poly arcane automaton.
 *
 * Stage progression:
 *  - Stage 1: icosahedron shell + glowing core orb + 1 orbital ring + pedestal.
 *  - Stage 2: + 2nd orbital ring (different axis) + facet runes (emissive
 *    tetrahedra on shell faces).
 *  - Stage 3: + 3rd ring + more runes + aura/halo/sigil + brighter emissive.
 *
 * The shell uses flatShading for the faceted metal look; the core is a pure
 * emissive orb (toneMapped=false) so it reads as a light source.
 */
export default function ConstructFamiliar({ config, stage, state }: Props) {
  const rootRef = useRef<THREE.Group>(null);
  const shellRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const coreMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const eyeMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const runeGroupRef = useRef<THREE.Group>(null);

  const ornaments = config.ornaments ?? [];
  const hasAura = stage >= 3 || ornaments.includes('aura');
  const hasSigil = stage >= 3 || ornaments.includes('sigil');
  const auraColor = config.auraColor ?? config.emissiveColor;

  useFrame((frameState, delta) => {
    const t = frameState.clock.elapsedTime;
    const targets = getStateTargets(state);
    applyStateToGroup(rootRef.current, targets, t, delta);

    if (rootRef.current) {
      rootRef.current.position.y = targets.groupPositionY + idleBob(state, t);
    }

    // Shell slowly rotates — breathing-like.
    if (shellRef.current) {
      shellRef.current.rotation.y += delta * 0.15;
      const b = breathingScale(state, t);
      shellRef.current.scale.set(b, b, b);
    }

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
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x += delta * 0.45 * ringMul;
      ring3Ref.current.rotation.z -= delta * 0.7 * ringMul;
    }

    // Runes orbit slowly around the shell.
    if (runeGroupRef.current) {
      runeGroupRef.current.rotation.y -= delta * 0.3 * ringMul;
      runeGroupRef.current.rotation.x = Math.sin(t * 0.5) * 0.2;
    }

    // Core emissive pulse, scaled by state + stage.
    const stageBoost = stage >= 3 ? 1.4 : stage === 2 ? 1.15 : 1;
    const pulse = 0.85 + Math.sin(t * 2) * 0.15;
    if (coreMatRef.current) {
      coreMatRef.current.emissiveIntensity =
        config.emissiveIntensity * targets.emissiveMultiplier * pulse * stageBoost;
    }
    if (eyeMatRef.current) {
      eyeMatRef.current.emissiveIntensity =
        config.emissiveIntensity * targets.emissiveMultiplier * 1.2 * stageBoost;
    }

    // Tired: nod off wobble. Sad: small shake. Hungry: lean.
    if (rootRef.current) {
      if (state === 'tired') {
        rootRef.current.rotation.x += Math.sin(t * 1.5) * 0.02;
      } else if (state === 'sad') {
        rootRef.current.position.x = Math.sin(t * 20) * 0.02;
      } else if (state === 'hungry') {
        rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, 0.15, 0.05);
      } else {
        rootRef.current.position.x = THREE.MathUtils.lerp(rootRef.current.position.x, 0, 0.1);
        if (state !== 'tired') {
          rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, 0, 0.05);
        }
      }
    }
  });

  const targets = getStateTargets(state);
  const ornament = config.ornamentColor ?? config.emissiveColor;

  // Rune positions — emissive tetrahedra placed around the shell at fixed angles.
  const runeCount = stage >= 3 ? 6 : stage === 2 ? 4 : 0;
  const runes = Array.from({ length: runeCount }, (_, i) => {
    const angle = (i / runeCount) * Math.PI * 2;
    const r = 1.05;
    return {
      x: Math.cos(angle) * r,
      y: Math.sin(angle * 1.3) * 0.5,
      z: Math.sin(angle) * r,
      rot: angle,
      key: i,
    };
  });

  return (
    <group ref={rootRef}>
      <Float
        speed={targets.floatSpeed}
        floatIntensity={targets.floatIntensity}
        rotationIntensity={targets.rotationIntensity}
      >
        {/* Pedestal — a thin disc base that the construct hovers above.
            Gives a grounded "summoned entity" feel. */}
        <mesh position={[0, -1.0, 0]} receiveShadow>
          <cylinderGeometry args={[0.8, 0.95, 0.12, 8]} />
          <meshStandardMaterial
            color={config.primaryColor}
            metalness={0.85}
            roughness={0.4}
            flatShading
          />
        </mesh>
        {/* Pedestal glow ring */}
        <mesh position={[0, -0.93, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 0.72, 8]} />
          <meshStandardMaterial
            color={config.emissiveColor}
            emissive={config.emissiveColor}
            emissiveIntensity={config.emissiveIntensity * 0.6}
            toneMapped={false}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Shell — icosahedron (more facets than octahedron) */}
        <group ref={shellRef}>
          <mesh castShadow receiveShadow>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={config.primaryColor}
              metalness={config.metalness}
              roughness={config.roughness}
              flatShading
              emissive={config.emissiveColor}
              emissiveIntensity={config.emissiveIntensity * 0.1}
            />
          </mesh>

          {/* Facet runes — emissive tetrahedra on the shell faces (stage 2+) */}
          <group ref={runeGroupRef}>
            {runes.map((r) => (
              <mesh
                key={r.key}
                position={[r.x, r.y, r.z]}
                rotation={[r.rot, r.rot * 0.7, r.rot * 1.3]}
              >
                <tetrahedronGeometry args={[0.09, 0]} />
                <meshStandardMaterial
                  color={ornament}
                  emissive={ornament}
                  emissiveIntensity={config.emissiveIntensity * 1.2}
                  toneMapped={false}
                />
              </mesh>
            ))}
          </group>
        </group>

        {/* Glowing arcane core inside the shell */}
        <mesh>
          <sphereGeometry args={[0.32, 32, 32]} />
          <meshStandardMaterial
            ref={coreMatRef}
            color={config.emissiveColor}
            emissive={config.emissiveColor}
            emissiveIntensity={config.emissiveIntensity}
            toneMapped={false}
          />
        </mesh>
        {/* Inner orb wireframe — gives the core a layered "soul" feel */}
        <mesh scale={1.15}>
          <icosahedronGeometry args={[0.32, 0]} />
          <meshBasicMaterial
            color={config.emissiveColor}
            wireframe
            transparent
            opacity={0.35}
            toneMapped={false}
          />
        </mesh>

        {/* Eye — single emissive sphere on the +X+Y+Z face */}
        <mesh position={[0.55, 0.35, 0.55]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial
            ref={eyeMatRef}
            color={config.emissiveColor}
            emissive={config.emissiveColor}
            emissiveIntensity={config.emissiveIntensity}
            toneMapped={false}
          />
        </mesh>
        {/* Eye socket ring */}
        <mesh position={[0.55, 0.35, 0.55]} rotation={[0.5, 0.5, 0]}>
          <torusGeometry args={[0.13, 0.015, 8, 24]} />
          <meshStandardMaterial color={ornament} metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Inner ring — tighter, faster */}
        <mesh ref={ring1Ref}>
          <torusGeometry args={[1.4, 0.035, 16, 80]} />
          <meshStandardMaterial
            color={config.emissiveColor}
            emissive={config.emissiveColor}
            emissiveIntensity={config.emissiveIntensity * 0.7}
            metalness={0.8}
            roughness={0.3}
            toneMapped={false}
          />
        </mesh>

        {/* Outer ring — perpendicular axis (stage 2+) */}
        {stage >= 2 && (
          <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.65, 0.025, 16, 80]} />
            <meshStandardMaterial
              color={config.primaryColor}
              metalness={config.metalness}
              roughness={0.35}
              emissive={config.emissiveColor}
              emissiveIntensity={config.emissiveIntensity * 0.3}
            />
          </mesh>
        )}

        {/* Third ring — tilted axis (stage 3 only) */}
        {stage >= 3 && (
          <mesh ref={ring3Ref} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
            <torusGeometry args={[1.85, 0.02, 14, 64]} />
            <meshStandardMaterial
              color={ornament}
              emissive={ornament}
              emissiveIntensity={config.emissiveIntensity * 0.8}
              metalness={0.8}
              roughness={0.25}
              toneMapped={false}
            />
          </mesh>
        )}

        {/* Stage-3 aura / sigil */}
        {hasAura && <Aura color={auraColor} intensity={stage >= 3 ? 1 : 0.6} />}
        {!hasAura && hasSigil && (
          <mesh position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.1, 0.03, 10, 6]} />
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
