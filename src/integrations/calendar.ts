/**
 * LifeOS Calendar Integration Interface
 * 
 * Abstract interface for integrating with external calendars.
 * Supports both work and personal calendars.
 */

import type { CalendarEvent, CalendarSource } from '../types/index.js';
import type { BaseIntegration } from './base.js';

/**
 * Date range for fetching events
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Interface for calendar integrations.
 * Implementations should connect to services like Google Calendar, Outlook, etc.
 */
export interface CalendarIntegration extends BaseIntegration {
  /** Whether this is a work or personal calendar */
  readonly source: CalendarSource;
  
  /**
   * Fetch events from the calendar for a date range.
   * Should transform external event format to LifeOS CalendarEvent type.
   */
  fetchEvents(range: DateRange): Promise<CalendarEvent[]>;
  
  /**
   * Fetch today's events.
   */
  fetchTodayEvents(): Promise<CalendarEvent[]>;
}

/**
 * Base class for calendar integrations with common functionality.
 */
export abstract class BaseCalendarIntegration implements CalendarIntegration {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly source: CalendarSource;
  
  protected connected = false;
  
  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }
  
  abstract fetchEvents(range: DateRange): Promise<CalendarEvent[]>;
  
  async fetchTodayEvents(): Promise<CalendarEvent[]> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    return this.fetchEvents({ start, end });
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
 * Mock calendar for testing and development.
 */
export class MockCalendar extends BaseCalendarIntegration {
  readonly id: string;
  readonly name: string;
  readonly source: CalendarSource;
  
  private mockEvents: CalendarEvent[] = [];
  
  constructor(source: CalendarSource, name?: string) {
    super();
    this.source = source;
    this.id = `mock-${source}`;
    this.name = name ?? `Mock ${source} Calendar`;
    this.connected = true;
  }
  
  /**
   * Set mock events for testing.
   */
  setEvents(events: CalendarEvent[]): void {
    this.mockEvents = events;
  }
  
  async fetchEvents(range: DateRange): Promise<CalendarEvent[]> {
    // Filter events within the date range
    return this.mockEvents.filter(event => 
      event.startTime >= range.start && event.endTime <= range.end
    );
  }
}
