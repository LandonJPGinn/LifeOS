#!/usr/bin/env node

import { LifeOS, MockTaskManager, MockCalendar, isValidCapacity, type CapacityState } from './index.js';

// --- Mock Data Setup ---
const mockTaskManager = new MockTaskManager();
mockTaskManager.setTasks([
  { id: '1', title: 'Write report', priority: 'essential', domain: 'work', cognitiveLoad: 'high', estimatedMinutes: 120, visible: false, source: 'mock' },
  { id: '2', title: 'Pay bills', priority: 'essential', domain: 'personal', cognitiveLoad: 'low', estimatedMinutes: 15, visible: false, source: 'mock' },
  { id: '3', title: 'Team meeting', priority: 'important', domain: 'work', cognitiveLoad: 'medium', estimatedMinutes: 60, visible: false, source: 'mock' },
  { id: '4', title: 'Plan vacation', priority: 'normal', domain: 'personal', cognitiveLoad: 'medium', estimatedMinutes: 45, visible: false, source: 'mock' },
  { id: '5', title: 'Review PR', priority: 'important', domain: 'work', cognitiveLoad: 'high', estimatedMinutes: 30, visible: false, source: 'mock' },
  { id: '6', title: 'Grocery shopping', priority: 'essential', domain: 'personal', cognitiveLoad: 'low', estimatedMinutes: 45, visible: false, source: 'mock' },
  { id: '7', title: 'Call doctor', priority: 'essential', domain: 'personal', cognitiveLoad: 'minimal', estimatedMinutes: 10, visible: false, source: 'mock' },
]);

const mockWorkCalendar = new MockCalendar('work');
const now = new Date();
mockWorkCalendar.setEvents([
    { id: 'w1', title: 'Project Standup', startTime: new Date(now.getTime() + 1 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 1.5 * 60 * 60 * 1000), source: 'work', intent: 'collaborative', active: false, calendarProvider: 'mock' },
    { id: 'w2', title: 'Code Review', startTime: new Date(now.getTime() + 3 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), source: 'work', intent: 'focus', active: false, calendarProvider: 'mock' },
]);

const lifeos = new LifeOS();
lifeos.addTaskManager(mockTaskManager);
lifeos.addCalendar(mockWorkCalendar);

// --- CLI Logic ---
const args = process.argv.slice(2);
const command = args[0];
const value = args[1] as CapacityState;

async function main() {
  switch (command) {
    case 'set-capacity':
      if (!value) {
        console.error('Error: Missing capacity state. e.g., "lifeos set-capacity foggy"');
        process.exit(1);
      }
      if (!isValidCapacity(value)) {
        console.error(`Error: Invalid capacity state "${value}".`);
        process.exit(1);
      }
      lifeos.setCapacity(value);
      console.log(`Capacity set to: ${value}`);
      await printDailyView();
      break;

    case 'view':
        await printDailyView();
        break;

    default:
      console.log('Usage: lifeos <command> [value]');
      console.log('Commands:');
      console.log('  set-capacity <state>  Set your current capacity');
      console.log('  view                  View your current daily plan');
  }
}

async function printDailyView() {
    const view = await lifeos.getDailyView();
    console.log(`\n--- Your Modulated Day (${view.state}) ---`);
    console.log(`\nVisible Tasks (${view.tasks.visibleTasks.length}):`);
    view.tasks.visibleTasks.forEach(task => {
        console.log(`- [ ] ${task.title} (${task.estimatedMinutes} mins)`);
    });
    console.log(`\nHidden Tasks: ${view.tasks.hiddenTasks.length}`);

    console.log(`\nActive Events (${view.calendar.activeEvents.length}):`);
    view.calendar.activeEvents.forEach(event => {
        console.log(`- ${event.title} (${event.startTime.toLocaleTimeString()} - ${event.endTime.toLocaleTimeString()})`);
    });
    console.log(`\nSuggested Cancellations: ${view.calendar.suggestedCancellations.length}`);
}

main().catch(err => {
  console.error('An unexpected error occurred:', err);
  process.exit(1);
});
