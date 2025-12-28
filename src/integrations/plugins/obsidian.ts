/**
 * LifeOS Obsidian Integration
 *
 * Mock implementation of Obsidian integration for LifeOS.
 */

import { BaseTaskManagerIntegration } from '../task-manager.js';
import type { Task } from '../../types/index.js';

export class ObsidianIntegration extends BaseTaskManagerIntegration {
  readonly id = 'obsidian';
  readonly name = 'Obsidian';

  private mockTasks: Task[] = [
    {
      id: 'obsidian-1',
      title: 'Finish research on topic X',
      priority: 'important',
      domain: 'personal',
      cognitiveLoad: 'high',
      estimatedMinutes: 90,
      visible: true,
      source: 'obsidian',
    },
    {
      id: 'obsidian-2',
      title: 'Outline blog post',
      priority: 'normal',
      domain: 'personal',
      cognitiveLoad: 'medium',
      estimatedMinutes: 30,
      visible: true,
      source: 'obsidian',
    },
  ];

  async fetchTasks(): Promise<Task[]> {
    if (!this.isConnected()) {
      return [];
    }
    return this.mockTasks;
  }
}
