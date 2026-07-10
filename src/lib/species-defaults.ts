// Shared species-default 3D model configs.
//
// Imported by:
//  - src/components/familiar/models/FamiliarModel.tsx (client-side dispatcher)
//  - src/app/api/auth/register/route.ts (server-side: persist initial modelConfig)
//
// Keeping these in a non-React module lets both server and client import them
// without dragging in JSX / 'use client' boundaries.

import type { ModelConfig, Species } from './types';

export const SPECIES_MODEL_DEFAULTS: Record<Species, ModelConfig> = {
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
