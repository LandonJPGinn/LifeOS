#!/usr/bin/env node

import { LifeOS, AsanaIntegration, GoogleCalendarIntegration, ObsidianIntegration, isValidCapacity, type CapacityState } from './index.js';

// --- Integrations Setup ---
const asana = new AsanaIntegration();
const googleCalendar = new GoogleCalendarIntegration();
const obsidian = new ObsidianIntegration();

const lifeos = new LifeOS();
lifeos.addTaskManager(asana);
lifeos.addTaskManager(obsidian);
lifeos.addCalendar(googleCalendar);

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
