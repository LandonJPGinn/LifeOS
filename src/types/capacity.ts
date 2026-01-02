/**
 * LifeOS Capacity States
 * 
 * User only declares current capacity. No urgency, no streaks, no catch-up.
 * System owns daily expectations based on declared state.
 */

/**
 * The six capacity states a user can declare.
 * - foggy: Low clarity, minimal cognitive resources (DEFAULT state)
 * - anxious: High stress/worry, needs reduced stimulation
 * - flat: Low energy/motivation, needs gentle engagement
 * - overstimulated: Sensory/cognitive overload, needs protection
 * - driven: High capacity, can handle full workload
 * - productive: Very high capacity, can handle a very full workload
 */
export type CapacityState = 'foggy' | 'anxious' | 'flat' | 'overstimulated' | 'driven' | 'productive';

/**
 * Default state when no capacity is declared
 */
export const DEFAULT_CAPACITY: CapacityState = 'foggy';

/**
 * All valid capacity states for validation
 */
export const CAPACITY_STATES: readonly CapacityState[] = [
  'foggy',
  'anxious',
  'flat',
  'overstimulated',
  'driven',
  'productive'
] as const;

/**
 * Check if a value is a valid capacity state
 */
export function isValidCapacity(value: unknown): value is CapacityState {
  return typeof value === 'string' && CAPACITY_STATES.includes(value as CapacityState);
}
