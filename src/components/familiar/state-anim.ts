'use client';

import * as THREE from 'three';
import type { FamiliarState } from '@/lib/types';

export interface StateTargets {
  floatSpeed: number;
  floatIntensity: number;
  rotationIntensity: number;
  emissiveMultiplier: number;
  groupPositionY: number;
  groupRotationY: number;
  groupRotationX: number;
  groupRotationZ: number;
  showZ: boolean;
}

/**
 * Compute the target animation parameters for a given FamiliarState.
 * Models lerp their refs toward these targets each frame for smooth transitions.
 */
export function getStateTargets(state: FamiliarState): StateTargets {
  switch (state) {
    case 'happy':
      return {
        floatSpeed: 3,
        floatIntensity: 0.6,
        rotationIntensity: 1.2,
        emissiveMultiplier: 1.4,
        groupPositionY: 0,
        groupRotationY: 0,
        groupRotationX: 0,
        groupRotationZ: 0,
        showZ: false,
      };
    case 'hungry':
      return {
        floatSpeed: 0.5,
        floatIntensity: 0.15,
        rotationIntensity: 0.2,
        emissiveMultiplier: 0.3,
        groupPositionY: -0.4,
        groupRotationY: 0,
        groupRotationX: 0.15,
        groupRotationZ: 0,
        showZ: false,
      };
    case 'sad':
      return {
        floatSpeed: 0.8,
        floatIntensity: 0.2,
        rotationIntensity: 0.3,
        emissiveMultiplier: 0.5,
        groupPositionY: -0.1,
        groupRotationY: Math.PI * 0.3,
        groupRotationX: 0,
        groupRotationZ: 0,
        showZ: false,
      };
    case 'tired':
      return {
        floatSpeed: 0.6,
        floatIntensity: 0.25,
        rotationIntensity: 0.4,
        emissiveMultiplier: 0.5,
        groupPositionY: -0.15,
        groupRotationY: 0,
        groupRotationX: 0,
        groupRotationZ: 0,
        showZ: false,
      };
    case 'sleeping':
      return {
        floatSpeed: 0.3,
        floatIntensity: 0.08,
        rotationIntensity: 0.1,
        emissiveMultiplier: 0.2,
        groupPositionY: -0.3,
        groupRotationY: 0,
        groupRotationX: 0.2,
        groupRotationZ: (Math.PI / 2) * 0.6,
        showZ: true,
      };
    case 'normal':
    default:
      return {
        floatSpeed: 1.5,
        floatIntensity: 0.35,
        rotationIntensity: 0.6,
        emissiveMultiplier: 1,
        groupPositionY: 0,
        groupRotationY: 0,
        groupRotationX: 0,
        groupRotationZ: 0,
        showZ: false,
      };
  }
}

/** Smoothly lerp a group toward state targets, plus state-specific secondary motion. */
export function applyStateToGroup(
  group: THREE.Group | null,
  targets: StateTargets,
  t: number,
  delta: number
) {
  if (!group) return;
  const k = 1 - Math.pow(0.001, delta); // frame-rate independent lerp factor
  group.position.y = THREE.MathUtils.lerp(group.position.y, targets.groupPositionY, k);
  group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targets.groupRotationY, k);
  group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targets.groupRotationX, k);
  group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, targets.groupRotationZ, k);
}
