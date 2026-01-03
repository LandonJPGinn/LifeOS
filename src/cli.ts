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
    console.error('Error: Missing capacity state. e.g., "lifeos mood foggy"');
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
  const view = await lifeos.getDailyView();
  const taskManagers = lifeos.getTaskManagers();
  const calendars = lifeos.getCalendars();

  console.log(chalk.bold.underline('\n--- Sync Simulation (Dry Run) ---'));
  console.log(chalk.dim('This is a dry run. No actual changes will be made.\n'));

  // --- Task Manager Sync ---
  if (taskManagers.length > 0) {
    console.log(chalk.bold.yellow('📲 Task Managers'));
    for (const tm of taskManagers) {
      console.log(chalk.dim(`   - Clearing "Today" list in ${tm.name}...`));
      if (view.tasks.visibleTasks.length > 0) {
        console.log(`   - Adding ${view.tasks.visibleTasks.length} tasks to "Today" in ${tm.name}:`);
        view.tasks.visibleTasks.forEach(task => {
          console.log(chalk.green(`     + "${task.title}"`));
        });
      } else {
        console.log(chalk.dim(`   - No tasks to add to ${tm.name}.`));
      }
    }
  }

  // --- Calendar Sync ---
  if (calendars.length > 0) {
    console.log(chalk.bold.blue('\n🗓️  Calendars'));
    for (const cal of calendars) {
      if (view.calendar.suggestedCancellations.length > 0) {
        console.log(`   - Suggesting ${view.calendar.suggestedCancellations.length} event cancellations in ${cal.name}:`);
        view.calendar.suggestedCancellations.forEach(event => {
          console.log(chalk.red(`     ! Rename "${event.title}" to "[CANCEL?] ${event.title}"`));
        });
      }
      if (view.calendar.recoveryBuffers.length > 0) {
        console.log(`   - Adding ${view.calendar.recoveryBuffers.length} recovery buffers to ${cal.name}:`);
        view.calendar.recoveryBuffers.forEach(buffer => {
          console.log(chalk.cyan(`     + Add "${buffer.title}" (${buffer.durationMinutes} mins)`));
        });
      }
      if (view.calendar.suggestedCancellations.length === 0 && view.calendar.recoveryBuffers.length === 0) {
        console.log(chalk.dim(`   - No changes for ${cal.name}.`));
      }
    }
  }

  console.log(chalk.bold.green('\n✅ Sync simulation complete.'));
}

async function handleWhy() {
  const view = await lifeos.getDailyView();
  const config = lifeos.getConfig();

  console.log(chalk.bold.underline(`\n--- Why Your Day Looks This Way (${view.state}) ---`));

  const explanations = {
    taskVisibility: `Only tasks with priorities [${config.taskVisibility.visiblePriorities.join(', ')}] and cognitive loads [${config.taskVisibility.manageableLoads.join(', ')}] are shown.`,
    taskLimits: `You'll see a maximum of ${config.taskVisibility.maxVisibleTasks} tasks, totaling no more than ${config.workload.maxDailyMinutes} minutes.`,
    calendarVisibility: `Only calendar events with intents [${config.calendarIntent.honoredIntents.join(', ')}] are shown.`,
    calendarChanges: `${config.calendarIntent.suggestCancellation ? 'Events may be suggested for cancellation.' : ''} ${config.calendarIntent.addRecoveryBuffers ? `Recovery buffers of ${config.calendarIntent.bufferMinutes} minutes are added.` : ''}`,
    workload: `The focus is on ${config.workload.showWorkTasks ? 'work' : 'personal'} tasks, with a total energy budget of ${config.workload.energyBudget}/10.`
  };

  Object.values(explanations).forEach(explanation => {
    if (explanation.trim().length > 0) {
      console.log(chalk.cyan(`\n- ${explanation}`));
    }
  });
}

async function handleRecommendState() {
  const { tasks, events } = await lifeos.getUnmodulatedData();

  const totalCognitiveLoad = tasks.reduce((acc, task) => {
    switch (task.cognitiveLoad) {
      case 'high': return acc + 3;
      case 'medium': return acc + 2;
      case 'low': return acc + 1;
      case 'minimal': return acc + 0.5;
      default: return acc;
    }
  }, 0);

  const collaborationHours = events
    .filter(event => event.intent === 'collaborative')
    .reduce((acc, event) => acc + (event.endTime.getTime() - event.startTime.getTime()) / 3600000, 0);

  const essentialItems = tasks.filter(t => t.priority === 'essential').length + events.filter(e => e.intent === 'essential').length;
  const totalTaskMinutes = tasks.reduce((acc, task) => acc + task.estimatedMinutes, 0);

  let recommendation: CapacityState = 'foggy';
  let reason = 'Your day seems light and manageable.';

  if (totalCognitiveLoad > 15 || collaborationHours > 4) {
    recommendation = 'overstimulated';
    reason = `You have a high cognitive load (${totalCognitiveLoad.toFixed(1)}) and/or a significant amount of collaboration (${collaborationHours.toFixed(1)} hours).`;
  } else if (essentialItems > 5) {
    recommendation = 'anxious';
    reason = `You have a high number of essential tasks or events (${essentialItems}), which could be stressful.`;
  } else if (totalTaskMinutes > 300 && totalCognitiveLoad < 10) {
    recommendation = 'driven';
    reason = `Your day is full (${totalTaskMinutes} mins of tasks), but the cognitive load is manageable.`;
  } else if (totalTaskMinutes > 120 || totalCognitiveLoad > 8) {
    recommendation = 'flat';
    reason = `You have a moderate number of tasks (${totalTaskMinutes} mins) and a moderate cognitive load (${totalCognitiveLoad.toFixed(1)}).`;
  }

  console.log(chalk.bold(`\n💡 Recommendation: ${chalk.cyan(recommendation)}`));
  console.log(`   ${reason}`);
  console.log(chalk.dim(`   Analyzed ${tasks.length} tasks and ${events.length} events.`));
}

