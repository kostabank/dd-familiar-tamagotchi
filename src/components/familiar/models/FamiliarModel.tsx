'use client';

import { useMemo } from 'react';
import type { Species, FamiliarState, ModelConfig } from '@/lib/types';
import { SPECIES_MODEL_DEFAULTS } from '@/lib/species-defaults';
import ConstructFamiliar from './ConstructFamiliar';
import DragonFamiliar from './DragonFamiliar';
import MagpieFamiliar from './MagpieFamiliar';
import DollFamiliar from './DollFamiliar';
import SpriteFamiliar from './SpriteFamiliar';
import ZParticles from '../ZParticles';

export { SPECIES_MODEL_DEFAULTS };

interface Props {
  species: Species;
  stage: 1 | 2 | 3;
  state: FamiliarState;
  modelConfigOverride?: Partial<ModelConfig>;
}

/**
 * Dispatcher: renders the familiar using a high-quality pre-generated sprite
 * (default) or falls back to the procedural 3D model.
 *
 * The sprite approach gives much better visual quality than procedural
 * primitives while still living in the 3D scene (billboard, particles,
 * lighting, float/bob animations). Evolution-path colors tint the sprite
 * subtly. Stage 3 adds an aura.
 *
 * To switch back to full 3D procedural models, set USE_SPRITES to false.
 */
const USE_SPRITES = true;

export default function FamiliarModel({ species, stage, state, modelConfigOverride }: Props) {
  const config = useMemo<ModelConfig>(() => {
    const base = SPECIES_MODEL_DEFAULTS[species];
    return { ...base, ...(modelConfigOverride ?? {}) };
  }, [species, modelConfigOverride]);

  const showZ = state === 'sleeping';

  if (USE_SPRITES) {
    return (
      <group>
        <SpriteFamiliar
          species={species}
          stage={stage}
          state={state}
          modelConfigOverride={modelConfigOverride}
        />
        {showZ && <ZParticles />}
      </group>
    );
  }

  const renderSpecies = () => {
    switch (species) {
      case 'construct':
        return <ConstructFamiliar config={config} stage={stage} state={state} />;
      case 'dragon':
        return <DragonFamiliar config={config} stage={stage} state={state} />;
      case 'magpie':
        return <MagpieFamiliar config={config} stage={stage} state={state} />;
      case 'doll':
        return <DollFamiliar config={config} stage={stage} state={state} />;
      default:
        return null;
    }
  };

  // Stage bumps overall scale by 18% per stage above 1 (sprites use their own scaling).
  const stageScale = 1 + (stage - 1) * 0.15;

  return (
    <group scale={stageScale}>
      {renderSpecies()}
      {showZ && <ZParticles />}
    </group>
  );
}
