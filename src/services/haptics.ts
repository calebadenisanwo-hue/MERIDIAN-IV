/**
 * Android Haptic Feedback Helper
 * Uses navigator.vibrate with subtle, native-feeling Material Design haptic timings.
 */

export const Haptics = {
  /** Subtle 8ms tap for tab selection, button clicks */
  selection: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(8);
      } catch {}
    }
  },

  /** 15ms light click for toggle, log, checkmark */
  light: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(14);
      } catch {}
    }
  },

  /** 24ms medium tap for FAB, primary actions */
  medium: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(24);
      } catch {}
    }
  },

  /** Success pattern for saving, completing session, milestone */
  success: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([12, 40, 18]);
      } catch {}
    }
  },

  /** Warning / alert pattern for reset, delete, urge spike */
  warning: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([25, 50, 25]);
      } catch {}
    }
  },

  /** Heavy vibration for timer completion / alarm */
  alarm: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([100, 80, 100, 80, 150]);
      } catch {}
    }
  }
};
