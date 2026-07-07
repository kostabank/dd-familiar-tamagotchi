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

interface StitchProps {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  radius?: number;
}

/** A single stitch ring — module-scope so React doesn't remount it. */
function Stitch({ position, rotation, color, radius = 0.15 }: StitchProps) {
  return (
    <mesh position={position} rotation={rotation}>
      <torusGeometry args={[radius, 0.012, 8, 32]} />
      <meshStandardMaterial color={color} metalness={0.2} roughness={0.7} />
    </mesh>
  );
}

/**
 * Doll Familiar — an animated fabric doll with stitched seams, button eyes
 * with thread, patchwork color blocks, yarn hair, floppy limbs, and a
 * stitched mouth. Brown burlap + dark thread + faint purple soul-glow by
 * default; evolution paths recolor via `config`.
 *
 * Stage progression:
 *  - Stage 1: base doll (button eyes, 4 stitches, 2 arms, 2 legs, yarn hair).
 *  - Stage 2: + extra patch block + longer limbs + extra seam line.
 *  - Stage 3: + aura/halo/sigil + brighter soul-glow + tassel ornaments.
 */
export default function DollFamiliar({ config, stage, state }: Props) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);

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

    // Breathing on body.
    if (bodyRef.current) {
      const b = breathingScale(state, t);
      bodyRef.current.scale.y = b;
    }

    // Floppy arm sway — arms dangle and sway.
    const armSway = Math.sin(t * 1.6) * 0.15;
    const armMul = state === 'happy' ? 1.6 : state === 'sleeping' ? 0.3 : 1;
    if (armLRef.current) armLRef.current.rotation.z = Math.PI * 0.18 + armSway * armMul;
    if (armRRef.current) armRRef.current.rotation.z = -Math.PI * 0.18 - armSway * armMul;

    // Fabric body faint inner glow scaled by state + stage.
    const stageBoost = stage >= 3 ? 1.4 : stage === 2 ? 1.15 : 1;
    if (bodyMatRef.current) {
      bodyMatRef.current.emissiveIntensity =
        config.emissiveIntensity * targets.emissiveMultiplier * 0.5 * stageBoost;
    }

    // Tired: gentle nod. Sad: shake. Happy: tiny extra bounce. Hungry: lean.
    if (rootRef.current) {
      if (state === 'tired') {
        rootRef.current.rotation.x += Math.sin(t * 1.5) * 0.02;
      } else if (state === 'sad') {
        rootRef.current.position.x = Math.sin(t * 20) * 0.02;
      } else if (state === 'happy') {
        rootRef.current.position.y += Math.sin(t * 6) * 0.005;
      } else if (state === 'hungry') {
        rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, 0.12, 0.05);
      } else {
        rootRef.current.position.x = THREE.MathUtils.lerp(rootRef.current.position.x, 0, 0.1);
        if (state !== 'tired') {
          rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, 0, 0.05);
        }
      }
    }
  });

  const targets = getStateTargets(state);
  const threadColor = config.accentColor ?? '#1c1917';
  const stitchColor = config.ornamentColor ?? '#000000';
  // Patch colors — a small palette derived from the primary + accent so they
  // always harmonize with the evolution path's chosen look.
  const patchColors = [config.primaryColor, threadColor, stitchColor, config.emissiveColor];

  return (
    <group ref={rootRef}>
      <Float
        speed={targets.floatSpeed}
        floatIntensity={targets.floatIntensity}
        rotationIntensity={targets.rotationIntensity}
      >
        <group ref={bodyRef}>
          {/* Body — baggy fabric sphere, slightly stretched vertically */}
          <mesh scale={[1, 1.1, 1]} castShadow receiveShadow>
            <sphereGeometry args={[0.7, 32, 32]} />
            <meshStandardMaterial
              ref={bodyMatRef}
              color={config.primaryColor}
              emissive={config.emissiveColor}
              emissiveIntensity={config.emissiveIntensity * 0.5}
              metalness={config.metalness}
              roughness={config.roughness}
              flatShading
            />
          </mesh>

          {/* Patchwork color blocks — small flat-ish spheres stitched onto the body */}
          <mesh position={[0.3, 0.15, 0.55]} scale={[0.22, 0.22, 0.05]} castShadow>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color={patchColors[1]} metalness={0.1} roughness={0.85} />
          </mesh>
          <mesh position={[-0.32, -0.1, 0.5]} scale={[0.18, 0.18, 0.05]} castShadow>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color={patchColors[2]} metalness={0.1} roughness={0.85} />
          </mesh>
          {/* Stage 2+: extra patch */}
          {stage >= 2 && (
            <mesh position={[0.1, -0.35, 0.6]} scale={[0.2, 0.16, 0.05]} castShadow>
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial color={patchColors[3]} metalness={0.1} roughness={0.85} emissive={config.emissiveColor} emissiveIntensity={config.emissiveIntensity * 0.3} />
            </mesh>
          )}
          {/* Stage 3: another small patch */}
          {stage >= 3 && (
            <mesh position={[-0.2, 0.3, 0.55]} scale={[0.14, 0.14, 0.05]} castShadow>
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial color={patchColors[0]} metalness={0.1} roughness={0.85} />
            </mesh>
          )}

          {/* Eyes — black button cylinders facing forward, with thread X */}
          {([
            { x: 0.18, dir: 1 },
            { x: -0.18, dir: -1 },
          ] as const).map((eye, i) => (
            <group key={i} position={[eye.x, 0.18, 0.62]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.07, 0.04, 16]} />
                <meshStandardMaterial color="#000000" metalness={0.7} roughness={0.2} />
              </mesh>
              {/* Button holes — 4 small dimples */}
              {[
                [0.025, 0.025],
                [-0.025, 0.025],
                [0.025, -0.025],
                [-0.025, -0.025],
              ].map(([hx, hy], j) => (
                <mesh key={j} position={[hx, hy, 0.025]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.008, 0.008, 0.02, 6]} />
                  <meshStandardMaterial color={threadColor} metalness={0.3} roughness={0.7} />
                </mesh>
              ))}
              {/* Thread X — two thin crossed cylinders over the button */}
              <mesh rotation={[Math.PI / 2, Math.PI / 4, 0]} position={[0, 0, 0.022]}>
                <cylinderGeometry args={[0.005, 0.005, 0.13, 5]} />
                <meshStandardMaterial color={threadColor} metalness={0.3} roughness={0.7} />
              </mesh>
              <mesh rotation={[Math.PI / 2, -Math.PI / 4, 0]} position={[0, 0, 0.022]}>
                <cylinderGeometry args={[0.005, 0.005, 0.13, 5]} />
                <meshStandardMaterial color={threadColor} metalness={0.3} roughness={0.7} />
              </mesh>
            </group>
          ))}

          {/* Mouth — thin stitched arc (smiling slightly) */}
          <mesh position={[0, -0.08, 0.64]} rotation={[Math.PI / 2, 0, Math.PI]}>
            <torusGeometry args={[0.1, 0.012, 8, 16, Math.PI]} />
            <meshStandardMaterial color={stitchColor} metalness={0.3} roughness={0.6} />
          </mesh>
          {/* Mouth stitch marks — small dashes along the arc */}
          {Array.from({ length: 5 }, (_, i) => (
            <mesh
              key={i}
              position={[Math.cos(Math.PI + i * 0.4) * 0.1, -0.08 + Math.sin(Math.PI + i * 0.4) * 0.1, 0.65]}
              rotation={[Math.PI / 2, 0, i * 0.4]}
            >
              <cylinderGeometry args={[0.005, 0.005, 0.04, 5]} />
              <meshStandardMaterial color={stitchColor} metalness={0.3} roughness={0.6} />
            </mesh>
          ))}

          {/* Yarn hair/tassel on top — several thin twisted cylinders */}
          {Array.from({ length: 5 }, (_, i) => {
            const a = (i / 5) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * 0.35, 0.7, Math.sin(a) * 0.35]}
                rotation={[Math.cos(a) * 0.4, 0, -Math.sin(a) * 0.4]}
                castShadow
              >
                <cylinderGeometry args={[0.02, 0.015, 0.3, 6]} />
                <meshStandardMaterial
                  color={threadColor}
                  metalness={0.1}
                  roughness={0.9}
                  emissive={config.emissiveColor}
                  emissiveIntensity={config.emissiveIntensity * 0.15}
                />
              </mesh>
            );
          })}
          {/* Top knot — a small yarn ball */}
          <mesh position={[0, 0.85, 0]} castShadow>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color={threadColor} metalness={0.1} roughness={0.9} />
          </mesh>

          {/* Seam lines — thin torus rings around the body suggesting stitched panels */}
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.7, 0.01, 8, 48]} />
            <meshStandardMaterial color={stitchColor} metalness={0.2} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <torusGeometry args={[0.55, 0.008, 8, 48]} />
            <meshStandardMaterial color={stitchColor} metalness={0.2} roughness={0.7} />
          </mesh>
          {/* Stage 2+: extra seam line */}
          {stage >= 2 && (
            <mesh position={[0, -0.3, 0]}>
              <torusGeometry args={[0.6, 0.008, 8, 48]} />
              <meshStandardMaterial color={stitchColor} metalness={0.2} roughness={0.7} />
            </mesh>
          )}

          {/* Decorative stitches at various angles across the body */}
          <Stitch position={[0, 0.35, 0.45]} rotation={[Math.PI / 2, 0, 0.4]} color={stitchColor} />
          <Stitch position={[0.35, -0.1, 0.35]} rotation={[Math.PI / 2, 0.6, 0]} color={stitchColor} radius={0.12} />
          <Stitch position={[-0.32, -0.2, 0.4]} rotation={[Math.PI / 2, -0.5, 0.2]} color={stitchColor} radius={0.12} />
          <Stitch position={[0, -0.45, 0.3]} rotation={[Math.PI / 2, 0, -0.3]} color={stitchColor} radius={0.1} />
          {stage >= 2 && (
            <Stitch position={[0.2, 0.5, 0.3]} rotation={[Math.PI / 2, 0.3, 0.4]} color={stitchColor} radius={0.1} />
          )}

          {/* Arms — thin cylinders with joint spheres, angled down at sides (stage 2+ = longer) */}
          <group ref={armLRef} position={[0.55, -0.1, 0]}>
            <mesh rotation={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, stage >= 2 ? 0.6 : 0.5, 8]} />
              <meshStandardMaterial color={threadColor} metalness={0.2} roughness={0.85} />
            </mesh>
            {/* hand — small fabric ball at the end */}
            <mesh position={[0, stage >= 2 ? -0.32 : -0.27, 0]}>
              <sphereGeometry args={[0.05, 12, 12]} />
              <meshStandardMaterial color={config.primaryColor} metalness={0.1} roughness={0.85} />
            </mesh>
          </group>
          <group ref={armRRef} position={[-0.55, -0.1, 0]}>
            <mesh rotation={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, stage >= 2 ? 0.6 : 0.5, 8]} />
              <meshStandardMaterial color={threadColor} metalness={0.2} roughness={0.85} />
            </mesh>
            <mesh position={[0, stage >= 2 ? -0.32 : -0.27, 0]}>
              <sphereGeometry args={[0.05, 12, 12]} />
              <meshStandardMaterial color={config.primaryColor} metalness={0.1} roughness={0.85} />
            </mesh>
          </group>

          {/* Legs — thin cylinders at bottom (stage 2+ = longer) */}
          {([
            { x: 0.2, r: 0.05 },
            { x: -0.2, r: -0.05 },
          ] as const).map((leg, i) => (
            <group key={i} position={[leg.x, -0.75, 0]} rotation={[0, 0, leg.r]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.025, 0.025, stage >= 2 ? 0.6 : 0.5, 8]} />
                <meshStandardMaterial color={threadColor} metalness={0.2} roughness={0.85} />
              </mesh>
              {/* foot — small fabric ball */}
              <mesh position={[0, stage >= 2 ? -0.32 : -0.27, 0.02]}>
                <sphereGeometry args={[0.06, 12, 12]} />
                <meshStandardMaterial color={config.primaryColor} metalness={0.1} roughness={0.85} />
              </mesh>
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
