/**
 * LifeOS Task Types
 * 
 * Defines task interfaces for integration with external task managers.
 * No backlogs, no urgency - just visibility and workload modulation.
 */

/**
 * Task priority levels - used for visibility filtering
 */
export type TaskPriority = 'essential' | 'important' | 'normal' | 'optional';

/**
 * Task domain - distinguishes work from personal
 */
export type TaskDomain = 'work' | 'personal';

/**
 * Task cognitive load - how demanding the task is
 */
export type CognitiveLoad = 'minimal' | 'low' | 'medium' | 'high';

/**
 * A task from an external task manager
 */
export interface Task {
  /** Unique identifier from the source system */
  id: string;
  /** Task title */
  title: string;
  /** Task description */
  description?: string;
  /** Task priority level */
  priority: TaskPriority;
  /** Work or personal domain */
  domain: TaskDomain;
  /** Cognitive demand of the task */
  cognitiveLoad: CognitiveLoad;
  /** Estimated duration in minutes */
  estimatedMinutes?: number;
  /** Whether task is currently visible based on state */
  visible: boolean;
  /** Source system identifier (e.g., 'todoist', 'notion') */
  source: string;
}

/**
 * Task visibility configuration per capacity state
 */
export interface TaskVisibilityConfig {
  /** Which priority levels are visible */
  visiblePriorities: TaskPriority[];
  /** Which cognitive loads are manageable */
  manageableLoads: CognitiveLoad[];
  /** Maximum number of tasks to show */
  maxVisibleTasks: number;
}
