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

interface WingProps {
  side: 'L' | 'R';
  primaryColor: string;
  bellyColor: string;
  emissiveColor: string;
  emissiveIntensity: number;
  stage: 1 | 2 | 3;
}

/** Layered feather planes for a wing — 3 primary + 2 covert feathers.
 *  Declared at module scope so React doesn't recreate it each render. */
function Wing({ side, primaryColor, bellyColor, emissiveColor, emissiveIntensity, stage }: WingProps) {
  const dir = side === 'L' ? 1 : -1;
  return (
    <group>
      {/* primary feathers — long horizontal planes */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.3 * dir, 0, 0]} castShadow>
        <planeGeometry args={[0.55, 0.18]} />
        <meshStandardMaterial
          color={primaryColor}
          metalness={0.7}
          roughness={0.3}
          side={THREE.DoubleSide}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity * 0.15}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, dir * 0.2]} position={[0.45 * dir, -0.03, 0.05]} castShadow>
        <planeGeometry args={[0.5, 0.16]} />
        <meshStandardMaterial
          color={primaryColor}
          metalness={0.7}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, -dir * 0.2]} position={[0.45 * dir, -0.03, -0.05]} castShadow>
        <planeGeometry args={[0.5, 0.16]} />
        <meshStandardMaterial
          color={primaryColor}
          metalness={0.7}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* coverts — shorter overlapping feathers near the body (stage 2+) */}
      {stage >= 2 && (
        <>
          <mesh rotation={[Math.PI / 2, 0, dir * 0.1]} position={[0.15 * dir, 0.02, 0]} castShadow>
            <planeGeometry args={[0.28, 0.14]} />
            <meshStandardMaterial
              color={bellyColor}
              metalness={0.5}
              roughness={0.4}
              side={THREE.DoubleSide}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity * 0.1}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, dir * 0.3]} position={[0.12 * dir, 0.02, 0.08]} castShadow>
            <planeGeometry args={[0.24, 0.12]} />
            <meshStandardMaterial
              color={bellyColor}
              metalness={0.5}
              roughness={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

/**
 * Magpie Familiar — a sleek black-feathered bird with layered feather planes,
 * a sharp beak, legs/talons, a glinting eye, and a stolen trinket (gem) held
 * in its claws. Long ribbon-like tail planes wag behind it.
 *
 * Stage progression:
 *  - Stage 1: base bird (layered feathers, beak, 2 legs, trinket).
 *  - Stage 2: longer tail ribbons (3 instead of 1), crest feathers on head,
 *    extra wing-feather layer.
 *  - Stage 3: aura/halo/sigil + brighter eye + more ribbons. Path ornaments
 *    may add 'crest' or 'ribbons' early.
 */
export default function MagpieFamiliar({ config, stage, state }: Props) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const wingLRef = useRef<THREE.Group>(null);
  const wingRRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const eyeLRef = useRef<THREE.Mesh>(null);
  const eyeRRef = useRef<THREE.Mesh>(null);
  const bellyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const trinketRef = useRef<THREE.Mesh>(null);

  const ornaments = config.ornaments ?? [];
  const hasAura = stage >= 3 || ornaments.includes('aura');
  const hasSigil = stage >= 3 || ornaments.includes('sigil');
  const hasCrest = stage >= 2 || ornaments.includes('crest');
  const ribbonCount = stage >= 3 ? 4 : stage === 2 ? 3 : ornaments.includes('ribbons') ? 2 : 1;
  const auraColor = config.auraColor ?? config.emissiveColor;

  useFrame((frameState, delta) => {
    const t = frameState.clock.elapsedTime;
    const targets = getStateTargets(state);
    applyStateToGroup(rootRef.current, targets, t, delta);

    if (rootRef.current) {
      rootRef.current.position.y = targets.groupPositionY + idleBob(state, t);
    }

    // Breathing on body.
    if (bodyRef.current) {
      const b = breathingScale(state, t);
      bodyRef.current.scale.y = b;
    }

    // Wing flap.
    const flapMul = state === 'happy' ? 1.9 : state === 'sleeping' ? 0.12 : state === 'tired' ? 0.4 : 1;
    const flap = Math.sin(t * 5) * 0.28 * flapMul;
    if (wingLRef.current) wingLRef.current.rotation.z = 0.2 + flap;
    if (wingRRef.current) wingRRef.current.rotation.z = -0.2 - flap;

    // Tail wag.
    const wagAmp = state === 'happy' ? 0.32 : state === 'sleeping' ? 0.05 : 0.16;
    if (tailRef.current) tailRef.current.rotation.y = Math.sin(t * 3) * wagAmp;

    // Blink.
    const blink = blinkScale(state, t);
    if (eyeLRef.current) eyeLRef.current.scale.y = blink;
    if (eyeRRef.current) eyeRRef.current.scale.y = blink;

    // Belly sheen shift + trinket glint.
    const stageBoost = stage >= 3 ? 1.3 : stage === 2 ? 1.1 : 1;
    if (bellyMatRef.current) {
      bellyMatRef.current.emissiveIntensity =
        config.emissiveIntensity * targets.emissiveMultiplier * 0.5 * stageBoost;
    }
    if (trinketRef.current) {
      const mat = trinketRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.2 + Math.sin(t * 3) * 0.4;
      trinketRef.current.rotation.y = t * 0.8;
    }

    // Tired: nod. Sad: shake. Hungry: lean.
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
  const bellyColor = config.accentColor ?? '#f8fafc';
  const beakColor = config.ornamentColor ?? '#f97316';

  // Tail ribbons — long thin planes; count grows with stage.
  const ribbons = Array.from({ length: ribbonCount }, (_, i) => {
    const offset = (i - (ribbonCount - 1) / 2) * 0.08;
    return { offset, len: 1.3 + (i % 2) * 0.15, key: i };
  });

  return (
    <group ref={rootRef}>
      <Float
        speed={targets.floatSpeed}
        floatIntensity={targets.floatIntensity}
        rotationIntensity={targets.rotationIntensity}
      >
        <group ref={bodyRef}>
          {/* Body — glossy black sphere */}
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.55, 32, 32]} />
            <meshStandardMaterial
              color={config.primaryColor}
              metalness={config.metalness}
              roughness={config.roughness}
              flatShading
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
              flatShading
            />
          </mesh>

          {/* Crest feathers on head (stage 2+) */}
          {hasCrest && (
            <>
              <mesh position={[0, 0.82, 0.0]} rotation={[0, 0, 0]}>
                <coneGeometry args={[0.05, 0.22, 6]} />
                <meshStandardMaterial
                  color={config.primaryColor}
                  metalness={0.7}
                  roughness={0.3}
                  emissive={config.emissiveColor}
                  emissiveIntensity={config.emissiveIntensity * 0.4}
                />
              </mesh>
              <mesh position={[0.07, 0.78, 0.0]} rotation={[0, 0, 0.3]}>
                <coneGeometry args={[0.035, 0.18, 6]} />
                <meshStandardMaterial
                  color={config.primaryColor}
                  metalness={0.7}
                  roughness={0.3}
                />
              </mesh>
              <mesh position={[-0.07, 0.78, 0.0]} rotation={[0, 0, -0.3]}>
                <coneGeometry args={[0.035, 0.18, 6]} />
                <meshStandardMaterial
                  color={config.primaryColor}
                  metalness={0.7}
                  roughness={0.3}
                />
              </mesh>
            </>
          )}

          {/* Beak — sharp two-part cone pointing forward (upper + lower mandible) */}
          <mesh position={[0, 0.5, 0.42]} rotation={[Math.PI * 0.5, 0, 0]} castShadow>
            <coneGeometry args={[0.1, 0.38, 8]} />
            <meshStandardMaterial color={beakColor} metalness={0.4} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.46, 0.4]} rotation={[Math.PI * 0.5, 0, 0]}>
            <coneGeometry args={[0.07, 0.28, 6]} />
            <meshStandardMaterial color={beakColor} metalness={0.3} roughness={0.5} />
          </mesh>

          {/* Eyes — glinting white spheres with dark pupils; blink via scale Y */}
          <mesh ref={eyeLRef} position={[0.13, 0.62, 0.27]}>
            <sphereGeometry args={[0.055, 16, 16]} />
            <meshStandardMaterial
              color={bellyColor}
              metalness={0.4}
              roughness={0.15}
              emissive={config.emissiveColor}
              emissiveIntensity={config.emissiveIntensity * 0.4}
              toneMapped={false}
            />
          </mesh>
          <mesh ref={eyeRRef} position={[-0.13, 0.62, 0.27]}>
            <sphereGeometry args={[0.055, 16, 16]} />
            <meshStandardMaterial
              color={bellyColor}
              metalness={0.4}
              roughness={0.15}
              emissive={config.emissiveColor}
              emissiveIntensity={config.emissiveIntensity * 0.4}
              toneMapped={false}
            />
          </mesh>
          {/* Pupils — tiny dark spheres */}
          <mesh position={[0.14, 0.62, 0.31]}>
            <sphereGeometry args={[0.024, 12, 12]} />
            <meshStandardMaterial color="#000000" metalness={0.6} roughness={0.15} toneMapped={false} />
          </mesh>
          <mesh position={[-0.14, 0.62, 0.31]}>
            <sphereGeometry args={[0.024, 12, 12]} />
            <meshStandardMaterial color="#000000" metalness={0.6} roughness={0.15} toneMapped={false} />
          </mesh>
          {/* Eye glint — tiny bright speck (stage 2+) */}
          {stage >= 2 && (
            <>
              <mesh position={[0.15, 0.64, 0.32]}>
                <sphereGeometry args={[0.008, 8, 8]} />
                <meshBasicMaterial color="#ffffff" toneMapped={false} />
              </mesh>
              <mesh position={[-0.12, 0.64, 0.32]}>
                <sphereGeometry args={[0.008, 8, 8]} />
                <meshBasicMaterial color="#ffffff" toneMapped={false} />
              </mesh>
            </>
          )}

          {/* Wings — layered feather planes */}
          <group ref={wingLRef} position={[0.45, 0.1, -0.05]} rotation={[0, 0, 0.2]}>
            <Wing side="L" primaryColor={config.primaryColor} bellyColor={bellyColor} emissiveColor={config.emissiveColor} emissiveIntensity={config.emissiveIntensity} stage={stage} />
          </group>
          <group ref={wingRRef} position={[-0.45, 0.1, -0.05]} rotation={[0, 0, -0.2]}>
            <Wing side="R" primaryColor={config.primaryColor} bellyColor={bellyColor} emissiveColor={config.emissiveColor} emissiveIntensity={config.emissiveIntensity} stage={stage} />
          </group>

          {/* Tail — ribbon-like planes, wagging */}
          <group ref={tailRef} position={[0, -0.05, -0.55]}>
            {ribbons.map((r) => (
              <mesh
                key={r.key}
                rotation={[Math.PI / 2, 0, r.offset * 2]}
                position={[r.offset, 0, -r.len * 0.5]}
                castShadow
              >
                <planeGeometry args={[0.08, r.len]} />
                <meshStandardMaterial
                  color={config.primaryColor}
                  metalness={0.85}
                  roughness={0.25}
                  side={THREE.DoubleSide}
                  emissive={config.emissiveColor}
                  emissiveIntensity={config.emissiveIntensity * 0.2}
                />
              </mesh>
            ))}
          </group>

          {/* Legs + talons — thin cylinders with claw-cones */}
          {([
            { x: 0.15, dir: 1 },
            { x: -0.15, dir: -1 },
          ] as const).map((leg, i) => (
            <group key={i} position={[leg.x, -0.5, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.03, 0.025, 0.4, 8]} />
                <meshStandardMaterial color={beakColor} metalness={0.4} roughness={0.5} />
              </mesh>
              {/* talons — 3 small claws */}
              {[0, 1, 2].map((c) => (
                <mesh
                  key={c}
                  position={[(c - 1) * 0.04, -0.22, 0.02]}
                  rotation={[Math.PI * 0.35, 0, (c - 1) * 0.3]}
                >
                  <coneGeometry args={[0.018, 0.08, 5]} />
                  <meshStandardMaterial color={beakColor} metalness={0.5} roughness={0.4} />
                </mesh>
              ))}
            </group>
          ))}

          {/* Stolen trinket — small glowing gem held between the talons */}
          <mesh ref={trinketRef} position={[0, -0.7, 0.05]} rotation={[0.3, 0, 0]}>
            <octahedronGeometry args={[0.09, 0]} />
            <meshStandardMaterial
              color={config.emissiveColor}
              emissive={config.emissiveColor}
              emissiveIntensity={1.2}
              metalness={0.9}
              roughness={0.1}
              toneMapped={false}
            />
          </mesh>
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
