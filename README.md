# LifeOS

A state-driven productivity system for those who need systems when they themselves cannot function like a system.

## Philosophy

LifeOS is designed around a simple principle: **you declare your capacity, the system handles the rest**.

- **No backlogs** - Hidden tasks disappear, not queued for later
- **No urgency** - Workload is what's manageable, nothing more  
- **No streaks** - No gamification or achievement tracking
- **No reminders** - Events exist or don't, no nagging
- **No catch-up** - Yesterday's hidden tasks are not today's burden

## Capacity States

You declare one of five capacity states:

| State | Description | Task Visibility | Calendar Hours |
|-------|-------------|-----------------|----------------|
| `foggy` | Low clarity, minimal cognitive resources | Essential only, max 3 | 2 hours |
| `anxious` | High stress/worry | Essential only, max 2 | 1 hour |
| `flat` | Low energy/motivation | Essential + Important, max 4 | 3 hours |
| `overstimulated` | Sensory/cognitive overload | Protected (none) | 1 hour |
| `driven` | High capacity, full workload | All priorities, max 15 | 8 hours |

**Default state**: If no capacity is declared, the system defaults to `foggy` - the safest option.

## Quick Start

```typescript
import { LifeOS, MockTaskManager, MockCalendar } from 'lifeos';

// Create the system
const lifeos = new LifeOS();

// Add integrations
lifeos.addTaskManager(new MockTaskManager());
lifeos.addCalendar(new MockCalendar('work'));
lifeos.addCalendar(new MockCalendar('personal'));

// Declare your capacity
lifeos.setCapacity('anxious');

// Get your modulated day
const today = await lifeos.getDailyView();

console.log(`State: ${today.state}`);
console.log(`Visible tasks: ${today.tasks.visibleTasks.length}`);
console.log(`Active events: ${today.calendar.activeEvents.length}`);
console.log(`Energy budget: ${today.energyBudget}/10`);
```

## Installation

```bash
npm install lifeos
```

## CLI Usage

The CLI is the primary way to interact with LifeOS.

```bash
# Set your capacity for the day
lifeos set-capacity flat

# View your modulated day
lifeos view

# Get a recommendation for your capacity state
lifeos recommend-state

# Sync with external tools (placeholder)
lifeos sync
```

### Inter-day State Memory

LifeOS saves your last capacity state in a `.lifeos-state.json` file in your current directory. This allows the system to remember your last state and use it as the default for the next day.

## Core Concepts

### State Management

```typescript
// Set capacity (overwrites any prior state)
lifeos.setCapacity('driven', 'feeling productive');

// Reset to default (foggy)
lifeos.resetCapacity();

// Graceful degradation
lifeos.degradeGracefully('fatigue'); // driven → flat
```

State changes are instant and complete - no history, no streaks, no debt.

### Task Modulation

Tasks are filtered based on:
- **Priority**: essential > important > normal > optional
- **Cognitive Load**: minimal < low < medium < high
- **Domain**: work vs personal (configurable per state)

```typescript
// Tasks hidden in foggy but visible in driven
const foggyView = await lifeos.getDailyView(); // state: foggy
const drivenView = await lifeos.getDailyView(); // state: driven

// No backlog - foggyView.tasks doesn't reference "missed" tasks
```

### Calendar Modulation

Events are categorized by intent:
- `essential` - Cannot be avoided (always honored)
- `focus` - Deep work, needs protection
- `collaborative` - Meeting/call, social energy needed
- `recovery` - Break, rest, personal time
- `transition` - Buffer between activities
- `flexible` - Can be moved or skipped

```typescript
const view = await lifeos.getDailyView();

// Active events based on current state
view.calendar.activeEvents;

// Events suggested for cancellation (if state allows)
view.calendar.suggestedCancellations;

// Recovery buffers between events
view.calendar.recoveryBuffers;
```

### Graceful Degradation

Each state can auto-degrade to a safer fallback:

| From State | Fallback | Triggers |
|------------|----------|----------|
| `driven` | `flat` | fatigue, distraction, depletion |
| `flat` | `foggy` | exhaustion, withdrawal |
| `anxious` | `foggy` | overwhelm, panic, shutdown |
| `overstimulated` | `foggy` | meltdown, shutdown, overwhelm |
| `foggy` | _(none)_ | Already at safest state |

```typescript
// Check for degradation triggers
const triggers = stateManager.checkDegradationTriggers(['fatigue', 'happy']);
// Returns: ['fatigue'] if in driven state

// Trigger degradation
lifeos.degradeGracefully('fatigue'); // driven → flat
```

## Integrations

### Task Manager Interface

```typescript
interface TaskManagerIntegration {
  readonly id: string;
  readonly name: string;
  isConnected(): boolean;
  fetchTasks(): Promise<Task[]>;
  fetchTasksByDomain(domain: TaskDomain): Promise<Task[]>;
}
```

### Calendar Interface

```typescript
interface CalendarIntegration {
  readonly id: string;
  readonly name: string;
  readonly source: CalendarSource; // 'work' | 'personal'
  isConnected(): boolean;
  fetchEvents(range: DateRange): Promise<CalendarEvent[]>;
  fetchTodayEvents(): Promise<CalendarEvent[]>;
}
```

## Daily View

The `getDailyView()` method returns:

```typescript
interface DailyView {
  state: CapacityState;
  config: StateConfig;
  tasks: {
    visibleTasks: Task[];
    hiddenTasks: Task[];
    totalMinutes: number;
    workloadLimitReached: boolean;
    remainingCapacity: number;
  };
  calendar: {
    activeEvents: CalendarEvent[];
    suggestedCancellations: CalendarEvent[];
    recoveryBuffers: RecoveryBuffer[];
    totalHours: number;
    calendarLimitExceeded: boolean;
  };
  generatedAt: Date;
  energyBudget: number; // 1-10 scale
}
```

## Building & Testing

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Type check
npm run lint
```

## License

ISC
