'use client';

import { useMemo } from 'react';
import type { Species, FamiliarState, ModelConfig } from '@/lib/types';
import { SPECIES_MODEL_DEFAULTS } from '@/lib/species-defaults';
import ConstructFamiliar from './ConstructFamiliar';
import DragonFamiliar from './DragonFamiliar';
import MagpieFamiliar from './MagpieFamiliar';
import DollFamiliar from './DollFamiliar';
import ZParticles from '../ZParticles';

export { SPECIES_MODEL_DEFAULTS };

interface Props {
  species: Species;
  stage: 1 | 2 | 3;
  state: FamiliarState;
  modelConfigOverride?: Partial<ModelConfig>;
}

/**
 * Dispatcher: merges default ModelConfig for the species with any override,
 * applies the stage-based extra scale (1 + (stage-1)*0.15), renders the
 * species-specific model, and overlays ZParticles while sleeping.
 *
 * The species components receive `stage` directly so they can grow extra
 * geometry (horns, crest, aura, sigil, …) at higher stages — this drives the
 * "thoughtful evolution" visual progression.
 */
export default function FamiliarModel({ species, stage, state, modelConfigOverride }: Props) {
  const config = useMemo<ModelConfig>(() => {
    const base = SPECIES_MODEL_DEFAULTS[species];
    return { ...base, ...(modelConfigOverride ?? {}) };
  }, [species, modelConfigOverride]);

  // Stage bumps overall scale by 15% per stage above 1.
  const stageScale = 1 + (stage - 1) * 0.15;

  const showZ = state === 'sleeping';

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

  return (
    <group scale={stageScale}>
      {renderSpecies()}
      {showZ && <ZParticles />}
    </group>
  );
}
