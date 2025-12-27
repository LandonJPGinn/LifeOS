/**
 * Tests for LifeOS Task Modulator
 */

import { TaskModulator } from '../src/modulation/task-modulator';
import { DEFAULT_STATE_CONFIGS } from '../src/state/config';
import type { Task, StateConfig } from '../src/index';

// Helper to create test tasks
function createTask(overrides: Partial<Task>): Task {
  return {
    id: 'task-1',
    title: 'Test Task',
    priority: 'normal',
    domain: 'work',
    cognitiveLoad: 'medium',
    estimatedMinutes: 30,
    visible: true,
    source: 'test',
    ...overrides
  };
}

describe('TaskModulator', () => {
  let modulator: TaskModulator;

  beforeEach(() => {
    modulator = new TaskModulator();
  });

  describe('modulate with foggy state', () => {
    const foggyConfig = DEFAULT_STATE_CONFIGS.foggy;

    it('should only show essential tasks', () => {
      const tasks = [
        createTask({ id: '1', priority: 'essential', cognitiveLoad: 'minimal' }),
        createTask({ id: '2', priority: 'important', cognitiveLoad: 'low' }),
        createTask({ id: '3', priority: 'normal', cognitiveLoad: 'medium' }),
        createTask({ id: '4', priority: 'optional', cognitiveLoad: 'high' }),
      ];

      const result = modulator.modulate(tasks, foggyConfig);

      expect(result.visibleTasks).toHaveLength(1);
      expect(result.visibleTasks[0]?.priority).toBe('essential');
    });

    it('should filter by cognitive load (minimal and low only)', () => {
      const tasks = [
        createTask({ id: '1', priority: 'essential', cognitiveLoad: 'minimal' }),
        createTask({ id: '2', priority: 'essential', cognitiveLoad: 'medium' }),
        createTask({ id: '3', priority: 'essential', cognitiveLoad: 'high' }),
      ];

      const result = modulator.modulate(tasks, foggyConfig);

      expect(result.visibleTasks).toHaveLength(1);
      expect(result.visibleTasks[0]?.cognitiveLoad).toBe('minimal');
    });

    it('should respect maxVisibleTasks limit (3)', () => {
      const tasks = [
        createTask({ id: '1', priority: 'essential', cognitiveLoad: 'low', estimatedMinutes: 10 }),
        createTask({ id: '2', priority: 'essential', cognitiveLoad: 'low', estimatedMinutes: 10 }),
        createTask({ id: '3', priority: 'essential', cognitiveLoad: 'minimal', estimatedMinutes: 10 }),
        createTask({ id: '4', priority: 'essential', cognitiveLoad: 'minimal', estimatedMinutes: 10 }),
      ];

      const result = modulator.modulate(tasks, foggyConfig);

      expect(result.visibleTasks.length).toBeLessThanOrEqual(3);
      expect(result.workloadLimitReached).toBe(true);
    });

    it('should not show personal tasks when showPersonalTasks is false', () => {
      const tasks = [
        createTask({ id: '1', priority: 'essential', cognitiveLoad: 'minimal', domain: 'personal' }),
      ];

      const result = modulator.modulate(tasks, foggyConfig);

      expect(result.visibleTasks).toHaveLength(0);
    });
  });

  describe('modulate with driven state', () => {
    const drivenConfig = DEFAULT_STATE_CONFIGS.driven;

    it('should show all priority levels', () => {
      const tasks = [
        createTask({ id: '1', priority: 'essential', cognitiveLoad: 'minimal', estimatedMinutes: 30 }),
        createTask({ id: '2', priority: 'important', cognitiveLoad: 'low', estimatedMinutes: 30 }),
        createTask({ id: '3', priority: 'normal', cognitiveLoad: 'medium', estimatedMinutes: 30 }),
        createTask({ id: '4', priority: 'optional', cognitiveLoad: 'high', estimatedMinutes: 30 }),
      ];

      const result = modulator.modulate(tasks, drivenConfig);

      expect(result.visibleTasks).toHaveLength(4);
    });

    it('should handle all cognitive load levels', () => {
      const tasks = [
        createTask({ id: '1', cognitiveLoad: 'minimal', estimatedMinutes: 30 }),
        createTask({ id: '2', cognitiveLoad: 'low', estimatedMinutes: 30 }),
        createTask({ id: '3', cognitiveLoad: 'medium', estimatedMinutes: 30 }),
        createTask({ id: '4', cognitiveLoad: 'high', estimatedMinutes: 30 }),
      ];

      const result = modulator.modulate(tasks, drivenConfig);

      expect(result.visibleTasks).toHaveLength(4);
    });

    it('should show both work and personal tasks', () => {
      const tasks = [
        createTask({ id: '1', domain: 'work', estimatedMinutes: 60 }),
        createTask({ id: '2', domain: 'personal', estimatedMinutes: 60 }),
      ];

      const result = modulator.modulate(tasks, drivenConfig);

      expect(result.visibleTasks).toHaveLength(2);
    });
  });

  describe('modulate with overstimulated state', () => {
    const overstimConfig = DEFAULT_STATE_CONFIGS.overstimulated;

    it('should hide all tasks when both domains disabled', () => {
      const tasks = [
        createTask({ id: '1', priority: 'essential', cognitiveLoad: 'minimal', estimatedMinutes: 10 }),
        createTask({ id: '2', priority: 'essential', cognitiveLoad: 'minimal', estimatedMinutes: 10 }),
      ];

      const result = modulator.modulate(tasks, overstimConfig);

      // In overstimulated, both work and personal domains are hidden
      expect(result.visibleTasks).toHaveLength(0);
      expect(result.hiddenTasks).toHaveLength(2);
    });

    it('should hide both work and personal domains', () => {
      const tasks = [
        createTask({ id: '1', priority: 'essential', cognitiveLoad: 'minimal', domain: 'work' }),
        createTask({ id: '2', priority: 'essential', cognitiveLoad: 'minimal', domain: 'personal' }),
      ];

      const result = modulator.modulate(tasks, overstimConfig);

      // Both domains are hidden in overstimulated
      expect(result.visibleTasks).toHaveLength(0);
    });

    it('should respect maxVisibleTasks limit of 1 when tasks are eligible', () => {
      // Create a custom config that allows work tasks but limits to 1
      const customConfig = {
        ...overstimConfig,
        workload: {
          ...overstimConfig.workload,
          showWorkTasks: true,
        }
      };
      
      const tasks = [
        createTask({ id: '1', priority: 'essential', cognitiveLoad: 'minimal', estimatedMinutes: 10 }),
        createTask({ id: '2', priority: 'essential', cognitiveLoad: 'minimal', estimatedMinutes: 10 }),
      ];

      const result = modulator.modulate(tasks, customConfig);

      expect(result.visibleTasks).toHaveLength(1);
    });
  });

  describe('workload tracking', () => {
    it('should track total minutes of visible work', () => {
      const tasks = [
        createTask({ id: '1', priority: 'essential', cognitiveLoad: 'low', estimatedMinutes: 30 }),
        createTask({ id: '2', priority: 'essential', cognitiveLoad: 'low', estimatedMinutes: 45 }),
      ];

      const result = modulator.modulate(tasks, DEFAULT_STATE_CONFIGS.flat);

      expect(result.totalMinutes).toBe(75);
    });

    it('should calculate remaining capacity', () => {
      const tasks = [
        createTask({ id: '1', priority: 'essential', cognitiveLoad: 'low', estimatedMinutes: 30 }),
      ];

      const result = modulator.modulate(tasks, DEFAULT_STATE_CONFIGS.flat);

      expect(result.remainingCapacity).toBe(90 - 30); // flat allows 90 minutes
    });

    it('should default to 15 minutes for tasks without estimate', () => {
      const tasks = [
        createTask({ id: '1', priority: 'essential', cognitiveLoad: 'low', estimatedMinutes: undefined }),
      ];

      const result = modulator.modulate(tasks, DEFAULT_STATE_CONFIGS.flat);

      expect(result.totalMinutes).toBe(15);
    });
  });

  describe('no backlog behavior', () => {
    it('should mark hidden tasks as not visible', () => {
      const tasks = [
        createTask({ id: '1', priority: 'essential', cognitiveLoad: 'minimal' }),
        createTask({ id: '2', priority: 'optional', cognitiveLoad: 'high' }),
      ];

      const result = modulator.modulate(tasks, DEFAULT_STATE_CONFIGS.foggy);

      expect(result.hiddenTasks.every(t => t.visible === false)).toBe(true);
    });

    it('should not track or queue hidden tasks', () => {
      // Hidden tasks are simply hidden - no queue, no backlog
      const tasks = [
        createTask({ id: '1', priority: 'optional', cognitiveLoad: 'high' }),
      ];

      const result = modulator.modulate(tasks, DEFAULT_STATE_CONFIGS.foggy);

      expect(result.visibleTasks).toHaveLength(0);
      expect(result.hiddenTasks).toHaveLength(1);
      // No "queue" or "backlog" fields - they don't exist by design
    });
  });

  describe('task sorting', () => {
    it('should sort essential tasks first', () => {
      const tasks = [
        createTask({ id: '1', priority: 'normal', cognitiveLoad: 'low', estimatedMinutes: 10 }),
        createTask({ id: '2', priority: 'essential', cognitiveLoad: 'low', estimatedMinutes: 10 }),
        createTask({ id: '3', priority: 'important', cognitiveLoad: 'low', estimatedMinutes: 10 }),
      ];

      const result = modulator.modulate(tasks, DEFAULT_STATE_CONFIGS.driven);

      expect(result.visibleTasks[0]?.priority).toBe('essential');
      expect(result.visibleTasks[1]?.priority).toBe('important');
      expect(result.visibleTasks[2]?.priority).toBe('normal');
    });
  });
});
