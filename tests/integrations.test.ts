/**
 * Tests for LifeOS Integrations
 */

import { AsanaIntegration } from '../src/integrations/plugins/asana.js';
import { GoogleCalendarIntegration } from '../src/integrations/plugins/google-calendar.js';
import { ObsidianIntegration } from '../src/integrations/plugins/obsidian.js';

describe('Integrations', () => {
  describe('AsanaIntegration', () => {
    it('should fetch tasks when connected', async () => {
      const asana = new AsanaIntegration();
      await asana.connect();
      const tasks = await asana.fetchTasks();
      expect(tasks.length).toBeGreaterThan(0);
    });

    it('should not fetch tasks when disconnected', async () => {
      const asana = new AsanaIntegration();
      await asana.disconnect();
      const tasks = await asana.fetchTasks();
      expect(tasks.length).toBe(0);
    });
  });

  describe('GoogleCalendarIntegration', () => {
    it('should fetch events when connected', async () => {
      const gcal = new GoogleCalendarIntegration();
      await gcal.connect();
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const events = await gcal.fetchEvents({ start, end });
      expect(events.length).toBeGreaterThan(0);
    });

    it('should not fetch events when disconnected', async () => {
      const gcal = new GoogleCalendarIntegration();
      await gcal.disconnect();
      const events = await gcal.fetchEvents({
        start: new Date('2024-01-15T00:00:00'),
        end: new Date('2024-01-15T23:59:59'),
      });
      expect(events.length).toBe(0);
    });
  });

  describe('ObsidianIntegration', () => {
    it('should fetch tasks when connected', async () => {
      const obsidian = new ObsidianIntegration();
      await obsidian.connect();
      const tasks = await obsidian.fetchTasks();
      expect(tasks.length).toBeGreaterThan(0);
    });

    it('should not fetch tasks when disconnected', async () => {
      const obsidian = new ObsidianIntegration();
      await obsidian.disconnect();
      const tasks = await obsidian.fetchTasks();
      expect(tasks.length).toBe(0);
    });
  });
});
