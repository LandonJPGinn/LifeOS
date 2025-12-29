/**
 * LifeOS Task Modulator
 * 
 * Modulates task visibility and workload based on capacity state.
 * No backlogs - tasks not visible are simply hidden, not queued.
 */

import type { Task, TaskVisibilityConfig, TaskPriority, CognitiveLoad } from '../types/index.js';
import type { StateConfig } from '../types/index.js';

/**
 * Result of task modulation
 */
export interface TaskModulationResult {
  /** Total number of tasks before modulation */
  totalTasks: number;
  /** Tasks that are visible given current state */
  visibleTasks: Task[];
  /** Tasks that were filtered out */
  hiddenTasks: Task[];
  /** Total estimated minutes of visible work */
  totalMinutes: number;
  /** Whether workload limit was reached */
  workloadLimitReached: boolean;
  /** Remaining capacity in minutes */
  remainingCapacity: number;
}

/**
 * Modulates task visibility based on capacity state configuration.
 * 
 * Philosophy:
 * - No backlogs: hidden tasks are not tracked or queued
 * - No urgency: tasks appear when capacity allows, disappear when not
 * - No catch-up: each day is fresh, no debt accumulation
 */
export class TaskModulator {
  /**
   * Filter and sort tasks based on state configuration.
   * 
   * @param tasks - All available tasks
   * @param config - Current state configuration
   * @returns Modulation result with visible/hidden tasks
   */
  modulate(tasks: Task[], config: StateConfig): TaskModulationResult {
    const { taskVisibility, workload } = config;
    
    // First pass: filter by visibility rules
    const eligibleTasks = tasks.filter(task => 
      this.isTaskEligible(task, taskVisibility, workload)
    );

    // Sort by priority (essential first)
    const sortedTasks = this.sortByPriority(eligibleTasks);

    // Apply visibility limit
    const visibleTasks: Task[] = [];
    let totalMinutes = 0;
    let workloadLimitReached = false;

    for (const task of sortedTasks) {
      // Check max visible tasks
      if (visibleTasks.length >= taskVisibility.maxVisibleTasks) {
        workloadLimitReached = true;
        break;
      }

      // Check workload limit
      const taskMinutes = task.estimatedMinutes ?? 15; // Default 15 min
      if (totalMinutes + taskMinutes > workload.maxDailyMinutes) {
        workloadLimitReached = true;
        break;
      }

      // Mark as visible and add
      visibleTasks.push({ ...task, visible: true });
      totalMinutes += taskMinutes;
    }

    // Everything else is hidden (not backlogged)
    const hiddenTasks = tasks
      .filter(t => !visibleTasks.some(v => v.id === t.id))
      .map(t => ({ ...t, visible: false }));

    return {
      totalTasks: tasks.length,
      visibleTasks,
      hiddenTasks,
      totalMinutes,
      workloadLimitReached,
      remainingCapacity: Math.max(0, workload.maxDailyMinutes - totalMinutes)
    };
  }

  /**
   * Check if a task is eligible based on visibility and workload rules.
   */
  private isTaskEligible(
    task: Task, 
    visibility: TaskVisibilityConfig,
    workload: StateConfig['workload']
  ): boolean {
    // Check domain visibility
    if (task.domain === 'work' && !workload.showWorkTasks) return false;
    if (task.domain === 'personal' && !workload.showPersonalTasks) return false;

    // Check priority visibility
    if (!visibility.visiblePriorities.includes(task.priority)) return false;

    // Check cognitive load manageability
    if (!visibility.manageableLoads.includes(task.cognitiveLoad)) return false;

    return true;
  }

  /**
   * Sort tasks by priority (essential > important > normal > optional)
   */
  private sortByPriority(tasks: Task[]): Task[] {
    const priorityOrder: Record<TaskPriority, number> = {
      essential: 0,
      important: 1,
      normal: 2,
      optional: 3
    };

    return [...tasks].sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  /**
   * Get cognitive load weight for capacity calculations
   */
  getCognitiveLoadWeight(load: CognitiveLoad): number {
    const weights: Record<CognitiveLoad, number> = {
      minimal: 1,
      low: 2,
      medium: 4,
      high: 8
    };
    return weights[load];
  }
}