async function handleFocus() {
  const view = await lifeos.getDailyView();
  const nextTask = view.tasks.visibleTasks[0];
  const now = new Date();
  const nextEvent = view.calendar.activeEvents.find(event => event.endTime > now);

  console.log(chalk.bold.underline('\n--- Your Immediate Focus ---'));

  if (nextTask) {
    console.log(chalk.bold.green(`\n🎯 Next Task:`));
    console.log(`   - [ ] ${nextTask.title} ${chalk.dim(`(~${nextTask.estimatedMinutes} mins)`)}`);
  } else {
    console.log(chalk.bold.green(`\n🎯 Next Task:`));
    console.log(chalk.dim("   No more tasks for today."));
  }

  if (nextEvent) {
    const startTime = nextEvent.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = nextEvent.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    console.log(chalk.bold.blue(`\n🗓️  Upcoming Event:`));
    console.log(`   - ${chalk.cyan(startTime)} - ${chalk.cyan(endTime)}: ${nextEvent.title}`);
  } else {
    console.log(chalk.bold.blue(`\n🗓️  Upcoming Event:`));
    console.log(chalk.dim("   No more events scheduled."));
  }
  console.log(`\n`);
}

function printHelp() {
  console.log('Usage: lifeos <command> [value]');
  console.log('Commands:');
  console.log('  mood, m <state>          Set your current capacity');
  console.log('  view, v, status          View your current daily plan');
  console.log('  focus, f                 Show the next immediate task and event');
  console.log('  backoff, b [trigger]     Degrade to a lower capacity state');
  console.log('  todo, rec                Get a suggested state based on your current load');
  console.log('  sync, s                  Sync with external tools');
  console.log('  why, w                   Explain why your day is modulated the way it is');
}

async function printDailyView() {
  const view = await lifeos.getDailyView();
  const timestamp = lifeos.getFormattedTimestamp(view.generatedAt);

  const stateInfo = {
    driven: { color: chalk.green, icon: '🚀' },
    flat: { color: chalk.blue, icon: '🚶' },
    foggy: { color: chalk.gray, icon: '🌫️' },
    anxious: { color: chalk.yellow, icon: '😬' },
    overstimulated: { color: chalk.red, icon: '🤯' },
    productive: { color: chalk.magenta, icon: '⚡' },
    social: { color: chalk.cyan, icon: '🍻' },
  };

  const { color, icon } = stateInfo[view.state] || { color: chalk.white, icon: '❓' };

  console.log(chalk.bold(`\n${icon} Your Modulated Day`));
  console.log(chalk.dim('----------------------------------------'));
  console.log(`State: ${color.bold(view.state)} | Energy: ${color(view.energyBudget + '/10')} | As of: ${chalk.dim(timestamp)}`);
  console.log(chalk.dim('----------------------------------------\n'));

  // --- Tasks Section ---
  console.log(chalk.bold.green(`✅ Visible Tasks (${view.tasks.visibleTasks.length}/${view.tasks.totalTasks})`));
  if (view.tasks.visibleTasks.length > 0) {
    view.tasks.visibleTasks.forEach(task => {
      console.log(`   - [ ] ${task.title} ${chalk.dim(`(~${task.estimatedMinutes} mins)`)}`);
    });
    console.log(chalk.dim(`   Total time: ${view.tasks.totalMinutes} mins | Remaining capacity: ${view.tasks.remainingCapacity} mins`));
  } else {
    console.log(chalk.dim("   No tasks visible for your current state."));
  }
  console.log(chalk.dim(`   (${view.tasks.hiddenTasks.length} tasks hidden)\n`));

  // --- Calendar Section ---
  console.log(chalk.bold.blue(`🗓️  Active Events (${view.calendar.activeEvents.length}/${view.calendar.totalEvents})`));
  if (view.calendar.activeEvents.length > 0) {
    view.calendar.activeEvents.forEach(event => {
      const startTime = event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endTime = event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      console.log(`   - ${chalk.cyan(startTime)} - ${chalk.cyan(endTime)}: ${event.title}`);
    });
  } else {
    console.log(chalk.dim("   No events scheduled for today."));
  }
  if (view.calendar.suggestedCancellations.length > 0) {
    console.log(chalk.yellow.dim(`   (${view.calendar.suggestedCancellations.length} events suggested for cancellation)`));
  }
  console.log('');
}

// --- Main Execution ---

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const value = args[1] as CapacityState;

  switch (command) {
    case 'mood':
    case 'm':
      await handleSetCapacity(value);
      break;
    case 'view':
    case 'status':
    case 'v':
      await printDailyView();
      break;
    case 'focus':
    case 'f':
      await handleFocus();
      break;
    case 'backoff':
    case 'b':
      await handleDegrade(value);
      break;
    case 'todo':
    case 'rec':
      await handleRecommendState();
      break;
    case 'sync':
    case 's':
      await handleSync();
      break;
    case 'why':
    case 'w':
      await handleWhy();
      break;
    default:
      printHelp();
  }
}

main().catch(err => {
  console.error('An unexpected error occurred:', err);
  process.exit(1);
});
