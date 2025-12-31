# Welcome to lifeOS!

lifeOS is a special kind of productivity app. It's designed to help you on days when you feel overwhelmed, anxious, or just not at your best. Instead of showing you a giant to-do list, lifeOS adapts to *you*.

## How it Works

The main idea is simple: you tell lifeOS how you're feeling, and it adjusts your day to match. It's like having a smart assistant who knows when to push you and when to give you a break.

### Your "Capacity State"

The first step is to choose your "capacity state" for the day. This is just a word to describe your mental energy. Here are the options:

*   **driven:** You feel great and are ready to tackle anything.
*   **flat:** You're not feeling amazing, but you can still get things done.
*   **foggy:** Your head is a bit cloudy, and it's hard to focus.
*   **anxious:** You're feeling stressed or worried.
*   **overstimulated:** Everything feels like too much.

## Getting Started

To use lifeOS, you'll need to open a terminal (also known as a command line). It's a way to talk to your computer with text commands. Once you have a terminal open, you can use the commands below.

### CLI Commands

Here's a quick guide to the commands you can use with lifeOS:

| Command | What it does |
| :--- | :--- |
| `lifeos set-capacity <state>` | Sets your capacity for the day. For example, `lifeos set-capacity foggy`. |
| `lifeos view` or `lifeos status` | Shows you a summary of your day, based on your current capacity. |
| `lifeos focus` | Shows you the very next thing you should focus on. |
| `lifeos recommend-state` | lifeOS will guess your capacity based on your tasks and events. |
| `lifeos degrade` | Lowers your capacity to the next level down. |
| `lifeos sync` | (Coming soon!) This will connect to your other apps, like your to-do list and calendar. |

## A Typical Day with lifeOS

1.  **Morning Check-in:** In the morning, you open your terminal and type `lifeos set-capacity flat`.
2.  **See Your Day:** lifeOS will then show you a short, manageable list of tasks and events for the day. It hides the rest, so you don't feel overwhelmed.
3.  **Stay Focused:** If you're not sure what to do next, you can type `lifeos focus` to see your next task or appointment.
4.  **Feeling Tired?:** If you start to feel tired in the afternoon, you can type `lifeos degrade`. This will lower your capacity and might hide some of your remaining tasks.

That's it! The goal of lifeOS is to help you feel in control of your day, no matter what's going on in your head.
