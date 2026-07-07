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

interface WingMembraneProps {
  side: 'L' | 'R';
  accent: string;
  ornament: string;
  emissiveColor: string;
  emissiveIntensity: number;
  stage: 1 | 2 | 3;
}

/** Wing membrane — 3 fan-shaped iridescent planes + finger bones.
 *  Declared at module scope so React doesn't recreate it each render. */
function WingMembrane({ side, accent, ornament, emissiveColor, emissiveIntensity, stage }: WingMembraneProps) {
  const dir = side === 'L' ? 1 : -1;
  return (
    <group>
      {/* finger 1 — top */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.18 * dir, 0.05, 0]} castShadow>
        <planeGeometry args={[0.55, 0.42]} />
        <meshPhysicalMaterial
          color={accent}
          transmission={0.6}
          roughness={0.1}
          thickness={0.5}
          iridescence={1}
          iridescenceIOR={1.5}
          side={THREE.DoubleSide}
          transparent
          opacity={0.82}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity * 0.25}
        />
      </mesh>
      {/* finger 2 — middle (longer) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.32 * dir, -0.05, 0]} castShadow>
        <planeGeometry args={[0.7, 0.4]} />
        <meshPhysicalMaterial
          color={accent}
          transmission={0.6}
          roughness={0.1}
          thickness={0.5}
          iridescence={1}
          iridescenceIOR={1.5}
          side={THREE.DoubleSide}
          transparent
          opacity={0.82}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity * 0.25}
        />
      </mesh>
      {/* finger 3 — bottom (stage 2+) */}
      {stage >= 2 && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.22 * dir, -0.18, 0]} castShadow>
          <planeGeometry args={[0.5, 0.32]} />
          <meshPhysicalMaterial
            color={accent}
            transmission={0.6}
            roughness={0.1}
            thickness={0.5}
            iridescence={1}
            iridescenceIOR={1.5}
            side={THREE.DoubleSide}
            transparent
            opacity={0.82}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity * 0.25}
          />
        </mesh>
      )}
      {/* wing-finger bones — thin dark cylinders along the leading edge */}
      <mesh position={[0.28 * dir, 0.0, 0]} rotation={[0, 0, dir * 0.2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.55, 6]} />
        <meshStandardMaterial color={ornament} metalness={0.4} roughness={0.6} />
      </mesh>
      {stage >= 2 && (
        <mesh position={[0.4 * dir, -0.08, 0]} rotation={[0, 0, dir * 0.05]}>
          <cylinderGeometry args={[0.01, 0.01, 0.6, 6]} />
          <meshStandardMaterial color={ornament} metalness={0.4} roughness={0.6} />
        </mesh>
      )}
    </group>
  );
}

/**
 * Dragon Familiar — a small wyrm-pup with iridescent articulated wings,
 * a sinuous tail, four legs, dorsal spines, belly plates, and a forked tongue.
 *
 * Stage progression:
 *  - Stage 1: base pup (small horn, 4 stubby legs, short dorsal crest).
 *  - Stage 2: bigger curved horns (pair), longer dorsal crest, extra wing-finger
 *    membrane segment, cheek spikes, longer tail.
 *  - Stage 3: branched horns, full dorsal crest, aura + halo + sigil, stronger
 *    emissive. Ornaments from `config.ornaments` add path-specific flourishes.
 *
 * Teal/cyan low-poly dark-fantasy styling by default; evolution paths recolor
 * via `config.primaryColor` / `config.emissiveColor`.
 */
