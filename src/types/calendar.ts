/**
 * LifeOS Calendar Types
 * 
 * Defines calendar interfaces for integration with work and personal calendars.
 * Calendar intent modulation - no reminders or catch-up.
 */

/**
 * Calendar source - work or personal
 */
export type CalendarSource = 'work' | 'personal';

/**
 * Event intent - what the event represents for capacity management
 */
export type EventIntent = 
  | 'focus'        // Deep work, needs protection
  | 'collaborative' // Meeting/call, social energy needed
  | 'recovery'     // Break, rest, personal time
  | 'transition'   // Buffer between activities
  | 'flexible'     // Can be moved or skipped
  | 'essential';   // Cannot be avoided

/**
 * A calendar event
 */
export interface CalendarEvent {
  /** Unique identifier from the source calendar */
  id: string;
  /** Event title */
  title: string;
  /** Event description */
  description?: string;
  /** Start time */
  startTime: Date;
  /** End time */
  endTime: Date;
  /** Calendar source */
  source: CalendarSource;
  /** Event intent for capacity management */
  intent: EventIntent;
  /** Whether event is currently active based on state */
  active: boolean;
  /** External calendar identifier (e.g., 'google', 'outlook') */
  calendarProvider: string;
}

/**
 * Calendar intent configuration per capacity state
 */
export interface CalendarIntentConfig {
  /** Which event intents to honor */
  honoredIntents: EventIntent[];
  /** Whether to suggest event cancellation for non-essential */
  suggestCancellation: boolean;
  /** Whether to add recovery buffers between events */
  addRecoveryBuffers: boolean;
  /** Buffer duration in minutes */
  bufferMinutes: number;
}
