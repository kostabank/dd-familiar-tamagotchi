'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Billboard, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { FamiliarState, Species, ModelConfig } from '@/lib/types';
import { getStateTargets, idleBob } from '../state-anim';
import Aura from './Aura';

interface Props {
  species: Species;
  stage: 1 | 2 | 3;
  state: FamiliarState;
  modelConfigOverride?: Partial<ModelConfig>;
}

/**
 * SpriteFamiliar — renders a high-quality pre-generated creature image as a
 * billboard (always faces camera) inside the 3D canvas. This gives a much
 * better visual quality than procedural primitives while still living in the
 * 3D scene with particles, lighting, and float/bob animations.
 *
 * The sprite's dark background blends with the canvas via additive blending,
 * so only the creature shows — creating a "magical projection" look.
 *
 * Stage progression scales the sprite up (+18% per stage) and stage 3 adds
 * an aura. Evolution-path accent colors tint the sprite subtly via material
 * color multiplication.
 */
export default function SpriteFamiliar({ species, stage, state, modelConfigOverride }: Props) {
  const rootRef = useRef<THREE.Group>(null);
  const spriteRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, `/sprites/${species}.png`);

  const ornaments = modelConfigOverride?.ornaments ?? [];
  const hasAura = stage >= 3 || ornaments.includes('aura');
  const hasSigil = stage >= 3 || ornaments.includes('sigil');
  const auraColor = modelConfigOverride?.auraColor ?? modelConfigOverride?.emissiveColor ?? '#A855F7';

  // Tint color: white = no tint, evolution path color = subtle tint.
  const tintColor = useMemo(() => {
    const c = modelConfigOverride?.primaryColor;
    if (!c) return new THREE.Color('#ffffff');
    // Mix toward white so the tint is subtle (50% original image, 50% tint).
    const base = new THREE.Color(c);
    return base.lerp(new THREE.Color('#ffffff'), 0.55);
  }, [modelConfigOverride?.primaryColor]);

  // Stage scales the sprite up.
  const stageScale = (1 + (stage - 1) * 0.18) * 2.2;

  useFrame((frameState, delta) => {
    const t = frameState.clock.elapsedTime;
    const targets = getStateTargets(state);
    if (rootRef.current) {
      rootRef.current.position.y = targets.groupPositionY + idleBob(state, t);
      // Sad: droop. Happy: tiny extra bounce. Tired: nod. Hungry: lean.
      if (state === 'sad') {
        rootRef.current.rotation.z = THREE.MathUtils.lerp(rootRef.current.rotation.z, 0.12, 0.05);
      } else if (state === 'hungry') {
        rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, 0.1, 0.05);
      } else if (state === 'tired') {
        rootRef.current.rotation.x += Math.sin(t * 1.5) * 0.015;
      } else {
        rootRef.current.rotation.z = THREE.MathUtils.lerp(rootRef.current.rotation.z, 0, 0.05);
        rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, 0, 0.05);
      }
    }
  });

  return (
    <group ref={rootRef}>
      <Float
        speed={getStateTargets(state).floatSpeed}
        floatIntensity={getStateTargets(state).floatIntensity}
        rotationIntensity={0.1}
      >
        <Billboard follow lockX={false} lockY={false}>
          <mesh ref={spriteRef} scale={stageScale}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={texture}
              transparent
              // Additive blending: dark background → transparent, creature → visible.
              // Creates a "magical projection" look against the dark canvas.
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              color={tintColor}
              toneMapped={false}
            />
          </mesh>
        </Billboard>

        {/* Stage-3 aura / sigil */}
        {hasAura && <Aura color={auraColor} intensity={stage >= 3 ? 1 : 0.6} />}
        {!hasAura && hasSigil && (
          <mesh position={[0, -1.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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
