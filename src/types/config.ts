/**
 * LifeOS Configuration Types
 * 
 * System-owned daily expectations per capacity state.
 * No streaks, reminders, or catch-up logic.
 */

import type { CapacityState } from './capacity.js';
import type { TaskVisibilityConfig } from './task.js';
import type { CalendarIntentConfig } from './calendar.js';

/**
 * Workload configuration per capacity state
 */
export interface WorkloadConfig {
  /** Maximum total minutes of tasks for the day */
  maxDailyMinutes: number;
  /** Maximum calendar hours to maintain */
  maxCalendarHours: number;
  /** Whether to show work domain tasks */
  showWorkTasks: boolean;
  /** Whether to show personal domain tasks */
  showPersonalTasks: boolean;
  /** Energy budget (1-10 scale) */
  energyBudget: number;
}

/**
 * Fallback configuration for graceful degradation
 */
export interface FallbackConfig {
  /** State to fallback to if current state becomes unmanageable */
  fallbackState: CapacityState;
  /** Whether this state can auto-degrade to fallback */
  canAutoDegade: boolean;
  /** Threshold indicators that trigger degradation */
  degradeTriggers: string[];
}

/**
 * Complete configuration for a single capacity state
 */
export interface StateConfig {
  /** The capacity state this config applies to */
  state: CapacityState;
  /** Human-readable description of this state */
  description: string;
  /** Task visibility settings */
  taskVisibility: TaskVisibilityConfig;
  /** Calendar intent settings */
  calendarIntent: CalendarIntentConfig;
  /** Workload limits */
  workload: WorkloadConfig;
  /** Fallback settings for graceful degradation */
  fallback: FallbackConfig;
}

/**
 * The complete state configuration map
 */
export type StateConfigMap = Record<CapacityState, StateConfig>;
