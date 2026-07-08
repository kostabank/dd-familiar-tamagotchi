'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, OrbitControls, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import type { Species, FamiliarState, ModelConfig } from '@/lib/types';
import FamiliarModel from './models/FamiliarModel';
import EvolutionAnimation from './EvolutionAnimation';
import HeartBurst from './HeartBurst';
import FamiliarThoughts from './FamiliarThoughts';

interface Props {
  species: Species;
  stage: 1 | 2 | 3;
  state: FamiliarState;
  modelConfigOverride?: Partial<ModelConfig>;
  evolving?: boolean;
  onEvolutionComplete?: () => void;
  /** Increment to trigger a heart-particle burst (pet action). */
  petTrigger?: number;
  /** Stats for context-aware thought bubbles. Omit to hide thoughts. */
  thoughts?: {
    energy: number;
    mood: number;
    fatigue: number;
    health: number;
    sync: number;
  };
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
  thoughts,
}: Props) {
  const flashColor = modelConfigOverride?.emissiveColor ?? SPECIES_EMISSIVE[species];

  return (
    <Canvas
      shadows="percentage"
      camera={{ position: [0, 0.6, 3.6], fov: 42 }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <color attach="background" args={['#0F0F1A']} />
      <fog attach="fog" args={['#0F0F1A', 9, 20]} />

      {/* Lighting rig — key + rim + fill for a polished, dimensional look */}
      <ambientLight intensity={0.45} />
      {/* Key light — warm-ish, front-right above */}
      <spotLight
        position={[4, 6, 5]}
        angle={0.4}
        penumbra={1}
        intensity={2.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* Rim light — behind/above to define the silhouette edge */}
      <spotLight position={[0, 5, -4]} angle={0.5} penumbra={1} intensity={1.6} color={modelConfigOverride?.emissiveColor ?? '#A855F7'} />
      {/* Fill light — cool, left, to soften shadows */}
      <pointLight position={[-4, 2, 3]} intensity={0.5} color="#60A5FA" />

      {/* Ambient drifting sparkle dust for atmosphere — density scales with stage */}
      <Sparkles
        count={stage >= 3 ? 120 : stage === 2 ? 80 : 40}
        scale={[6, 4, 6]}
        size={2}
        speed={0.2}
        opacity={stage >= 3 ? 0.6 : 0.4}
        color={modelConfigOverride?.auraColor ?? modelConfigOverride?.emissiveColor ?? '#A855F7'}
      />

      <Suspense fallback={null}>
        <FamiliarModel
          species={species}
          stage={stage}
          state={state}
          modelConfigOverride={modelConfigOverride}
        />

        <HeartBurst trigger={petTrigger} />

        {/* Thought bubble (DOM overlay in 3D space) — hidden during evolution */}
        {!evolving && thoughts && (
          <FamiliarThoughts
            state={state}
            energy={thoughts.energy}
            mood={thoughts.mood}
            fatigue={thoughts.fatigue}
            health={thoughts.health}
            sync={thoughts.sync}
            trigger={petTrigger}
          />
        )}

        {evolving && (
          <EvolutionAnimation
            active={evolving}
            emissiveColor={flashColor}
            onComplete={() => onEvolutionComplete?.()}
          />
        )}

        <ContactShadows
          position={[0, -1.5, 0]}
          opacity={0.5}
          scale={10}
          blur={2.5}
          far={4}
          color="#000000"
        />
      </Suspense>

      {/* Environment (HDR) in its own Suspense so the model renders even if
          the HDR fails to load — otherwise a blocked CDN would leave the
          whole scene empty with only the Sparkles showing. */}
      <Suspense fallback={null}>
        <Environment preset="night" />
      </Suspense>

      {/* Post-processing: bloom makes emissive elements (eyes, core, aura)
          glow softly — gives a polished game-like look. Vignette darkens the
          edges to focus attention on the creature. */}
      <EffectComposer>
        <Bloom
          intensity={0.9}
          luminanceThreshold={0.35}
          luminanceSmoothing={0.6}
          mipmapBlur
          radius={0.7}
        />
        <Vignette eskil={false} offset={0.25} darkness={0.55} />
      </EffectComposer>

      <OrbitControls
        enablePan={false}
        minDistance={2.2}
        maxDistance={6}
        minPolarAngle={0.5}
        maxPolarAngle={Math.PI / 2 + 0.3}
        autoRotate
        autoRotateSpeed={0.5}
        enableDamping
        dampingFactor={0.08}
        enabled={!evolving}
      />
    </Canvas>
  );
}
