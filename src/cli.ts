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

// --- Command Handlers ---

async function handleSetCapacity(capacity?: CapacityState) {
  if (!capacity) {
    console.error('Error: Missing capacity state. e.g., "lifeos set-capacity foggy"');
    process.exit(1);
  }
  if (!isValidCapacity(capacity)) {
    console.error(`Error: Invalid capacity state "${capacity}".`);
    process.exit(1);
  }
  lifeos.setCapacity(capacity);
  console.log(`Capacity set to: ${capacity}`);
  await printDailyView();
}

async function handleDegrade(trigger: string = 'manual') {
  const degraded = lifeos.degradeGracefully(trigger);
  if (degraded) {
    console.log(`Capacity degraded. New state: ${lifeos.getCapacity()}`);
    await printDailyView();
  } else {
    console.log(`No degradation occurred. State remains: ${lifeos.getCapacity()}`);
  }
}

async function handleRecommendState() {
  const { taskCount, eventCount } = await lifeos.getUnmodulatedLoad();
  const totalItems = taskCount + eventCount;
  let recommendation: CapacityState = 'foggy';

  if (totalItems > 15) {
    recommendation = 'overstimulated';
  } else if (totalItems > 10) {
    recommendation = 'anxious';
  } else if (totalItems > 5) {
    recommendation = 'flat';
  } else if (totalItems > 0) {
    recommendation = 'driven';
  }

  console.log(`Based on your ${taskCount} tasks and ${eventCount} events, we recommend setting your capacity to: ${recommendation}`);
}

function printHelp() {
  console.log('Usage: lifeos <command> [value]');
  console.log('Commands:');
  console.log('  set-capacity <state>  Set your current capacity');
  console.log('  view, status          View your current daily plan');
  console.log('  degrade [trigger]     Degrade to a lower capacity state');
  console.log('  recommend-state       Get a suggested state based on your current load');
}

async function printDailyView() {
    const view = await lifeos.getDailyView();
    const timestamp = lifeos.getFormattedTimestamp(view.generatedAt);

    console.log(`\n--- Your Modulated Day ---`);
    console.log(`State: ${view.state} (Energy Budget: ${view.energyBudget}/10)`);
    console.log(`As of: ${timestamp}\n`);

    console.log(`✅ Visible Tasks (${view.tasks.visibleTasks.length} of ${view.tasks.totalTasks})`);
    if (view.tasks.visibleTasks.length > 0) {
        view.tasks.visibleTasks.forEach(task => {
            console.log(`   - [ ] ${task.title} (~${task.estimatedMinutes} mins)`);
        });
    } else {
        console.log("   No tasks visible for your current state.");
    }
    console.log(`   (${view.tasks.hiddenTasks.length} tasks hidden)`);

    console.log(`\n🗓️  Active Events (${view.calendar.activeEvents.length} of ${view.calendar.totalEvents})`);
    if (view.calendar.activeEvents.length > 0) {
        view.calendar.activeEvents.forEach(event => {
            const startTime = event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTime = event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            console.log(`   - ${startTime} - ${endTime}: ${event.title}`);
        });
    } else {
        console.log("   No events scheduled for today.");
    }
    console.log(`   (${view.calendar.suggestedCancellations.length} events suggested for cancellation)`);
    console.log(`\n`);
}

// --- Main Execution ---

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const value = args[1] as CapacityState;

  switch (command) {
    case 'set-capacity':
      await handleSetCapacity(value);
      break;
    case 'view':
    case 'status':
      await printDailyView();
      break;
    case 'degrade':
      await handleDegrade(value);
      break;
    case 'recommend-state':
      await handleRecommendState();
      break;
    default:
      printHelp();
  }
}

main().catch(err => {
  console.error('An unexpected error occurred:', err);
  process.exit(1);
});
