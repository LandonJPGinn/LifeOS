/**
 * Tests for LifeOS Calendar Modulator
 */

import { CalendarModulator } from '../src/modulation/calendar-modulator';
import { DEFAULT_STATE_CONFIGS } from '../src/state/config';
import type { CalendarEvent, StateConfig } from '../src/index';

// Helper to create test events
function createEvent(overrides: Partial<CalendarEvent>): CalendarEvent {
  const baseStart = new Date('2024-01-15T09:00:00');
  const baseEnd = new Date('2024-01-15T10:00:00');
  
  return {
    id: 'event-1',
    title: 'Test Event',
    startTime: baseStart,
    endTime: baseEnd,
    source: 'work',
    intent: 'collaborative',
    active: true,
    calendarProvider: 'test',
    ...overrides
  };
}

describe('CalendarModulator', () => {
  let modulator: CalendarModulator;

  beforeEach(() => {
    modulator = new CalendarModulator();
  });

  describe('modulate with foggy state', () => {
    const foggyConfig = DEFAULT_STATE_CONFIGS.foggy;

    it('should only honor essential and recovery intents', () => {
      const events = [
        createEvent({ id: '1', intent: 'essential', startTime: new Date('2024-01-15T09:00:00'), endTime: new Date('2024-01-15T10:00:00') }),
        createEvent({ id: '2', intent: 'recovery', startTime: new Date('2024-01-15T11:00:00'), endTime: new Date('2024-01-15T12:00:00') }),
        createEvent({ id: '3', intent: 'collaborative', startTime: new Date('2024-01-15T13:00:00'), endTime: new Date('2024-01-15T14:00:00') }),
        createEvent({ id: '4', intent: 'focus', startTime: new Date('2024-01-15T15:00:00'), endTime: new Date('2024-01-15T16:00:00') }),
      ];

      const result = modulator.modulate(events, foggyConfig);

      expect(result.activeEvents).toHaveLength(2);
      expect(result.activeEvents.map(e => e.intent)).toContain('essential');
      expect(result.activeEvents.map(e => e.intent)).toContain('recovery');
    });

    it('should suggest cancellation for non-honored intents', () => {
      const events = [
        createEvent({ id: '1', intent: 'collaborative' }),
      ];

      const result = modulator.modulate(events, foggyConfig);

      expect(result.suggestedCancellations).toHaveLength(1);
      expect(result.suggestedCancellations[0]?.id).toBe('1');
    });

    it('should add 30-minute recovery buffers', () => {
      const events = [
        createEvent({ 
          id: '1', 
          intent: 'essential',
          startTime: new Date('2024-01-15T09:00:00'), 
          endTime: new Date('2024-01-15T10:00:00') 
        }),
        createEvent({ 
          id: '2', 
          intent: 'essential',
          startTime: new Date('2024-01-15T11:00:00'), 
          endTime: new Date('2024-01-15T12:00:00') 
        }),
      ];

      const result = modulator.modulate(events, foggyConfig);

      // Should have a recovery buffer after first event
      expect(result.recoveryBuffers).toHaveLength(1);
      expect(result.recoveryBuffers[0]?.durationMinutes).toBe(30);
    });
  });

  describe('modulate with driven state', () => {
    const drivenConfig = DEFAULT_STATE_CONFIGS.driven;

    it('should honor all intent types', () => {
      const events = [
        createEvent({ id: '1', intent: 'essential', startTime: new Date('2024-01-15T08:00:00'), endTime: new Date('2024-01-15T09:00:00') }),
        createEvent({ id: '2', intent: 'focus', startTime: new Date('2024-01-15T09:00:00'), endTime: new Date('2024-01-15T10:00:00') }),
        createEvent({ id: '3', intent: 'collaborative', startTime: new Date('2024-01-15T10:00:00'), endTime: new Date('2024-01-15T11:00:00') }),
        createEvent({ id: '4', intent: 'recovery', startTime: new Date('2024-01-15T11:00:00'), endTime: new Date('2024-01-15T12:00:00') }),
        createEvent({ id: '5', intent: 'transition', startTime: new Date('2024-01-15T12:00:00'), endTime: new Date('2024-01-15T12:30:00') }),
        createEvent({ id: '6', intent: 'flexible', startTime: new Date('2024-01-15T12:30:00'), endTime: new Date('2024-01-15T13:00:00') }),
      ];

      const result = modulator.modulate(events, drivenConfig);

      expect(result.activeEvents).toHaveLength(6);
      expect(result.suggestedCancellations).toHaveLength(0);
    });

    it('should not add recovery buffers', () => {
      const events = [
        createEvent({ 
          id: '1', 
          intent: 'focus',
          startTime: new Date('2024-01-15T09:00:00'), 
          endTime: new Date('2024-01-15T10:00:00') 
        }),
        createEvent({ 
          id: '2', 
          intent: 'collaborative',
          startTime: new Date('2024-01-15T11:00:00'), 
          endTime: new Date('2024-01-15T12:00:00') 
        }),
      ];

      const result = modulator.modulate(events, drivenConfig);

      expect(result.recoveryBuffers).toHaveLength(0);
    });

    it('should not suggest cancellations', () => {
      const events = [
        createEvent({ id: '1', intent: 'flexible' }),
      ];

      const result = modulator.modulate(events, drivenConfig);

      expect(result.suggestedCancellations).toHaveLength(0);
    });
  });

  describe('modulate with overstimulated state', () => {
    const overstimConfig = DEFAULT_STATE_CONFIGS.overstimulated;

    it('should only honor essential and recovery', () => {
      const events = [
        createEvent({ id: '1', intent: 'essential', startTime: new Date('2024-01-15T09:00:00'), endTime: new Date('2024-01-15T09:30:00') }),
        createEvent({ id: '2', intent: 'recovery', startTime: new Date('2024-01-15T10:30:00'), endTime: new Date('2024-01-15T11:00:00') }),
        createEvent({ id: '3', intent: 'focus', startTime: new Date('2024-01-15T11:00:00'), endTime: new Date('2024-01-15T12:00:00') }),
      ];

      const result = modulator.modulate(events, overstimConfig);

      expect(result.activeEvents).toHaveLength(2);
      expect(result.suggestedCancellations).toHaveLength(1);
    });

    it('should add 60-minute recovery buffers', () => {
      const events = [
        createEvent({ 
          id: '1', 
          intent: 'essential',
          startTime: new Date('2024-01-15T09:00:00'), 
          endTime: new Date('2024-01-15T09:30:00') 
        }),
        createEvent({ 
          id: '2', 
          intent: 'essential',
          startTime: new Date('2024-01-15T11:00:00'), 
          endTime: new Date('2024-01-15T11:30:00') 
        }),
      ];

      const result = modulator.modulate(events, overstimConfig);

      expect(result.recoveryBuffers.length).toBeGreaterThanOrEqual(1);
      // Full 60-minute buffer when there's room
      expect(result.recoveryBuffers[0]?.durationMinutes).toBe(60);
    });
  });

  describe('calendar hour limits', () => {
    it('should respect maxCalendarHours limit', () => {
      // Foggy allows 2 hours max
      const events = [
        createEvent({ 
          id: '1', 
          intent: 'essential',
          startTime: new Date('2024-01-15T09:00:00'), 
          endTime: new Date('2024-01-15T10:00:00') // 1 hour
        }),
        createEvent({ 
          id: '2', 
          intent: 'essential',
          startTime: new Date('2024-01-15T10:00:00'), 
          endTime: new Date('2024-01-15T11:00:00') // 1 hour
        }),
        createEvent({ 
          id: '3', 
          intent: 'essential',
          startTime: new Date('2024-01-15T11:00:00'), 
          endTime: new Date('2024-01-15T12:00:00') // 1 more hour (over limit)
        }),
      ];

      const result = modulator.modulate(events, DEFAULT_STATE_CONFIGS.foggy);

      // Essential events are always included even over limit
      expect(result.activeEvents).toHaveLength(3);
      expect(result.calendarLimitExceeded).toBe(true);
    });

    it('should move non-essential over-limit to suggestions', () => {
      // Anxious allows 1 hour max
      const events = [
        createEvent({ 
          id: '1', 
          intent: 'essential',
          startTime: new Date('2024-01-15T09:00:00'), 
          endTime: new Date('2024-01-15T10:00:00') // 1 hour (at limit)
        }),
        createEvent({ 
          id: '2', 
          intent: 'recovery', // honored but not essential
          startTime: new Date('2024-01-15T11:00:00'), 
          endTime: new Date('2024-01-15T12:00:00') // over limit
        }),
      ];

      const result = modulator.modulate(events, DEFAULT_STATE_CONFIGS.anxious);

      expect(result.activeEvents).toHaveLength(1);
      expect(result.suggestedCancellations).toHaveLength(1);
    });
  });

  describe('essential events always honored', () => {
    it('should always include essential events regardless of limit', () => {
      const events = [
        createEvent({ 
          id: '1', 
          intent: 'essential',
          startTime: new Date('2024-01-15T09:00:00'), 
          endTime: new Date('2024-01-15T17:00:00') // 8 hours
        }),
      ];

      // Overstimulated only allows 1 hour
      const result = modulator.modulate(events, DEFAULT_STATE_CONFIGS.overstimulated);

      expect(result.activeEvents).toHaveLength(1);
      expect(result.calendarLimitExceeded).toBe(true);
    });
  });

  describe('recovery buffer generation', () => {
    it('should use partial buffer when gap is smaller than configured', () => {
      const events = [
        createEvent({ 
          id: '1', 
          intent: 'essential',
          startTime: new Date('2024-01-15T09:00:00'), 
          endTime: new Date('2024-01-15T10:00:00')
        }),
        createEvent({ 
          id: '2', 
          intent: 'essential',
          startTime: new Date('2024-01-15T10:15:00'), // Only 15 min gap
          endTime: new Date('2024-01-15T11:00:00')
        }),
      ];

      const result = modulator.modulate(events, DEFAULT_STATE_CONFIGS.foggy);

      // Should get a partial 15-minute buffer
      expect(result.recoveryBuffers).toHaveLength(1);
      expect(result.recoveryBuffers[0]?.durationMinutes).toBe(15);
    });

    it('should not create buffer for back-to-back events', () => {
      const events = [
        createEvent({ 
          id: '1', 
          intent: 'essential',
          startTime: new Date('2024-01-15T09:00:00'), 
          endTime: new Date('2024-01-15T10:00:00')
        }),
        createEvent({ 
          id: '2', 
          intent: 'essential',
          startTime: new Date('2024-01-15T10:00:00'), // No gap
          endTime: new Date('2024-01-15T11:00:00')
        }),
      ];

      const result = modulator.modulate(events, DEFAULT_STATE_CONFIGS.foggy);

      expect(result.recoveryBuffers).toHaveLength(0);
    });
  });

  describe('event sorting', () => {
    it('should process events in chronological order', () => {
      const events = [
        createEvent({ 
          id: '2', 
          intent: 'essential',
          startTime: new Date('2024-01-15T11:00:00'), 
          endTime: new Date('2024-01-15T12:00:00')
        }),
        createEvent({ 
          id: '1', 
          intent: 'essential',
          startTime: new Date('2024-01-15T09:00:00'), 
          endTime: new Date('2024-01-15T10:00:00')
        }),
      ];

      const result = modulator.modulate(events, DEFAULT_STATE_CONFIGS.driven);

      expect(result.activeEvents[0]?.id).toBe('1');
      expect(result.activeEvents[1]?.id).toBe('2');
    });
  });

  describe('no reminder behavior', () => {
    it('should not have any reminder-related fields', () => {
      const events = [
        createEvent({ id: '1', intent: 'essential' }),
      ];

      const result = modulator.modulate(events, DEFAULT_STATE_CONFIGS.foggy);

      // No reminder fields - by design
      expect(result).not.toHaveProperty('reminders');
      expect(result).not.toHaveProperty('notifications');
    });
  });
});
