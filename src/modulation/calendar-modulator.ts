/**
 * LifeOS Calendar Modulator
 * 
 * Modulates calendar event visibility and intent based on capacity state.
 * No reminders - events are honored or suggested for cancellation.
 */

import type { CalendarEvent, CalendarIntentConfig, EventIntent } from '../types/index.js';
import type { StateConfig } from '../types/index.js';

/**
 * Result of calendar modulation
 */
export interface CalendarModulationResult {
  /** Total number of events before modulation */
  totalEvents: number;
  /** Events that should be honored */
  activeEvents: CalendarEvent[];
  /** Events suggested for cancellation/reschedule */
  suggestedCancellations: CalendarEvent[];
  /** Recovery buffers to add between events */
  recoveryBuffers: RecoveryBuffer[];
  /** Total calendar hours after modulation */
  totalHours: number;
  /** Whether calendar limit was exceeded */
  calendarLimitExceeded: boolean;
}

/**
 * A recovery buffer between events
 */
export interface RecoveryBuffer {
  /** Start time of the buffer */
  startTime: Date;
  /** End time of the buffer */
  endTime: Date;
  /** Duration in minutes */
  durationMinutes: number;
  /** Event this buffer follows */
  afterEventId: string;
}

/**
 * Modulates calendar events based on capacity state configuration.
 * 
 * Philosophy:
 * - No reminders: events exist or don't, no nagging
 * - Intent-based: events categorized by what they demand
 * - Recovery focus: buffers protect transitions
 */
export class CalendarModulator {
  /**
   * Modulate calendar events based on state configuration.
   * 
   * @param events - All calendar events
   * @param config - Current state configuration
   * @returns Modulation result with active events and suggestions
   */
  modulate(events: CalendarEvent[], config: StateConfig): CalendarModulationResult {
    const { calendarIntent, workload } = config;
    
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    );

    const activeEvents: CalendarEvent[] = [];
    const suggestedCancellations: CalendarEvent[] = [];
    let totalHours = 0;

    for (const event of sortedEvents) {
      const shouldHonor = this.shouldHonorEvent(event, calendarIntent);
      const eventHours = this.getEventDuration(event) / 60;

      if (shouldHonor) {
        // Check if we're exceeding calendar limit
        if (totalHours + eventHours <= workload.maxCalendarHours) {
          activeEvents.push({ ...event, active: true });
          totalHours += eventHours;
        } else if (event.intent === 'essential') {
          // Always include essential events even if over limit
          activeEvents.push({ ...event, active: true });
          totalHours += eventHours;
        } else {
          suggestedCancellations.push({ ...event, active: false });
        }
      } else if (calendarIntent.suggestCancellation) {
        suggestedCancellations.push({ ...event, active: false });
      }
    }

    // Generate recovery buffers if configured
    const recoveryBuffers = calendarIntent.addRecoveryBuffers
      ? this.generateRecoveryBuffers(activeEvents, calendarIntent.bufferMinutes)
      : [];

    return {
      totalEvents: events.length,
      activeEvents,
      suggestedCancellations,
      recoveryBuffers,
      totalHours,
      calendarLimitExceeded: totalHours > workload.maxCalendarHours
    };
  }

  /**
   * Check if an event should be honored based on intent configuration.
   */
  private shouldHonorEvent(event: CalendarEvent, config: CalendarIntentConfig): boolean {
    // Essential events are always honored
    if (event.intent === 'essential') return true;
    
    // Check if this intent is in the honored list
    return config.honoredIntents.includes(event.intent);
  }

  /**
   * Generate recovery buffers between events.
   */
  private generateRecoveryBuffers(
    events: CalendarEvent[], 
    bufferMinutes: number
  ): RecoveryBuffer[] {
    const buffers: RecoveryBuffer[] = [];

    for (let i = 0; i < events.length - 1; i++) {
      const current = events[i];
      const next = events[i + 1];

      if (!current || !next) continue;

      // Check if there's a gap between events
      const gapMinutes = (next.startTime.getTime() - current.endTime.getTime()) / (1000 * 60);

      if (gapMinutes >= bufferMinutes) {
        // There's room for a full buffer
        const bufferEnd = new Date(current.endTime.getTime() + bufferMinutes * 60 * 1000);
        buffers.push({
          startTime: current.endTime,
          endTime: bufferEnd,
          durationMinutes: bufferMinutes,
          afterEventId: current.id
        });
      } else if (gapMinutes > 0) {
        // Partial buffer using available gap
        buffers.push({
          startTime: current.endTime,
          endTime: next.startTime,
          durationMinutes: gapMinutes,
          afterEventId: current.id
        });
      }
    }

    return buffers;
  }

  /**
   * Get event duration in minutes.
   */
  private getEventDuration(event: CalendarEvent): number {
    return (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
  }

  /**
   * Get intent weight for capacity calculations
   */
  getIntentWeight(intent: EventIntent): number {
    const weights: Record<EventIntent, number> = {
      recovery: 0,      // Restores energy
      transition: 1,    // Low demand
      flexible: 2,      // Moderate demand
      focus: 4,         // High demand (deep work)
      collaborative: 5, // High demand (social)
      essential: 3      // Variable, but must be done
    };
    return weights[intent];
  }
}
