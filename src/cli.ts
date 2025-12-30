#!/usr/bin/env node

import { LifeOS, AsanaIntegration, GoogleCalendarIntegration, ObsidianIntegration, isValidCapacity, type CapacityState } from './index.js';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

const STATE_FILE = path.join(process.cwd(), '.lifeos-state.json');

// --- State Persistence ---

function saveState(state: CapacityState) {
  fs.writeFileSync(STATE_FILE, JSON.stringify({ lastState: state }));
}

function loadState(): CapacityState | null {
  if (fs.existsSync(STATE_FILE)) {
    const data = fs.readFileSync(STATE_FILE, 'utf-8');
    const { lastState } = JSON.parse(data);
    return isValidCapacity(lastState) ? lastState : null;
  }
  return null;
}

// --- Integrations Setup ---
const asana = new AsanaIntegration();
const googleCalendar = new GoogleCalendarIntegration();
const obsidian = new ObsidianIntegration();

const lifeos = new LifeOS({ initialState: loadState() ?? undefined });
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
  saveState(capacity);
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

async function handleSync() {
  console.log('Syncing with external tools... (Not yet implemented)');
  // Future implementation will go here
}

async function handleRecommendState() {
  const { tasks, events } = await lifeos.getUnmodulatedData();
  const taskCount = tasks.length;
  const eventCount = events.length;

  let score = 0;

  // Task scoring
  tasks.forEach(task => {
    switch (task.priority) {
      case 'essential': score += 5; break;
      case 'important': score += 3; break;
      case 'normal': score += 2; break;
      case 'optional': score += 1; break;
    }
    switch (task.cognitiveLoad) {
      case 'high': score += 5; break;
      case 'medium': score += 3; break;
      case 'low': score += 1; break;
    }
  });

  // Event scoring
  events.forEach(event => {
    switch (event.intent) {
      case 'essential': score += 5; break;
      case 'focus': score += 4; break;
      case 'collaborative': score += 3; break;
      case 'flexible': score += 1; break;
    }
  });

  let recommendation: CapacityState = 'foggy';
  if (score > 40) {
    recommendation = 'overstimulated';
  } else if (score > 25) {
    recommendation = 'anxious';
  } else if (score > 10) {
    recommendation = 'flat';
  } else if (score > 0) {
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
  console.log('  sync                  Sync with external tools');
}

async function printDailyView() {
    const view = await lifeos.getDailyView();
    const timestamp = lifeos.getFormattedTimestamp(view.generatedAt);

    const stateColors = {
        driven: chalk.green,
        flat: chalk.blue,
        foggy: chalk.gray,
        anxious: chalk.yellow,
        overstimulated: chalk.red,
    };

    const color = stateColors[view.state] || chalk.white;

    console.log(chalk.bold.underline('\n--- Your Modulated Day ---'));
    console.log(`State: ${color(view.state)} (Energy Budget: ${view.energyBudget}/10)`);
    console.log(`As of: ${chalk.dim(timestamp)}\n`);

    console.log(chalk.bold.green(`✅ Visible Tasks (${view.tasks.visibleTasks.length}/${view.tasks.totalTasks})`));
    if (view.tasks.visibleTasks.length > 0) {
        view.tasks.visibleTasks.forEach(task => {
            console.log(`   - [ ] ${task.title} ${chalk.dim(`(~${task.estimatedMinutes} mins)`)}`);
        });
        console.log(chalk.dim(`   Total time: ${view.tasks.totalMinutes} mins | Remaining capacity: ${view.tasks.remainingCapacity} mins`));
    } else {
        console.log(chalk.dim("   No tasks visible for your current state."));
    }
    console.log(chalk.dim(`   (${view.tasks.hiddenTasks.length} tasks hidden)`));

    console.log(chalk.bold.blue(`\n🗓️  Active Events (${view.calendar.activeEvents.length}/${view.calendar.totalEvents})`));
    if (view.calendar.activeEvents.length > 0) {
        view.calendar.activeEvents.forEach(event => {
            const startTime = event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTime = event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            console.log(`   - ${chalk.cyan(startTime)} - ${chalk.cyan(endTime)}: ${event.title}`);
        });
    } else {
        console.log(chalk.dim("   No events scheduled for today."));
    }
    console.log(chalk.dim(`   (${view.calendar.suggestedCancellations.length} events suggested for cancellation)`));
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
    case 'sync':
      await handleSync();
      break;
    default:
      printHelp();
  }
}

main().catch(err => {
  console.error('An unexpected error occurred:', err);
  process.exit(1);
});
