/**
 * LifeOS Google Calendar Integration
 *
 * Mock implementation of Google Calendar integration for LifeOS.
 */

import { BaseCalendarIntegration } from '../calendar.js';
import type { CalendarEvent, DateRange } from '../../types/index.js';

export class GoogleCalendarIntegration extends BaseCalendarIntegration {
  readonly id = 'google-calendar';
  readonly name = 'Google Calendar';
  readonly source = 'work';

  private getMockEvents(): CalendarEvent[] {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return [
      {
        id: 'gcal-1',
        title: 'Weekly Sync',
        startTime: new Date(todayStart.getTime() + 10 * 60 * 60 * 1000), // 10:00 AM
        endTime: new Date(todayStart.getTime() + 11 * 60 * 60 * 1000),   // 11:00 AM
        source: 'work',
        intent: 'collaborative',
        active: true,
        calendarProvider: 'google-calendar',
      },
      {
        id: 'gcal-2',
        title: 'Focus Time',
        startTime: new Date(todayStart.getTime() + 14 * 60 * 60 * 1000), // 2:00 PM
        endTime: new Date(todayStart.getTime() + 16 * 60 * 60 * 1000),   // 4:00 PM
        source: 'work',
        intent: 'focus',
        active: true,
        calendarProvider: 'google-calendar',
      },
    ];
  }

  async fetchEvents(range: DateRange): Promise<CalendarEvent[]> {
    if (!this.isConnected()) {
      return [];
    }
    const mockEvents = this.getMockEvents();
    return mockEvents.filter(event =>
      event.startTime >= range.start && event.endTime <= range.end
    );
  }
}
