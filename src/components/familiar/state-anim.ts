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

/**
 * Breathing helper — returns a subtle Y-scale factor (≈0.97..1.03) that
 * species bodies can apply each frame for a "living" feel. Sleeping breathes
 * slower & deeper, happy breathes faster.
 */
export function breathingScale(state: FamiliarState, t: number): number {
  switch (state) {
    case 'sleeping':
      return 1 + Math.sin(t * 0.8) * 0.025;
    case 'happy':
      return 1 + Math.sin(t * 2.4) * 0.022;
    case 'tired':
      return 1 + Math.sin(t * 0.9) * 0.015;
    case 'sad':
      return 1 + Math.sin(t * 0.7) * 0.01;
    default:
      return 1 + Math.sin(t * 1.5) * 0.018;
  }
}

/**
 * Blink helper — returns 1.0 most of the time, briefly dropping to ~0.1 every
 * few seconds to simulate eyelid closure. The blink itself lasts ~0.12s.
 * Sleeping familiars keep their eyes closed (returns 0.1).
 */
export function blinkScale(state: FamiliarState, t: number): number {
  if (state === 'sleeping') return 0.1;
  // 3.7s cycle: blink at t mod 3.7 in [0, 0.12].
  const cycle = 3.7;
  const phase = t % cycle;
  if (phase < 0.12) {
    // smooth dip: cosine curve from 1 -> 0.1 -> 1 over 0.12s
    const p = phase / 0.12;
    return 0.1 + 0.9 * (0.5 - 0.5 * Math.cos(p * Math.PI * 2));
  }
  return 1;
}

/**
 * State-specific secondary vertical bob for the whole creature.
 * Happy = bouncy, sad = droop, sleeping = gentle rise/fall.
 */
export function idleBob(state: FamiliarState, t: number): number {
  switch (state) {
    case 'happy':
      return Math.abs(Math.sin(t * 3.2)) * 0.08;
    case 'sleeping':
      return Math.sin(t * 0.7) * 0.04;
    case 'sad':
      return -0.05;
    case 'tired':
      return Math.sin(t * 0.6) * 0.02;
    case 'hungry':
      return Math.sin(t * 1.4) * 0.015;
    default:
      return Math.sin(t * 1.1) * 0.03;
  }
}
