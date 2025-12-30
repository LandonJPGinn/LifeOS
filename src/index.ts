/**
 * LifeOS - State-Driven Productivity System
 * 
 * Core orchestrator that integrates state management with task and calendar modulation.
 * 
 * Design Philosophy:
 * - User only declares current capacity (foggy, anxious, flat, overstimulated, driven)
 * - System owns daily expectations: modulates task visibility, workload, and calendar intent
 * - No backlogs, no urgency, no streaks, no reminders, no catch-up logic
 * - Default to foggy when no state is set
 * - State changes overwrite prior state
 * - Graceful degradation under emotional variability
 */

import type { Task, CalendarEvent, CapacityState, StateConfig } from './types/index.js';
import { DEFAULT_CAPACITY } from './types/index.js';
import { StateManager, type StateChangeEvent } from './state/index.js';
import { TaskModulator, type TaskModulationResult } from './modulation/task-modulator.js';
import { CalendarModulator, type CalendarModulationResult } from './modulation/calendar-modulator.js';
import type { TaskManagerIntegration } from './integrations/task-manager.js';
import type { CalendarIntegration } from './integrations/calendar.js';

/**
 * Daily view combining task and calendar modulation results
 */
export interface DailyView {
  /** Current capacity state */
  state: CapacityState;
  /** Configuration for current state */
  config: StateConfig;
  /** Task modulation results */
  tasks: TaskModulationResult;
  /** Calendar modulation results */
  calendar: CalendarModulationResult;
  /** When this view was generated */
  generatedAt: Date;
  /** Energy budget remaining (0-10) */
  energyBudget: number;
}

/**
 * LifeOS configuration options
 */
export interface LifeOSOptions {
  /** Initial capacity state */
  initialState?: CapacityState;
  /** Callback when state changes */
  onStateChange?: (event: StateChangeEvent) => void;
}

/**
 * Main LifeOS orchestrator.
 * 
 * Usage:
 * ```ts
 * const lifeos = new LifeOS();
 * lifeos.addTaskManager(myTaskManager);
 * lifeos.addCalendar(myWorkCalendar);
 * lifeos.addCalendar(myPersonalCalendar);
 * 
 * // User declares their capacity
 * lifeos.setCapacity('anxious');
 * 
 * // System provides modulated daily view
 * const today = await lifeos.getDailyView();
 * ```
 */
export class LifeOS {
  private stateManager: StateManager;
  private taskModulator: TaskModulator;
  private calendarModulator: CalendarModulator;
  private taskManagers: TaskManagerIntegration[] = [];
  private calendars: CalendarIntegration[] = [];

  constructor(options: LifeOSOptions = {}) {
    this.stateManager = new StateManager({
      initialState: options.initialState,
      onStateChange: options.onStateChange
    });
    this.taskModulator = new TaskModulator();
    this.calendarModulator = new CalendarModulator();
  }

  // === State Management ===

  /**
   * Get current capacity state.
   */
  getCapacity(): CapacityState {
    return this.stateManager.getState();
  }

  /**
   * Set user's current capacity.
   * Overwrites any prior state - no history maintained.
   * 
   * @param capacity - The new capacity state
   * @param reason - Optional reason for the change
   */
  setCapacity(capacity: CapacityState, reason?: string): void {
    this.stateManager.setState(capacity, reason);
  }

  /**
   * Reset to default foggy state.
   */
  resetCapacity(): void {
    this.stateManager.reset();
  }

  /**
   * Trigger graceful degradation if supported by current state.
   * Returns true if degradation occurred.
   */
  degradeGracefully(trigger: string): boolean {
    return this.stateManager.degrade(trigger);
  }

  /**
   * Get the current state configuration.
   */
  getConfig(): StateConfig {
    return this.stateManager.getConfig();
  }

  // === Integration Management ===

  /**
   * Add a task manager integration.
   */
  addTaskManager(manager: TaskManagerIntegration): void {
    this.taskManagers.push(manager);
  }

  /**
   * Add a calendar integration.
   */
  addCalendar(calendar: CalendarIntegration): void {
    this.calendars.push(calendar);
  }

  /**
   * Get all connected task managers.
   */
  getTaskManagers(): TaskManagerIntegration[] {
    return this.taskManagers.filter(m => m.isConnected());
  }

  /**
   * Get all connected calendars.
   */
  getCalendars(): CalendarIntegration[] {
    return this.calendars.filter(c => c.isConnected());
  }

  // === Daily View Generation ===

  /**
   * Generate the daily view based on current capacity state.
   * This is the main interface for users to see their modulated day.
   * 
   * No backlogs: hidden tasks disappear, not queued
   * No urgency: workload is what's manageable, nothing more
   * No catch-up: yesterday's hidden tasks are not today's burden
   */
  async getDailyView(): Promise<DailyView> {
    const state = this.stateManager.getState();
    const config = this.stateManager.getConfig();

    // Fetch all tasks from connected managers
    const allTasks = await this.fetchAllTasks();
    
    // Fetch today's events from connected calendars
    const allEvents = await this.fetchTodayEvents();

    // Modulate based on current state
    const taskResult = this.taskModulator.modulate(allTasks, config);
    const calendarResult = this.calendarModulator.modulate(allEvents, config);

    return {
      state,
      config,
      tasks: taskResult,
      calendar: calendarResult,
      generatedAt: new Date(),
      energyBudget: config.workload.energyBudget
    };
  }

  /**
   * Get the total number of tasks and events before modulation.
   */
  async getUnmodulatedLoad(): Promise<{ taskCount: number; eventCount: number }> {
    const allTasks = await this.fetchAllTasks();
    const allEvents = await this.fetchTodayEvents();
    return {
      taskCount: allTasks.length,
      eventCount: allEvents.length,
    };
  }

  /**
   * Get a formatted timestamp for the daily view.
   */
  getFormattedTimestamp(date: Date): string {
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  /**
   * Fetch tasks from all connected task managers.
   */
  private async fetchAllTasks(): Promise<Task[]> {
    const results = await Promise.all(
      this.taskManagers
        .filter(m => m.isConnected())
        .map(m => m.fetchTasks())
    );
    return results.flat();
  }

  /**
   * Fetch today's events from all connected calendars.
   */
  private async fetchTodayEvents(): Promise<CalendarEvent[]> {
    const results = await Promise.all(
      this.calendars
        .filter(c => c.isConnected())
        .map(c => c.fetchTodayEvents())
    );
    return results.flat();
  }
}

// Re-export everything for convenient imports
export * from './types/index.js';
export * from './state/index.js';
export * from './modulation/index.js';
export * from './integrations/index.js';
