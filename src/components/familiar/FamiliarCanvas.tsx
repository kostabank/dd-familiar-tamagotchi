'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, OrbitControls, Sparkles } from '@react-three/drei';
import type { Species, FamiliarState, ModelConfig } from '@/lib/types';
import FamiliarModel from './models/FamiliarModel';
import EvolutionAnimation from './EvolutionAnimation';
import HeartBurst from './HeartBurst';

interface Props {
  species: Species;
  stage: 1 | 2 | 3;
  state: FamiliarState;
  modelConfigOverride?: Partial<ModelConfig>;
  evolving?: boolean;
  onEvolutionComplete?: () => void;
  /** Increment to trigger a heart-particle burst (pet action). */
  petTrigger?: number;
}

// Used to tint the evolution flash if no override supplied.
const SPECIES_EMISSIVE: Record<Species, string> = {
  construct: '#3b82f6',
  dragon: '#2dd4bf',
  magpie: '#e2e8f0',
  doll: '#a855f7',
};

/**
 * Top-level R3F canvas wrapper. Fills its parent element (must have an
 * explicit width/height — e.g. aspect-ratio wrapper or fixed-height div).
 */
export default function FamiliarCanvas({
  species,
  stage,
  state,
  modelConfigOverride,
  evolving = false,
  onEvolutionComplete,
  petTrigger = 0,
}: Props) {
  const flashColor = modelConfigOverride?.emissiveColor ?? SPECIES_EMISSIVE[species];

  return (
    <Canvas
      shadows
      camera={{ position: [0, 1, 5], fov: 45 }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <color attach="background" args={['#0F0F1A']} />
      <fog attach="fog" args={['#0F0F1A', 8, 18]} />

      {/* Lighting rig — dark-fantasy key + cool rim + purple accent */}
      <ambientLight intensity={0.3} />
      <spotLight
        position={[5, 8, 5]}
        angle={0.3}
        penumbra={1}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-5, 3, -5]} intensity={0.6} color="#A855F7" />

      {/* Ambient drifting sparkle dust for atmosphere */}
      <Sparkles count={40} scale={[6, 4, 6]} size={2} speed={0.2} opacity={0.4} color="#A855F7" />

      <Suspense fallback={null}>
        <FamiliarModel
          species={species}
          stage={stage}
          state={state}
          modelConfigOverride={modelConfigOverride}
        />

        <HeartBurst trigger={petTrigger} />

        {evolving && (
          <EvolutionAnimation
            active={evolving}
            emissiveColor={flashColor}
            onComplete={() => onEvolutionComplete?.()}
          />
        )}

        <Environment preset="night" />
        <ContactShadows
          position={[0, -1.5, 0]}
          opacity={0.5}
          scale={10}
          blur={2.5}
          far={4}
          color="#000000"
        />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={8}
        minPolarAngle={0.5}
        maxPolarAngle={Math.PI / 2 + 0.3}
        autoRotate
        autoRotateSpeed={0.6}
        enableDamping
        dampingFactor={0.08}
        enabled={!evolving}
      />
    </Canvas>
  );
}
