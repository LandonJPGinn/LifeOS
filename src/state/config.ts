/**
 * LifeOS Default State Configurations
 * 
 * Pre-configured settings for each capacity state.
 * System owns daily expectations - no user configuration required.
 */

import type { StateConfigMap } from '../types/index.js';

/**
 * Default configurations for all capacity states.
 * 
 * Philosophy:
 * - foggy: Minimal demands, maximum protection (DEFAULT)
 * - anxious: Reduced stimulation, essential only
 * - flat: Gentle engagement, small wins
 * - overstimulated: Maximum protection, recovery focus
 * - driven: Full capacity, all systems go
 */
export const DEFAULT_STATE_CONFIGS: StateConfigMap = {
  foggy: {
    state: 'foggy',
    description: 'Low clarity, minimal cognitive resources. Safe defaults active.',
    taskVisibility: {
      visiblePriorities: ['essential'],
      manageableLoads: ['minimal', 'low'],
      maxVisibleTasks: 3
    },
    calendarIntent: {
      honoredIntents: ['essential', 'recovery'],
      suggestCancellation: true,
      addRecoveryBuffers: true,
      bufferMinutes: 30
    },
    workload: {
      maxDailyMinutes: 60,
      maxCalendarHours: 2,
      showWorkTasks: true,
      showPersonalTasks: false,
      energyBudget: 3
    },
    fallback: {
      fallbackState: 'foggy',
      canAutoDegrade: false,
      degradeTriggers: []
    }
  },

  anxious: {
    state: 'anxious',
    description: 'High stress/worry. Reduced stimulation, essential tasks only.',
    taskVisibility: {
      visiblePriorities: ['essential'],
      manageableLoads: ['minimal'],
      maxVisibleTasks: 2
    },
    calendarIntent: {
      honoredIntents: ['essential', 'recovery', 'flexible'],
      suggestCancellation: true,
      addRecoveryBuffers: true,
      bufferMinutes: 45
    },
    workload: {
      maxDailyMinutes: 45,
      maxCalendarHours: 1,
      showWorkTasks: true,
      showPersonalTasks: false,
      energyBudget: 2
    },
    fallback: {
      fallbackState: 'foggy',
      canAutoDegrade: true,
      degradeTriggers: ['overwhelm', 'panic', 'shutdown']
    }
  },

  flat: {
    state: 'flat',
    description: 'Low energy/motivation. Gentle engagement with small wins.',
    taskVisibility: {
      visiblePriorities: ['essential', 'important'],
      manageableLoads: ['minimal', 'low'],
      maxVisibleTasks: 4
    },
    calendarIntent: {
      honoredIntents: ['essential', 'recovery', 'flexible', 'collaborative'],
      suggestCancellation: false,
      addRecoveryBuffers: true,
      bufferMinutes: 20
    },
    workload: {
      maxDailyMinutes: 90,
      maxCalendarHours: 3,
      showWorkTasks: true,
      showPersonalTasks: true,
      energyBudget: 4
    },
    fallback: {
      fallbackState: 'foggy',
      canAutoDegrade: true,
      degradeTriggers: ['exhaustion', 'withdrawal']
    }
  },

  overstimulated: {
    state: 'overstimulated',
    description: 'Sensory/cognitive overload. Maximum protection, recovery focus.',
    taskVisibility: {
      visiblePriorities: ['essential'],
      manageableLoads: ['minimal'],
      maxVisibleTasks: 1
    },
    calendarIntent: {
      honoredIntents: ['essential', 'recovery'],
      suggestCancellation: true,
      addRecoveryBuffers: true,
      bufferMinutes: 60
    },
    workload: {
      maxDailyMinutes: 30,
      maxCalendarHours: 1,
      showWorkTasks: false,
      showPersonalTasks: false,
      energyBudget: 1
    },
    fallback: {
      fallbackState: 'foggy',
      canAutoDegrade: true,
      degradeTriggers: ['meltdown', 'shutdown', 'overwhelm']
    }
  },

  driven: {
    state: 'driven',
    description: 'High capacity. Full workload available, all systems active.',
    taskVisibility: {
      visiblePriorities: ['essential', 'important', 'normal', 'optional'],
      manageableLoads: ['minimal', 'low', 'medium', 'high'],
      maxVisibleTasks: 15
    },
    calendarIntent: {
      honoredIntents: ['focus', 'collaborative', 'recovery', 'transition', 'flexible', 'essential'],
      suggestCancellation: false,
      addRecoveryBuffers: false,
      bufferMinutes: 10
    },
    workload: {
      maxDailyMinutes: 480,
      maxCalendarHours: 8,
      showWorkTasks: true,
      showPersonalTasks: true,
      energyBudget: 10
    },
    fallback: {
      fallbackState: 'flat',
      canAutoDegrade: true,
      degradeTriggers: ['fatigue', 'distraction', 'depletion']
    }
  },

  productive: {
    state: 'productive',
    description: 'Peak capacity. Ready for a challenging workload.',
    taskVisibility: {
      visiblePriorities: ['essential', 'important', 'normal', 'optional'],
      manageableLoads: ['minimal', 'low', 'medium', 'high'],
      maxVisibleTasks: 25
    },
    calendarIntent: {
      honoredIntents: ['focus', 'collaborative', 'recovery', 'transition', 'flexible', 'essential'],
      suggestCancellation: false,
      addRecoveryBuffers: false,
      bufferMinutes: 5
    },
    workload: {
      maxDailyMinutes: 600,
      maxCalendarHours: 10,
      showWorkTasks: true,
      showPersonalTasks: true,
      energyBudget: 12
    },
    fallback: {
      fallbackState: 'driven',
      canAutoDegrade: true,
      degradeTriggers: ['burnout', 'overextension', 'fatigue']
    }
  },

  social: {
    state: 'social',
    description: 'Ready for social engagements. Prioritizes connection over tasks.',
    taskVisibility: {
      visiblePriorities: ['essential', 'important'],
      manageableLoads: ['minimal', 'low'],
      maxVisibleTasks: 5
    },
    calendarIntent: {
      honoredIntents: ['essential', 'collaborative', 'recovery', 'flexible'],
      suggestCancellation: false,
      addRecoveryBuffers: true,
      bufferMinutes: 15
    },
    workload: {
      maxDailyMinutes: 120,
      maxCalendarHours: 6,
      showWorkTasks: false,
      showPersonalTasks: true,
      energyBudget: 7
    },
    fallback: {
      fallbackState: 'flat',
      canAutoDegrade: true,
      degradeTriggers: ['social fatigue', 'overwhelmed', 'withdrawal']
    }
  }
};
