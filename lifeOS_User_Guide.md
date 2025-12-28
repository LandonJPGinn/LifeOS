# lifeOS User Guide: Integrating a State-Driven Productivity System into Your Daily Life

## Introduction

This guide provides a comprehensive outline for integrating `lifeOS` into your daily routines and existing work pipelines. It's designed to help you, an inspired and motivated person who may also live with ADHD, depression, or autism, to create a supportive and adaptive environment. The goal is to make `lifeOS` an invisible, frictionless partner that helps you stay focused and motivated, especially on challenging days.

## Foundational Concepts & Philosophy

`lifeOS` is built on a simple yet powerful idea: **your system should adapt to you, not the other way around.** For individuals with ADHD, depression, or autism, executive functions like planning, prioritizing, and task initiation can be incredibly challenging on some days. `lifeOS` acknowledges this reality and offers a system that doesn't demand perfection.

The core principles are:

*   **State-First, Not Task-First:** You don't start with a mountain of tasks; you start with yourself. By declaring your capacity, you set the context for your day.
*   **No Backlogs, No Guilt:** Hidden tasks are not deferred; they simply cease to exist for the day. This eliminates the shame and overwhelm of an ever-growing to-do list.
*   **Embracing Fluctuation:** The system is designed for inconsistency. It expects your capacity to change and provides mechanisms for graceful degradation.
*   **Frictionless Interaction:** The most important interaction with `lifeOS` is the state declaration. It's designed to be quick, simple, and require minimal cognitive load.

## The State Declaration Ritual: Your Morning Check-in

The most crucial part of using `lifeOS` is the morning check-in. This is a moment to pause, self-assess, and declare your capacity for the day. The goal is to make this ritual as seamless as possible, so it becomes a natural part of your routine.

### How to Declare Your State

You can declare your state in several ways, depending on your preferences and technical setup. Here are some ideas, from simple to more advanced:

*   **Command-Line Alias:** For developers, a simple shell alias can be very effective:
    ```bash
    alias foggy="lifeos set-capacity foggy"
    alias anxious="lifeos set-capacity anxious"
    # ...and so on
    ```
*   **Physical Buttons:** Using a small IoT button (like an AWS IoT Button or a Flic button) can provide a tangible, screen-free way to declare your state.
*   **Mobile Widget:** A simple mobile widget with five buttons, one for each state, can make the check-in as easy as checking the weather.
*   **Stream Deck or Programmable Keyboard:** For those with a Stream Deck or similar device, you can create a dedicated `lifeOS` profile with buttons for each state.

### When to Declare

*   **As part of your morning routine:** Tie the declaration to an existing habit, like making coffee or brushing your teeth.
*   **Before you look at any screens:** This is key. The goal is to set your intentions *before* the outside world imposes its demands on you.

## Integration with Existing Pipelines

`lifeOS` is not designed to replace your favorite task manager or calendar. Instead, it acts as a modulation layer on top of them. The key is to create a "Today" view in your existing tools that is populated by `lifeOS`.

### The "Sync" Script

The bridge between `lifeOS` and your tools is a `sync` script. This script, which you can run manually or automatically after your morning check-in, will:

1.  **Instantiate `lifeOS`:** It creates an instance of the `lifeOS` class.
2.  **Add Integrations:** It connects to your task manager(s) and calendar(s) using the appropriate integration plugins.
3.  **Get the `DailyView`:** It calls `lifeos.getDailyView()` to get the modulated list of tasks and events for the day.
4.  **Update Your Tools:** It then uses the APIs of your task manager and calendar to:
    *   Create a "Today" list or tag in your task manager and populate it with the `visibleTasks`.
    *   Mark any `suggestedCancellations` in your calendar, perhaps by adding a "[CANCEL?]" prefix to the event title.
    *   Create `recoveryBuffers` as new, private events in your calendar.

### Example Workflow (Todoist + Google Calendar)

1.  You declare your state as `anxious`.
2.  The `sync` script runs.
3.  It fetches all your tasks from Todoist and events from Google Calendar.
4.  `lifeOS` determines that only 2 essential tasks are visible.
5.  The script clears yesterday's "Today" filter in Todoist and creates a new one with the 2 visible tasks.
6.  It finds a 1-hour meeting in your calendar and, because you're `anxious`, renames it to "[CANCEL?] 1-hour meeting".
7.  It adds a 45-minute "Recovery Time" event after the meeting.

## The Modulated Environment: Living with `lifeOS`

After the `sync` script runs, your digital environment is tailored to your declared capacity. Here’s what that looks like in practice:

### Your "Today" View

*   **Task Manager:** You no longer look at your full "Inbox" or "Projects" lists. Your single source of truth for the day is the "Today" view created by `lifeOS`. It's short, manageable, and, most importantly, achievable.
*   **Calendar:** Your calendar now reflects not just your appointments, but also your capacity. The `recoveryBuffers` are just as important as your meetings.

### Notification Modulation

A key component of the modulated environment is controlling notifications. You can tie your `lifeOS` state to your system's focus modes (like "Focus" on iOS/macOS or "Focus Assist" on Windows).

*   **`driven`:** All notifications are on.
*   **`flat`:** Only notifications from people are allowed.
*   **`foggy` / `anxious`:** All notifications are silenced, except for those from a few key contacts.
*   **`overstimulated`:** All notifications are silenced, period.

This can be automated as part of your `sync` script, using tools like Apple Shortcuts or webhooks to IFTTT.

## Mid-day Check-ins and Graceful Degradation

Your capacity doesn't just change overnight; it can fluctuate throughout the day. `lifeOS` is designed to accommodate this.

### The Optional Mid-day Check-in

*   After lunch or a significant context switch, you can do a quick, informal check-in.
*   If you're feeling depleted, you can re-declare your state to a lower capacity (e.g., from `flat` to `foggy`).
*   Re-run the `sync` script to adjust your "Today" view for the rest of the day.

### Graceful Degradation in Action

`lifeOS` has a `degradeGracefully` feature for when you don't have the energy to make a conscious choice. You can set up triggers that automatically lower your capacity state.

*   **Example:** You're in a `driven` state, but you've just had a long, draining meeting. You can have a simple script that you run: `lifeos degrade fatigue`. This will automatically shift you from `driven` to `flat`, and the next time you `sync`, your environment will adjust accordingly.
*   These triggers can be tied to specific events, like the end of a long meeting or after a certain number of hours of focused work.

## The End of Day Routine: A Clean Shutdown

The end of the day is just as important as the beginning. The goal is to create a clean shutdown ritual that reinforces the `lifeOS` philosophy.

### What to Do

*   **Review your "Today" view:** Acknowledge what you accomplished, no matter how small.
*   **Clear the "Today" view:** This is a critical step. You can do this by deleting the tasks, moving them back to their original projects, or simply deleting the "Today" tag/list. The point is to end the day with a clean slate.
*   **Do not plan for tomorrow:** Tomorrow's plan will be determined by tomorrow's capacity.

### What Not to Do

*   **Don't create a backlog:** Do not move unfinished tasks to a "tomorrow" list.
*   **Don't review your full task list:** Stick to the modulated view.
*   **Don't beat yourself up:** If you didn't finish everything in your "Today" view, that's okay. The system is designed to be aspirational, not a contract.

By following this routine, you reinforce the idea that your worth is not tied to your productivity. You did what you could with the capacity you had, and that is enough.
