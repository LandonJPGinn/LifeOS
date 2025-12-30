# LifeOS Current Development Cycle

This document outlines the features and improvements being implemented in the current development cycle. Upon completion, this list will be updated to reflect the next set of planned improvements.

## V2 Improvements (Current)

1.  **Enhanced `recommend-state` command:**
    *   The `recommend-state` command will be upgraded to analyze not just the number of tasks and events, but also their properties (priority, cognitive load, intent) to provide a more nuanced and accurate recommendation.

2.  **Inter-day State Memory:**
    *   A local state persistence mechanism (`.lifeos-state.json`) will be introduced to remember the last used capacity state.
    *   The CLI will use this to suggest a default state, making the morning check-in process more seamless.

3.  **`sync` command:**
    *   A new `sync` command will be added to the CLI as a placeholder for future real-world integrations with tools like Asana, Google Calendar, and Obsidian.

4.  **CLI Readability:**
    *   The CLI output will be improved for better readability, using colors and more detailed information to make the daily view more user-friendly.

## Future Improvements

1.  **Real-World Integrations:**
    *   Implement integrations for popular task managers (e.g., Todoist, Asana, Notion) and calendars (e.g., Google Calendar, Outlook).
    *   Create a plugin-based architecture to make it easy to add new integrations.

2.  **Enhanced State Declaration:**
    *   Develop a mobile widget for quick state declaration.
    *   Explore integrations with physical buttons (e.g., Flic, IoT buttons) for a screen-free experience.
    *   Integrate with wearable devices to automatically suggest capacity states based on biometric data (e.g., heart rate variability, sleep patterns).

3.  **Smarter Modulation:**
    *   Use machine learning to learn from a user's behavior and suggest more personalized daily plans.
    *   Allow for more granular control over task and calendar modulation rules.
    *   Introduce the concept of "energy levels" for tasks and events to provide a more accurate daily budget.

4.  **Notification Management:**
    *   Integrate with operating system focus modes (e.g., iOS/macOS Focus, Windows Focus Assist) to automatically silence notifications based on the current capacity state.
    *   Allow for fine-grained control over which notifications are allowed in each state.

5.  **User Interface:**
    *   Create a simple, clean user interface for visualizing the daily plan.
    *   Develop a dashboard for reviewing past capacity states and identifying patterns.
