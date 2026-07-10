'use client';

import { useMemo, useState, useEffect } from 'react';
import type { Species, FamiliarState, ModelConfig } from '@/lib/types';
import { SPECIES_MODEL_DEFAULTS } from '@/lib/species-defaults';
import ConstructFamiliar from './ConstructFamiliar';
import DragonFamiliar from './DragonFamiliar';
import MagpieFamiliar from './MagpieFamiliar';
import DollFamiliar from './DollFamiliar';
import GLBFamiliar from './GLBFamiliar';
import ZParticles from '../ZParticles';

export { SPECIES_MODEL_DEFAULTS };

interface Props {
  species: Species;
  stage: 1 | 2 | 3;
  state: FamiliarState;
  modelConfigOverride?: Partial<ModelConfig>;
}

/**
 * Dispatcher: renders the familiar as either:
 *  1. A real 3D .glb model (if /public/models/{species}.glb exists), OR
 *  2. A procedural 3D model (default fallback).
 *
 * FREE workflow — no paid assets required:
 *  - Download CC0 low-poly models from quaternius.com / poly.pizza / KayKit.
 *  - Rename to {species}.glb and drop into /public/models/.
 *  - The loader auto-detects them via a HEAD request on mount.
 *  - Evolution-path colors are applied as material tints (no need for 24 models).
 *  - Optional stage-specific models: {species}-2.glb, {species}-3.glb.
 *
 * Until GLB files are added, the polished procedural models (with bloom)
 * are used — they look good and cost nothing.
 */
export default function FamiliarModel({ species, stage, state, modelConfigOverride }: Props) {
  const config = useMemo<ModelConfig>(() => {
    const base = SPECIES_MODEL_DEFAULTS[species];
    return { ...base, ...(modelConfigOverride ?? {}) };
  }, [species, modelConfigOverride]);

  const [useGLB, setUseGLB] = useState(false);

  // Check once whether a GLB model file exists for this species.
  useEffect(() => {
    let cancelled = false;
    fetch(`/models/${species}.glb`, { method: 'HEAD' })
      .then((r) => {
        if (!cancelled) setUseGLB(r.ok);
      })
      .catch(() => {
        if (!cancelled) setUseGLB(false);
      });
    return () => {
      cancelled = true;
    };
  }, [species]);

  const showZ = state === 'sleeping';

  // GLB model exists → use it.
  if (useGLB) {
    return (
      <GLBFamiliar
        species={species}
        stage={stage}
        state={state}
        modelConfigOverride={modelConfigOverride}
      />
    );
  }

  // Procedural 3D fallback (default — renders immediately).
  const stageScale = 1 + (stage - 1) * 0.15;
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
