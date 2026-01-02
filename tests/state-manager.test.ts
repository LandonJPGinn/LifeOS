/**
 * Tests for LifeOS State Manager
 */

import { StateManager } from '../src/state/manager';
import { DEFAULT_CAPACITY, CAPACITY_STATES, isValidCapacity } from '../src/types/capacity';
import type { CapacityState, StateChangeEvent } from '../src/index';

describe('StateManager', () => {
  describe('initialization', () => {
    it('should default to foggy state when no initial state provided', () => {
      const manager = new StateManager();
      expect(manager.getState()).toBe('foggy');
    });

    it('should accept custom initial state', () => {
      const manager = new StateManager({ initialState: 'driven' });
      expect(manager.getState()).toBe('driven');
    });

    it('should set stateSetAt timestamp on initialization', () => {
      const before = new Date();
      const manager = new StateManager();
      const after = new Date();
      
      const setAt = manager.getStateSetAt();
      expect(setAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(setAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('setState', () => {
    it('should change state and return true', () => {
      const manager = new StateManager({ initialState: 'foggy' });
      const result = manager.setState('driven');
      
      expect(result).toBe(true);
      expect(manager.getState()).toBe('driven');
    });

    it('should return false when setting same state', () => {
      const manager = new StateManager({ initialState: 'foggy' });
      const result = manager.setState('foggy');
      
      expect(result).toBe(false);
    });

    it('should overwrite prior state (no history)', () => {
      const manager = new StateManager({ initialState: 'foggy' });
      
      manager.setState('anxious');
      manager.setState('driven');
      manager.setState('flat');
      
      // Only current state matters - no history
      expect(manager.getState()).toBe('flat');
    });

    it('should update stateSetAt timestamp on change', () => {
      const manager = new StateManager({ initialState: 'foggy' });
      const initialTimestamp = manager.getStateSetAt();
      
      // Wait a tiny bit to ensure timestamp difference
      manager.setState('driven');
      const newTimestamp = manager.getStateSetAt();
      
      expect(newTimestamp.getTime()).toBeGreaterThanOrEqual(initialTimestamp.getTime());
    });

    it('should call onStateChange callback when state changes', () => {
      const events: StateChangeEvent[] = [];
      const manager = new StateManager({
        initialState: 'foggy',
        onStateChange: (event) => events.push(event)
      });
      
      manager.setState('anxious', 'feeling worried');
      
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        previousState: 'foggy',
        newState: 'anxious',
        reason: 'feeling worried'
      });
    });

    it('should not call onStateChange when state is same', () => {
      const events: StateChangeEvent[] = [];
      const manager = new StateManager({
        initialState: 'foggy',
        onStateChange: (event) => events.push(event)
      });
      
      manager.setState('foggy');
      
      expect(events).toHaveLength(0);
    });
  });

  describe('reset', () => {
    it('should reset to foggy default state', () => {
      const manager = new StateManager({ initialState: 'driven' });
      manager.reset();
      
      expect(manager.getState()).toBe(DEFAULT_CAPACITY);
    });
  });

  describe('graceful degradation', () => {
    it('should degrade driven to flat on trigger', () => {
      const manager = new StateManager({ initialState: 'driven' });
      const result = manager.degrade('fatigue');
      
      expect(result).toBe(true);
      expect(manager.getState()).toBe('flat');
    });

    it('should degrade anxious to foggy on trigger', () => {
      const manager = new StateManager({ initialState: 'anxious' });
      const result = manager.degrade('overwhelm');
      
      expect(result).toBe(true);
      expect(manager.getState()).toBe('foggy');
    });

    it('should not degrade foggy (no auto-degrade)', () => {
      const manager = new StateManager({ initialState: 'foggy' });
      const result = manager.degrade('anything');
      
      expect(result).toBe(false);
      expect(manager.getState()).toBe('foggy');
    });

    it('should mark degradation events correctly', () => {
      const events: StateChangeEvent[] = [];
      const manager = new StateManager({
        initialState: 'driven',
        onStateChange: (event) => events.push(event)
      });
      
      manager.degrade('fatigue');
      
      expect(events[0]?.isDegradation).toBe(true);
    });

    it('should degrade productive to driven on trigger', () => {
      const manager = new StateManager({ initialState: 'productive' });
      const result = manager.degrade('burnout');

      expect(result).toBe(true);
      expect(manager.getState()).toBe('driven');
    });
  });

  describe('getConfig', () => {
    it('should return configuration for current state', () => {
      const manager = new StateManager({ initialState: 'anxious' });
      const config = manager.getConfig();
      
      expect(config.state).toBe('anxious');
      expect(config.taskVisibility.maxVisibleTasks).toBe(2);
    });

    it('should return foggy config by default', () => {
      const manager = new StateManager();
      const config = manager.getConfig();
      
      expect(config.state).toBe('foggy');
    });
  });

  describe('checkDegradationTriggers', () => {
    it('should identify matching triggers', () => {
      const manager = new StateManager({ initialState: 'anxious' });
      const matches = manager.checkDegradationTriggers(['Overwhelm', 'happy', 'Panic']);
      
      expect(matches).toContain('Overwhelm');
      expect(matches).toContain('Panic');
      expect(matches).not.toContain('happy');
    });
  });
});

describe('Capacity Types', () => {
  describe('CAPACITY_STATES', () => {
    it('should contain all seven states', () => {
      expect(CAPACITY_STATES).toContain('foggy');
      expect(CAPACITY_STATES).toContain('anxious');
      expect(CAPACITY_STATES).toContain('flat');
      expect(CAPACITY_STATES).toContain('overstimulated');
      expect(CAPACITY_STATES).toContain('driven');
      expect(CAPACITY_STATES).toContain('productive');
      expect(CAPACITY_STATES).toContain('social');
      expect(CAPACITY_STATES).toHaveLength(7);
    });
  });

  describe('isValidCapacity', () => {
    it('should return true for valid states', () => {
      for (const state of CAPACITY_STATES) {
        expect(isValidCapacity(state)).toBe(true);
      }
    });

    it('should return false for invalid values', () => {
      expect(isValidCapacity('invalid')).toBe(false);
      expect(isValidCapacity('')).toBe(false);
      expect(isValidCapacity(null)).toBe(false);
      expect(isValidCapacity(undefined)).toBe(false);
      expect(isValidCapacity(123)).toBe(false);
    });
  });

  describe('DEFAULT_CAPACITY', () => {
    it('should be foggy', () => {
      expect(DEFAULT_CAPACITY).toBe('foggy');
    });
  });
});
