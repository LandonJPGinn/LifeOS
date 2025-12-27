/**
 * Integration tests for LifeOS
 */

import { LifeOS, MockTaskManager, MockCalendar } from '../src/index';
import type { Task, CalendarEvent } from '../src/index';

describe('LifeOS Integration', () => {
  let lifeos: LifeOS;
  let taskManager: MockTaskManager;
  let workCalendar: MockCalendar;
  let personalCalendar: MockCalendar;

  beforeEach(() => {
    lifeos = new LifeOS();
    taskManager = new MockTaskManager();
    workCalendar = new MockCalendar('work');
    personalCalendar = new MockCalendar('personal');

    lifeos.addTaskManager(taskManager);
    lifeos.addCalendar(workCalendar);
    lifeos.addCalendar(personalCalendar);
  });

  describe('default behavior', () => {
    it('should default to foggy state', () => {
      expect(lifeos.getCapacity()).toBe('foggy');
    });

    it('should provide config for default state', () => {
      const config = lifeos.getConfig();
      expect(config.state).toBe('foggy');
      expect(config.description).toContain('Low clarity');
    });
  });

  describe('state management', () => {
    it('should change capacity state', () => {
      lifeos.setCapacity('driven');
      expect(lifeos.getCapacity()).toBe('driven');
    });

    it('should overwrite prior state', () => {
      lifeos.setCapacity('anxious');
      lifeos.setCapacity('flat');
      lifeos.setCapacity('driven');
      
      expect(lifeos.getCapacity()).toBe('driven');
    });

    it('should reset to foggy', () => {
      lifeos.setCapacity('driven');
      lifeos.resetCapacity();
      
      expect(lifeos.getCapacity()).toBe('foggy');
    });

    it('should support graceful degradation', () => {
      lifeos.setCapacity('driven');
      const degraded = lifeos.degradeGracefully('fatigue');
      
      expect(degraded).toBe(true);
      expect(lifeos.getCapacity()).toBe('flat');
    });

    it('should fire state change callback', () => {
      const events: unknown[] = [];
      const lifeos2 = new LifeOS({
        onStateChange: (event) => events.push(event)
      });

      lifeos2.setCapacity('anxious');

      expect(events).toHaveLength(1);
    });
  });

  describe('getDailyView', () => {
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(10, 0, 0, 0);

    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Essential task',
        priority: 'essential',
        domain: 'work',
        cognitiveLoad: 'minimal',
        estimatedMinutes: 30,
        visible: true,
        source: 'mock'
      },
      {
        id: '2',
        title: 'Optional task',
        priority: 'optional',
        domain: 'personal',
        cognitiveLoad: 'high',
        estimatedMinutes: 60,
        visible: true,
        source: 'mock'
      }
    ];

    const mockEvents: CalendarEvent[] = [
      {
        id: 'e1',
        title: 'Essential meeting',
        startTime: today,
        endTime: todayEnd,
        source: 'work',
        intent: 'essential',
        active: true,
        calendarProvider: 'mock'
      }
    ];

    beforeEach(() => {
      taskManager.setTasks(mockTasks);
      workCalendar.setEvents(mockEvents);
    });

    it('should generate daily view in foggy state', async () => {
      const view = await lifeos.getDailyView();

      expect(view.state).toBe('foggy');
      expect(view.tasks.visibleTasks).toHaveLength(1);
      expect(view.tasks.visibleTasks[0]?.title).toBe('Essential task');
      expect(view.calendar.activeEvents).toHaveLength(1);
    });

    it('should generate daily view in driven state', async () => {
      lifeos.setCapacity('driven');
      const view = await lifeos.getDailyView();

      expect(view.state).toBe('driven');
      expect(view.tasks.visibleTasks).toHaveLength(2);
      expect(view.calendar.activeEvents).toHaveLength(1);
    });

    it('should include energy budget', async () => {
      const view = await lifeos.getDailyView();
      
      expect(view.energyBudget).toBe(3); // foggy energy budget
    });

    it('should timestamp the view', async () => {
      const before = new Date();
      const view = await lifeos.getDailyView();
      const after = new Date();

      expect(view.generatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(view.generatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('integration management', () => {
    it('should track added task managers', () => {
      expect(lifeos.getTaskManagers()).toHaveLength(1);
    });

    it('should track added calendars', () => {
      expect(lifeos.getCalendars()).toHaveLength(2);
    });

    it('should only return connected integrations', () => {
      const disconnectedCalendar = new MockCalendar('personal');
      (disconnectedCalendar as unknown as { connected: boolean }).connected = false;
      
      lifeos.addCalendar(disconnectedCalendar);
      
      expect(lifeos.getCalendars()).toHaveLength(2); // Only the 2 connected ones
    });
  });

  describe('no backlog philosophy', () => {
    it('should not accumulate hidden tasks', async () => {
      // Set foggy - hides optional/high-load tasks
      lifeos.setCapacity('foggy');
      const foggyView = await lifeos.getDailyView();
      
      // Switch to driven - all tasks visible
      lifeos.setCapacity('driven');
      const drivenView = await lifeos.getDailyView();
      
      // No "backlog" or "queued" concept - just current visibility
      expect(foggyView).not.toHaveProperty('backlog');
      expect(drivenView).not.toHaveProperty('backlog');
    });
  });

  describe('no urgency philosophy', () => {
    it('should not have urgency-related fields', async () => {
      const view = await lifeos.getDailyView();
      
      expect(view).not.toHaveProperty('urgent');
      expect(view).not.toHaveProperty('overdue');
      expect(view).not.toHaveProperty('deadline');
    });
  });

  describe('no catch-up philosophy', () => {
    it('should not track yesterday or completion history', async () => {
      const view = await lifeos.getDailyView();
      
      expect(view).not.toHaveProperty('yesterday');
      expect(view).not.toHaveProperty('history');
      expect(view).not.toHaveProperty('streak');
      expect(view).not.toHaveProperty('completionRate');
    });
  });

  describe('state-specific behavior', () => {
    it('anxious: should have minimal task count', async () => {
      lifeos.setCapacity('anxious');
      const config = lifeos.getConfig();
      
      expect(config.taskVisibility.maxVisibleTasks).toBe(2);
      expect(config.calendarIntent.suggestCancellation).toBe(true);
    });

    it('flat: should allow gentle engagement', async () => {
      lifeos.setCapacity('flat');
      const config = lifeos.getConfig();
      
      expect(config.taskVisibility.maxVisibleTasks).toBe(4);
      expect(config.workload.showPersonalTasks).toBe(true);
    });

    it('overstimulated: should have maximum protection', async () => {
      lifeos.setCapacity('overstimulated');
      const config = lifeos.getConfig();
      
      expect(config.taskVisibility.maxVisibleTasks).toBe(1);
      expect(config.workload.showWorkTasks).toBe(false);
      expect(config.workload.showPersonalTasks).toBe(false);
      expect(config.calendarIntent.bufferMinutes).toBe(60);
    });

    it('driven: should have full capacity', async () => {
      lifeos.setCapacity('driven');
      const config = lifeos.getConfig();
      
      expect(config.taskVisibility.maxVisibleTasks).toBe(15);
      expect(config.workload.maxDailyMinutes).toBe(480);
      expect(config.workload.energyBudget).toBe(10);
    });
  });
});
