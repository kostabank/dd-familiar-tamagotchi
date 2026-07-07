'use client';

import { useMemo } from 'react';
import type { Species, FamiliarState, ModelConfig } from '@/lib/types';
import ConstructFamiliar from './ConstructFamiliar';
import DragonFamiliar from './DragonFamiliar';
import MagpieFamiliar from './MagpieFamiliar';
import DollFamiliar from './DollFamiliar';
import ZParticles from '../ZParticles';

const DEFAULTS: Record<Species, ModelConfig> = {
  construct: {
    primaryColor: '#4a5568',
    emissiveColor: '#3b82f6',
    emissiveIntensity: 1.5,
    scale: 1,
    metalness: 0.9,
    roughness: 0.3,
  },
  dragon: {
    primaryColor: '#0d9488',
    emissiveColor: '#2dd4bf',
    emissiveIntensity: 0.7,
    scale: 1,
    metalness: 0.4,
    roughness: 0.45,
    accentColor: '#5eead4',
    ornamentColor: '#134e4a',
  },
  magpie: {
    primaryColor: '#0a0a0a',
    emissiveColor: '#e2e8f0',
    emissiveIntensity: 0.2,
    scale: 1,
    metalness: 0.5,
    roughness: 0.35,
    accentColor: '#f8fafc',
    ornamentColor: '#f97316',
  },
  doll: {
    primaryColor: '#6b5b4a',
    emissiveColor: '#a855f7',
    emissiveIntensity: 0.4,
    scale: 1,
    metalness: 0.1,
    roughness: 0.85,
    accentColor: '#1c1917',
    ornamentColor: '#000000',
  },
};

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
 */
export default function FamiliarModel({ species, stage, state, modelConfigOverride }: Props) {
  const config = useMemo<ModelConfig>(() => {
    const base = DEFAULTS[species];
    return { ...base, ...(modelConfigOverride ?? {}) };
  }, [species, modelConfigOverride]);

  // Stage bumps overall scale by 15% per stage above 1.
  const stageScale = 1 + (stage - 1) * 0.15;

  const showZ = state === 'sleeping';

  const renderSpecies = () => {
    switch (species) {
      case 'construct':
        return <ConstructFamiliar config={config} state={state} />;
      case 'dragon':
        return <DragonFamiliar config={config} state={state} />;
      case 'magpie':
        return <MagpieFamiliar config={config} state={state} />;
      case 'doll':
        return <DollFamiliar config={config} state={state} />;
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
