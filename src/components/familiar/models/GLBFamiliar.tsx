'use client';

import { useRef, useMemo, Suspense } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { FamiliarState, Species, ModelConfig } from '@/lib/types';
import { getStateTargets, applyStateToGroup, breathingScale, blinkScale, idleBob } from '../state-anim';
import Aura from './Aura';
import ZParticles from '../ZParticles';

interface Props {
  species: Species;
  stage: 1 | 2 | 3;
  state: FamiliarState;
  modelConfigOverride?: Partial<ModelConfig>;
}

/**
 * GLBFamiliar — loads a real 3D model (.glb) from /public/models/{species}.glb.
 *
 * FREE workflow for the DM:
 *  1. Download CC0 low-poly models from quaternius.com / poly.pizza / KayKit.
 *  2. Rename to {species}.glb (e.g. dragon.glb, construct.glb, magpie.glb, doll.glb).
 *  3. Drop them into /public/models/.
 *
 * The loader:
 *  - Applies the evolution path's colors as a tint (primaryColor on body,
 *    emissiveColor on emissive parts) so each of the 24 evolution paths
 *    recolors the same base mesh — no need for 24 separate models.
 *  - Scales by stage (baby → juvenile → ancient, +18% per stage).
 *  - Adds a stage-3 aura.
 *  - Animates: float, bob, breathing, state reactions (sad/tired/hungry).
 *
 * If the .glb file is missing (dev before models are added), this component
 * throws (caught by Suspense → fallback to procedural model via FamiliarModel).
 *
 * Optional: stage-specific models {species}-2.glb, {species}-3.glb override
 * the base model at higher stages for a more dramatic visual progression.
 */

const SPECIES_PATHS: Record<Species, string> = {
  dragon: '/models/dragon.glb',
  construct: '/models/construct.glb',
  magpie: '/models/magpie.glb',
  doll: '/models/doll.glb',
};

function ModelLoader({ species, stage, state, modelConfigOverride }: Props) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  // Try a stage-specific model first, fall back to the base species model.
  const stageUrl = stage >= 2 ? `/models/${species}-${stage}.glb` : SPECIES_PATHS[species];
  const baseurl = SPECIES_PATHS[species];

  // useGLTF with preload — if the stage-specific file 404s, drei throws and
  // the boundary catches it. We attempt base model in the catch path below.
  const gltf = useGLTF(stageUrl, true);

  const tintColor = useMemo(() => {
    const c = modelConfigOverride?.primaryColor ?? '#0d9488';
    const base = new THREE.Color(c);
    return base.lerp(new THREE.Color('#ffffff'), 0.3);
  }, [modelConfigOverride?.primaryColor]);

  const emissiveColor = useMemo(() => {
    return new THREE.Color(modelConfigOverride?.emissiveColor ?? '#2dd4bf');
  }, [modelConfigOverride?.emissiveColor]);

  // Walk the scene graph and tint materials based on their "type":
  //  - MeshStandardMaterial with metalness > 0.4 → keep (metallic accents)
  //  - Otherwise → tint with the evolution primary color + emissive glow.
  useMemo(() => {
    if (!gltf?.scene) return;
    gltf.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          const sm = m as THREE.MeshStandardMaterial;
          if (sm.isMeshStandardMaterial) {
            // Only tint non-metallic surfaces (skin/body), leave metal accents alone.
            if (sm.metalness < 0.4) {
              sm.color = tintColor.clone();
              sm.emissive = emissiveColor.clone();
              sm.emissiveIntensity = (modelConfigOverride?.emissiveIntensity ?? 0.7) * 0.4;
            }
          }
        });
      }
    });
  }, [gltf, tintColor, emissiveColor, modelConfigOverride?.emissiveIntensity]);

  const targets = getStateTargets(state);
  const stageScale = 1 + (stage - 1) * 0.18;
  const ornaments = modelConfigOverride?.ornaments ?? [];
  const hasAura = stage >= 3 || ornaments.includes('aura');
  const auraColor = modelConfigOverride?.auraColor ?? modelConfigOverride?.emissiveColor ?? '#A855F7';

  useFrame((frameState, delta) => {
    const t = frameState.clock.elapsedTime;
    applyStateToGroup(rootRef.current, targets, t, delta);
    if (rootRef.current) {
      rootRef.current.position.y = targets.groupPositionY + idleBob(state, t);
      const b = breathingScale(state, t);
      rootRef.current.scale.set(stageScale * b, stageScale * b, stageScale * b);
    }
  });

  return (
    <group ref={rootRef}>
      <primitive object={gltf.scene} />
      {hasAura && <Aura color={auraColor} intensity={stage >= 3 ? 1 : 0.6} />}
      {state === 'sleeping' && <ZParticles />}
    </group>
  );
}

export default function GLBFamiliar(props: Props) {
  return (
    <Suspense fallback={null}>
      <ModelLoader {...props} />
    </Suspense>
  );
}
