/**
 * LifeOS Asana Integration
 *
 * Mock implementation of Asana integration for LifeOS.
 */

import { BaseTaskManagerIntegration } from '../task-manager.js';
import type { Task } from '../../types/index.js';

export class AsanaIntegration extends BaseTaskManagerIntegration {
  readonly id = 'asana';
  readonly name = 'Asana';

  private mockTasks: Task[] = [
    {
      id: 'asana-1',
      title: 'Draft project proposal',
      priority: 'important',
      domain: 'work',
      cognitiveLoad: 'high',
      estimatedMinutes: 120,
      visible: true,
      source: 'asana',
    },
    {
      id: 'asana-2',
      title: 'Review marketing copy',
      priority: 'normal',
      domain: 'work',
      cognitiveLoad: 'medium',
      estimatedMinutes: 45,
      visible: true,
      source: 'asana',
    },
  ];

  async fetchTasks(): Promise<Task[]> {
    if (!this.isConnected()) {
      return [];
    }
    return this.mockTasks;
  }
}