export default function DragonFamiliar({ config, stage, state }: Props) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const wingLRef = useRef<THREE.Group>(null);
  const wingRRef = useRef<THREE.Group>(null);
  const tail1Ref = useRef<THREE.Group>(null);
  const tail2Ref = useRef<THREE.Group>(null);
  const tail3Ref = useRef<THREE.Group>(null);
  const eyeLRef = useRef<THREE.Mesh>(null);
  const eyeRRef = useRef<THREE.Mesh>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const headMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const ornaments = config.ornaments ?? [];
  const hasAura = stage >= 3 || ornaments.includes('aura');
  const hasSigil = stage >= 3 || ornaments.includes('sigil');
  const auraColor = config.auraColor ?? config.emissiveColor;

  useFrame((frameState, delta) => {
    const t = frameState.clock.elapsedTime;
    const targets = getStateTargets(state);
    applyStateToGroup(rootRef.current, targets, t, delta);

    // Idle bob applied on top of state-driven position.
    if (rootRef.current) {
      rootRef.current.position.y = targets.groupPositionY + idleBob(state, t);
    }

    // Breathing — subtle Y-scale on the body group.
    if (bodyRef.current) {
      const b = breathingScale(state, t);
      bodyRef.current.scale.y = b;
    }

    // Wing flap — faster when happy, barely when sleeping.
    const flapMul = state === 'happy' ? 1.7 : state === 'sleeping' ? 0.2 : state === 'tired' ? 0.5 : 1;
    const flap = Math.sin(t * 4) * 0.22 * flapMul;
    if (wingLRef.current) wingLRef.current.rotation.z = 0.5 + flap;
    if (wingRRef.current) wingRRef.current.rotation.z = -0.5 - flap;
    // Slight forward-back wing pivot for liveliness.
    const pitch = Math.sin(t * 4 + 0.5) * 0.08 * flapMul;
    if (wingLRef.current) wingLRef.current.rotation.x = pitch;
    if (wingRRef.current) wingRRef.current.rotation.x = pitch;

    // Sinuous tail — each segment adds an offset rotation.
    const tailAmp = state === 'happy' ? 0.38 : state === 'sleeping' ? 0.08 : 0.24;
    if (tail1Ref.current) tail1Ref.current.rotation.y = Math.sin(t * 1.8) * tailAmp;
    if (tail2Ref.current) tail2Ref.current.rotation.y = Math.sin(t * 1.8 + 0.8) * tailAmp;
    if (tail3Ref.current) tail3Ref.current.rotation.y = Math.sin(t * 1.8 + 1.6) * tailAmp;

    // Blink — both eyes scale Y briefly.
    const blink = blinkScale(state, t);
    if (eyeLRef.current) eyeLRef.current.scale.y = blink;
    if (eyeRRef.current) eyeRRef.current.scale.y = blink;

    // Emissive intensity scales with state + stage (stage 3 glows brighter).
    const stageBoost = stage >= 3 ? 1.35 : stage === 2 ? 1.1 : 1;
    if (bodyMatRef.current) {
      bodyMatRef.current.emissiveIntensity =
        config.emissiveIntensity * targets.emissiveMultiplier * 0.6 * stageBoost;
    }
    if (headMatRef.current) {
      headMatRef.current.emissiveIntensity =
        config.emissiveIntensity * targets.emissiveMultiplier * 0.6 * stageBoost;
    }

    // Tired: gentle nod. Sad: shake. Hungry: lean forward.
    if (rootRef.current) {
      if (state === 'tired') {
        rootRef.current.rotation.x += Math.sin(t * 1.5) * 0.02;
      } else if (state === 'sad') {
        rootRef.current.position.x = Math.sin(t * 20) * 0.02;
      } else if (state === 'hungry') {
        rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, 0.18, 0.05);
      } else {
        rootRef.current.position.x = THREE.MathUtils.lerp(rootRef.current.position.x, 0, 0.1);
        if (state !== 'tired') {
          rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, 0, 0.05);
        }
      }
    }
  });

  const targets = getStateTargets(state);
  const accent = config.accentColor ?? '#5eead4';
  const ornament = config.ornamentColor ?? '#134e4a';

  // Dorsal spines along the back — count grows with stage.
  const spineCount = stage >= 3 ? 6 : stage === 2 ? 5 : 4;
  const spines = Array.from({ length: spineCount }, (_, i) => {
    const z = 0.5 - i * 0.28;
    const size = 0.1 + (i === 0 ? 0.04 : 0) + (stage >= 2 ? 0.02 : 0);
    return { z, size, key: i };
  });

  return (
    <group ref={rootRef}>
      <Float
        speed={targets.floatSpeed}
        floatIntensity={targets.floatIntensity}
        rotationIntensity={targets.rotationIntensity}
      >
        <group ref={bodyRef}>
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
              flatShading
            />
          </mesh>

          {/* Belly plates — a row of flattened lighter boxes underneath */}
          {Array.from({ length: 4 }, (_, i) => (
            <mesh
              key={i}
              position={[0, -0.32, 0.4 - i * 0.25]}
              rotation={[Math.PI * 0.5, 0, 0]}
              scale={[0.32, 0.08, 0.22]}
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial
                color={accent}
                metalness={0.2}
                roughness={0.55}
                emissive={config.emissiveColor}
                emissiveIntensity={config.emissiveIntensity * 0.15}
              />
            </mesh>
          ))}

          {/* Dorsal spines along the back */}
          {spines.map((s) => (
            <mesh key={s.key} position={[0, 0.45, s.z]} rotation={[Math.PI * 0.62, 0, 0]} castShadow>
              <coneGeometry args={[0.05, s.size, 6]} />
              <meshStandardMaterial color={ornament} metalness={0.4} roughness={0.55} />
            </mesh>
          ))}

          {/* Head — smaller sphere at the front, with a defined snout/jaw */}
          <mesh position={[0, 0.15, 0.9]} castShadow>
            <sphereGeometry args={[0.42, 28, 28]} />
            <meshStandardMaterial
              ref={headMatRef}
              color={config.primaryColor}
              emissive={config.emissiveColor}
              emissiveIntensity={config.emissiveIntensity * 0.6}
              metalness={config.metalness}
              roughness={config.roughness}
              flatShading
            />
          </mesh>

          {/* Snout / upper jaw — tapered box extending forward */}
          <mesh position={[0, 0.05, 1.25]} rotation={[Math.PI * 0.5, 0, 0]} castShadow>
            <coneGeometry args={[0.18, 0.35, 8]} />
            <meshStandardMaterial
              color={config.primaryColor}
              metalness={config.metalness}
              roughness={config.roughness}
              flatShading
            />
          </mesh>
          {/* Lower jaw — slightly smaller, hinged look */}
          <mesh position={[0, -0.08, 1.22]} rotation={[Math.PI * 0.5, 0, 0]}>
            <coneGeometry args={[0.14, 0.28, 8]} />
            <meshStandardMaterial
              color={ornament}
              metalness={0.3}
              roughness={0.7}
            />
          </mesh>

          {/* Forked tongue — two thin diverging cones, only when not sleeping */}
          {state !== 'sleeping' && (
            <>
              <mesh position={[0.04, -0.05, 1.45]} rotation={[Math.PI * 0.5, 0, 0.3]}>
                <coneGeometry args={[0.018, 0.18, 6]} />
                <meshStandardMaterial color="#b91c1c" roughness={0.6} />
              </mesh>
              <mesh position={[-0.04, -0.05, 1.45]} rotation={[Math.PI * 0.5, 0, -0.3]}>
                <coneGeometry args={[0.018, 0.18, 6]} />
                <meshStandardMaterial color="#b91c1c" roughness={0.6} />
              </mesh>
            </>
          )}

          {/* Nostrils — two tiny dark dots on top of the snout */}
          <mesh position={[0.07, 0.18, 1.36]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshStandardMaterial color="#000000" roughness={0.9} />
          </mesh>
          <mesh position={[-0.07, 0.18, 1.36]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshStandardMaterial color="#000000" roughness={0.9} />
          </mesh>

          {/* Horn(s) — curved cones on the head; pair + bigger at stage 2+ */}
          {stage >= 2 ? (
            <>
              <mesh position={[0.16, 0.42, 1.0]} rotation={[Math.PI * 0.55, 0, -0.35]} castShadow>
                <coneGeometry args={[0.07, 0.42, 8]} />
                <meshStandardMaterial color={ornament} metalness={0.5} roughness={0.45} />
              </mesh>
              <mesh position={[-0.16, 0.42, 1.0]} rotation={[Math.PI * 0.55, 0, 0.35]} castShadow>
                <coneGeometry args={[0.07, 0.42, 8]} />
                <meshStandardMaterial color={ornament} metalness={0.5} roughness={0.45} />
              </mesh>
              {/* Stage 3: branched horn tips */}
              {stage >= 3 && (
                <>
                  <mesh position={[0.22, 0.66, 0.98]} rotation={[Math.PI * 0.4, 0, -0.6]} castShadow>
                    <coneGeometry args={[0.04, 0.18, 6]} />
                    <meshStandardMaterial color={ornament} metalness={0.5} roughness={0.45} />
                  </mesh>
                  <mesh position={[-0.22, 0.66, 0.98]} rotation={[Math.PI * 0.4, 0, 0.6]} castShadow>
                    <coneGeometry args={[0.04, 0.18, 6]} />
                    <meshStandardMaterial color={ornament} metalness={0.5} roughness={0.45} />
                  </mesh>
                </>
              )}
            </>
          ) : (
            <mesh position={[0, 0.42, 1.0]} rotation={[Math.PI * 0.65, 0, 0]} castShadow>
              <coneGeometry args={[0.07, 0.28, 8]} />
              <meshStandardMaterial color={ornament} metalness={0.4} roughness={0.55} />
            </mesh>
          )}

          {/* Cheek spikes — stage 2+ */}
          {stage >= 2 && (
            <>
              <mesh position={[0.32, 0.18, 0.95]} rotation={[0, 0.5, Math.PI * 0.4]} castShadow>
                <coneGeometry args={[0.04, 0.16, 6]} />
                <meshStandardMaterial color={ornament} metalness={0.4} roughness={0.55} />
              </mesh>
              <mesh position={[-0.32, 0.18, 0.95]} rotation={[0, -0.5, Math.PI * 0.4]} castShadow>
                <coneGeometry args={[0.04, 0.16, 6]} />
                <meshStandardMaterial color={ornament} metalness={0.4} roughness={0.55} />
              </mesh>
            </>
          )}

          {/* Eyes — two glowing spheres with dark pupils; blink via scale Y */}
          <mesh ref={eyeLRef} position={[0.15, 0.26, 1.22]}>
            <sphereGeometry args={[0.06, 14, 14]} />
            <meshStandardMaterial
              color={accent}
              emissive={config.emissiveColor}
              emissiveIntensity={config.emissiveIntensity * 0.9}
              metalness={0.3}
              roughness={0.2}
              toneMapped={false}
            />
          </mesh>
          <mesh ref={eyeRRef} position={[-0.15, 0.26, 1.22]}>
            <sphereGeometry args={[0.06, 14, 14]} />
            <meshStandardMaterial
              color={accent}
              emissive={config.emissiveColor}
              emissiveIntensity={config.emissiveIntensity * 0.9}
              metalness={0.3}
              roughness={0.2}
              toneMapped={false}
            />
          </mesh>
          {/* Pupils — tiny dark spheres on the eyes */}
          <mesh position={[0.15, 0.26, 1.27]}>
            <sphereGeometry args={[0.024, 10, 10]} />
            <meshStandardMaterial color="#0a0a0a" metalness={0.5} roughness={0.2} />
          </mesh>
          <mesh position={[-0.15, 0.26, 1.27]}>
            <sphereGeometry args={[0.024, 10, 10]} />
            <meshStandardMaterial color="#0a0a0a" metalness={0.5} roughness={0.2} />
          </mesh>

          {/* Four legs — stubby cones with small claw-tips */}
          {([
            { x: 0.32, z: 0.55, r: 0.2 },
            { x: -0.32, z: 0.55, r: -0.2 },
            { x: 0.3, z: -0.3, r: 0.2 },
            { x: -0.3, z: -0.3, r: -0.2 },
          ] as const).map((leg, i) => (
            <group key={i} position={[leg.x, -0.35, leg.z]} rotation={[0, 0, leg.r]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.08, 0.06, 0.3, 10]} />
                <meshStandardMaterial
                  color={config.primaryColor}
                  metalness={config.metalness}
                  roughness={config.roughness}
                  flatShading
                />
              </mesh>
              {/* claw tips */}
              <mesh position={[0, -0.18, 0.04]} rotation={[Math.PI * 0.4, 0, 0]}>
                <coneGeometry args={[0.05, 0.1, 6]} />
                <meshStandardMaterial color={ornament} metalness={0.5} roughness={0.5} />
              </mesh>
            </group>
          ))}

          {/* Left wing — articulated membrane */}
          <group ref={wingLRef} position={[0.5, 0.25, 0.1]} rotation={[0, 0, 0.5]}>
            <WingMembrane side="L" accent={accent} ornament={ornament} emissiveColor={config.emissiveColor} emissiveIntensity={config.emissiveIntensity} stage={stage} />
          </group>
          {/* Right wing */}
          <group ref={wingRRef} position={[-0.5, 0.25, 0.1]} rotation={[0, 0, -0.5]}>
            <WingMembrane side="R" accent={accent} ornament={ornament} emissiveColor={config.emissiveColor} emissiveIntensity={config.emissiveIntensity} stage={stage} />
          </group>

          {/* Tail — chained spheres, each parented to the previous */}
          <group ref={tail1Ref} position={[0, -0.05, -0.85]}>
            <mesh castShadow>
              <sphereGeometry args={[0.28, 20, 20]} />
              <meshStandardMaterial
                color={config.primaryColor}
                emissive={config.emissiveColor}
                emissiveIntensity={config.emissiveIntensity * 0.4}
                metalness={config.metalness}
                roughness={config.roughness}
                flatShading
              />
            </mesh>
            {/* tail spike fin on top of segment 1 (stage 2+) */}
            {stage >= 2 && (
              <mesh position={[0, 0.22, -0.05]} rotation={[Math.PI * 0.55, 0, 0]}>
                <coneGeometry args={[0.05, 0.18, 6]} />
                <meshStandardMaterial color={ornament} metalness={0.4} roughness={0.55} />
              </mesh>
            )}
            <group ref={tail2Ref} position={[0, 0, -0.3]}>
              <mesh castShadow>
                <sphereGeometry args={[0.22, 20, 20]} />
                <meshStandardMaterial
                  color={config.primaryColor}
                  emissive={config.emissiveColor}
                  emissiveIntensity={config.emissiveIntensity * 0.4}
                  metalness={config.metalness}
                  roughness={config.roughness}
                  flatShading
                />
              </mesh>
              <group ref={tail3Ref} position={[0, 0, -0.28]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.16, 20, 20]} />
                  <meshStandardMaterial
                    color={accent}
                    emissive={config.emissiveColor}
                    emissiveIntensity={config.emissiveIntensity * 0.6}
                    metalness={config.metalness}
                    roughness={config.roughness}
                  />
                </mesh>
                {/* Tail tip spike — bigger blade at stage 2+ */}
                <mesh position={[0, 0, -0.18]} rotation={[Math.PI * 0.5, 0, 0]}>
                  <coneGeometry args={[stage >= 2 ? 0.09 : 0.06, stage >= 2 ? 0.32 : 0.2, 8]} />
                  <meshStandardMaterial
                    color={ornament}
                    metalness={0.5}
                    roughness={0.4}
                    emissive={config.emissiveColor}
                    emissiveIntensity={config.emissiveIntensity * 0.2}
                  />
                </mesh>
              </group>
            </group>
          </group>
        </group>

        {/* Stage-3 aura / sigil */}
        {hasAura && <Aura color={auraColor} intensity={stage >= 3 ? 1 : 0.6} />}
        {/* sigil-only ornament (without full aura) for stage-2 paths that opt in */}
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
