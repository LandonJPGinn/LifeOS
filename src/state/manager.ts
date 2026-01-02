/**
 * LifeOS State Manager
 * 
 * Core state machine for capacity management.
 * - Default to foggy if no state is set
 * - State changes overwrite prior state
 * - Graceful degradation under emotional variability
 * - No streaks, reminders, or catch-up logic
 */

import { 
  type CapacityState, 
  type StateConfig, 
  DEFAULT_CAPACITY, 
  isValidCapacity 
} from '../types/index.js';
import { DEFAULT_STATE_CONFIGS } from './config.js';

/**
 * State change event for observers
 */
export interface StateChangeEvent {
  previousState: CapacityState;
  newState: CapacityState;
  timestamp: Date;
  reason?: string;
  isDegradation: boolean;
}

/**
 * State manager options
 */
export interface StateManagerOptions {
  /** Initial state (defaults to foggy) */
  initialState?: CapacityState;
  /** Callback when state changes */
  onStateChange?: (event: StateChangeEvent) => void;
}

/**
 * Central state manager for LifeOS.
 * 
 * Manages user capacity state with:
 * - Automatic default to foggy
 * - State overwrite (no history/streaks)
 * - Graceful degradation support
 */
export class StateManager {
  private currentState: CapacityState;
  private stateSetAt: Date;
  private onStateChange?: (event: StateChangeEvent) => void;

  constructor(options: StateManagerOptions = {}) {
    // Default to foggy if no state specified
    this.currentState = options.initialState ?? DEFAULT_CAPACITY;
    this.stateSetAt = new Date();
    this.onStateChange = options.onStateChange;
  }

  /**
   * Get the current capacity state
   */
  getState(): CapacityState {
    return this.currentState;
  }

  /**
   * Get the configuration for the current state
   */
  getConfig(): StateConfig {
    return DEFAULT_STATE_CONFIGS[this.currentState];
  }

  /**
   * Get when the current state was set
   */
  getStateSetAt(): Date {
    return this.stateSetAt;
  }

  /**
   * Set a new capacity state.
   * Overwrites prior state - no history maintained.
   * 
   * @param newState - The new capacity state
   * @param reason - Optional reason for the change
   * @returns true if state changed, false if invalid or same state
   */
  setState(newState: CapacityState, reason?: string): boolean {
    // Validate the new state
    if (!isValidCapacity(newState)) {
      console.warn(`Invalid capacity state: ${String(newState)}. Keeping current state.`);
      return false;
    }

    // Track if this is actually a change
    if (newState === this.currentState) {
      return false;
    }

    const event: StateChangeEvent = {
      previousState: this.currentState,
      newState,
      timestamp: new Date(),
      reason,
      isDegradation: this.isDegradation(this.currentState, newState)
    };

    // Overwrite prior state
    this.currentState = newState;
    this.stateSetAt = event.timestamp;

    // Notify observers
    this.onStateChange?.(event);

    return true;
  }

  /**
   * Reset to the default foggy state.
   * Use when state is unknown or needs clearing.
   */
  reset(): void {
    this.setState(DEFAULT_CAPACITY, 'reset to default');
  }

  /**
   * Trigger graceful degradation to the fallback state.
   * Only degrades if current config allows auto-degradation.
   * 
   * @param trigger - What triggered the degradation
   * @returns true if degradation occurred
   */
  degrade(trigger: string): boolean {
    const config = this.getConfig();
    
    // Check if auto-degradation is allowed
    if (!config.fallback.canAutoDegrade) {
      return false;
    }

    // Check if already at fallback state
    if (this.currentState === config.fallback.fallbackState) {
      return false;
    }

    // Degrade to fallback
    return this.setState(
      config.fallback.fallbackState, 
      `degradation triggered: ${trigger}`
    );
  }

  /**
   * Check if a state transition would be a degradation.
   * Degradation means moving to a lower-capacity state.
   */
  private isDegradation(from: CapacityState, to: CapacityState): boolean {
    const capacityOrder: CapacityState[] = [
      'overstimulated',
      'anxious',
      'foggy',
      'flat',
      'driven',
      'productive'
    ];

    const fromIndex = capacityOrder.indexOf(from);
    const toIndex = capacityOrder.indexOf(to);

    // Moving to a lower index = degradation (less capacity)
    return toIndex < fromIndex;
  }

  /**
   * Check if the user should be prompted about degradation
   * based on known triggers for the current state.
   */
  checkDegradationTriggers(indicators: string[]): string[] {
    const config = this.getConfig();
    return indicators.filter(i => 
      config.fallback.degradeTriggers.includes(i.toLowerCase())
    );
  }
}
