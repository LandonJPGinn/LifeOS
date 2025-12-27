/**
 * LifeOS Task Manager Integration Interface
 * 
 * Abstract interface for integrating with external task managers.
 * Implementations should connect to services like Todoist, Notion, etc.
 */

import type { Task, TaskDomain } from '../types/index.js';

/**
 * Interface for task manager integrations.
 * Implementations should handle authentication and API communication.
 */
export interface TaskManagerIntegration {
  /** Unique identifier for this integration */
  readonly id: string;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Whether the integration is currently connected */
  isConnected(): boolean;
  
  /**
   * Fetch tasks from the external service.
   * Should transform external task format to LifeOS Task type.
   */
  fetchTasks(): Promise<Task[]>;
  
  /**
   * Fetch tasks for a specific domain only.
   */
  fetchTasksByDomain(domain: TaskDomain): Promise<Task[]>;
}

/**
 * Base class for task manager integrations with common functionality.
 */
export abstract class BaseTaskManagerIntegration implements TaskManagerIntegration {
  abstract readonly id: string;
  abstract readonly name: string;
  
  protected connected = false;
  
  isConnected(): boolean {
    return this.connected;
  }
  
  abstract fetchTasks(): Promise<Task[]>;
  
  async fetchTasksByDomain(domain: TaskDomain): Promise<Task[]> {
    const allTasks = await this.fetchTasks();
    return allTasks.filter(task => task.domain === domain);
  }
  
  /**
   * Mark the integration as connected.
   * Called after successful authentication.
   */
  protected setConnected(connected: boolean): void {
    this.connected = connected;
  }
}

/**
 * Mock task manager for testing and development.
 */
export class MockTaskManager extends BaseTaskManagerIntegration {
  readonly id = 'mock';
  readonly name = 'Mock Task Manager';
  
  private mockTasks: Task[] = [];
  
  constructor() {
    super();
    this.connected = true;
  }
  
  /**
   * Set mock tasks for testing.
   */
  setTasks(tasks: Task[]): void {
    this.mockTasks = tasks;
  }
  
  async fetchTasks(): Promise<Task[]> {
    return [...this.mockTasks];
  }
}
