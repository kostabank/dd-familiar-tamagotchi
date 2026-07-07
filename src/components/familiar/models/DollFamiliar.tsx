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

interface StitchProps {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
}

/** A single stitch ring — declared at module scope so React doesn't
 *  treat it as a freshly-created component each render. */
function Stitch({ position, rotation, color }: StitchProps) {
  return (
    <mesh position={position} rotation={rotation}>
      <torusGeometry args={[0.15, 0.012, 8, 32]} />
      <meshStandardMaterial color={color} metalness={0.2} roughness={0.7} />
    </mesh>
  );
}

/**
 * Doll Familiar — an animated fabric doll with button eyes,
 * thread-limbs and stitch-marks across its baggy body.
 * Brown burlap + dark thread + faint purple soul-glow.
 */
export default function DollFamiliar({ config, state }: Props) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((frameState, delta) => {
    const t = frameState.clock.elapsedTime;
    const targets = getStateTargets(state);
    applyStateToGroup(rootRef.current, targets, t, delta);

    // Fabric body faint inner glow scaled by state.
    if (bodyMatRef.current) {
      bodyMatRef.current.emissiveIntensity =
        config.emissiveIntensity * targets.emissiveMultiplier * 0.5;
    }

    // Tired: gentle nod. Sad: shake. Happy: tiny extra bounce via rotation.
    if (rootRef.current) {
      if (state === 'tired') {
        rootRef.current.rotation.x += Math.sin(t * 1.5) * 0.02;
      } else if (state === 'sad') {
        rootRef.current.position.x = Math.sin(t * 20) * 0.02;
      } else if (state === 'happy') {
        rootRef.current.position.y += Math.sin(t * 6) * 0.005;
      } else {
        rootRef.current.position.x = THREE.MathUtils.lerp(rootRef.current.position.x, 0, 0.1);
      }
    }
  });

  const targets = getStateTargets(state);
  const threadColor = config.accentColor ?? '#1c1917';
  const stitchColor = config.ornamentColor ?? '#000000';

  return (
    <group ref={rootRef}>
      <Float
        speed={targets.floatSpeed}
        floatIntensity={targets.floatIntensity}
        rotationIntensity={targets.rotationIntensity}
      >
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
          />
        </mesh>

        {/* Eyes — black button cylinders facing forward */}
        <mesh position={[0.18, 0.18, 0.62]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
          <meshStandardMaterial color="#000000" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[-0.18, 0.18, 0.62]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
          <meshStandardMaterial color="#000000" metalness={0.7} roughness={0.2} />
        </mesh>

        {/* Mouth — thin black torus arc, smiling slightly */}
        <mesh position={[0, -0.08, 0.64]} rotation={[Math.PI / 2, 0, Math.PI]}>
          <torusGeometry args={[0.1, 0.012, 8, 16, Math.PI]} />
          <meshStandardMaterial color={stitchColor} metalness={0.3} roughness={0.6} />
        </mesh>

        {/* Stitches — several thin rings at various angles across the body */}
        <Stitch position={[0, 0.35, 0.45]} rotation={[Math.PI / 2, 0, 0.4]} color={stitchColor} />
        <Stitch position={[0.35, -0.1, 0.35]} rotation={[Math.PI / 2, 0.6, 0]} color={stitchColor} />
        <Stitch position={[-0.32, -0.2, 0.4]} rotation={[Math.PI / 2, -0.5, 0.2]} color={stitchColor} />
        <Stitch position={[0, -0.45, 0.3]} rotation={[Math.PI / 2, 0, -0.3]} color={stitchColor} />

        {/* Arms — thin cylinders angled down at sides */}
        <mesh position={[0.55, -0.1, 0]} rotation={[0, 0, Math.PI * 0.18]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />
          <meshStandardMaterial color={threadColor} metalness={0.2} roughness={0.85} />
        </mesh>
        <mesh position={[-0.55, -0.1, 0]} rotation={[0, 0, -Math.PI * 0.18]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />
          <meshStandardMaterial color={threadColor} metalness={0.2} roughness={0.85} />
        </mesh>

        {/* Legs — thin cylinders at bottom */}
        <mesh position={[0.2, -0.75, 0]} rotation={[0, 0, Math.PI * 0.05]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />
          <meshStandardMaterial color={threadColor} metalness={0.2} roughness={0.85} />
        </mesh>
        <mesh position={[-0.2, -0.75, 0]} rotation={[0, 0, -Math.PI * 0.05]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />
          <meshStandardMaterial color={threadColor} metalness={0.2} roughness={0.85} />
        </mesh>
      </Float>
    </group>
  );
}
