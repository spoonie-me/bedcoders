// PostHog Analytics Integration
// Requires VITE_POSTHOG_KEY env var
// Only captures events if user has given analytics consent

import posthog from 'posthog-js';

let initialized = false;
let consentGiven = false;

export function initPostHog() {
  if (initialized) return;

  // Check for existing consent in localStorage
  try {
    const consent = localStorage.getItem('bc_cookie_consent');
    if (consent) {
      const parsed = JSON.parse(consent);
      consentGiven = parsed.analytics === true;
    }
  } catch {
    consentGiven = false;
  }

  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) {
    console.warn('PostHog key not configured (VITE_POSTHOG_KEY)');
    return;
  }

  posthog.init(key, {
    api_host: 'https://eu.posthog.com', // EU data residency per privacy policy
    loaded: (ph: any) => {
      // Only enable if consent given
      if (!consentGiven) {
        ph.opt_out_capturing();
      }
    },
    disable_persistence: !consentGiven,
  });

  initialized = true;
}

export function updateAnalyticsConsent(consent: boolean) {
  consentGiven = consent;
  if (posthog.__loaded) {
    if (consent) {
      posthog.opt_in_capturing();
    } else {
      posthog.opt_out_capturing();
    }
  }
}

export function captureEvent(event: string, properties?: Record<string, any>) {
  if (!consentGiven || !initialized) return;
  posthog.capture(event, properties);
}

// Key events for Bedcoders learning platform

export const analytics = {
  // Learning interactions
  exerciseSubmitted: (exerciseId: string, exerciseType: string, moduleId: string) =>
    captureEvent('exercise_submitted', { exerciseId, exerciseType, moduleId }),

  codeSubmitted: (exerciseId: string, codeLength: number) =>
    captureEvent('code_submitted', { exerciseId, codeLength }),

  feedbackRequested: (exerciseId: string, exerciseType: string) =>
    captureEvent('feedback_requested', { exerciseId, exerciseType }),

  lessonStarted: (lessonId: string, trackId: string) =>
    captureEvent('lesson_started', { lessonId, trackId }),

  lessonCompleted: (lessonId: string, trackId: string, timeSpentSeconds: number) =>
    captureEvent('lesson_completed', { lessonId, trackId, timeSpentSeconds }),

  trackEnrolled: (trackId: string, trackName: string) =>
    captureEvent('track_enrolled', { trackId, trackName }),

  trackCompleted: (trackId: string, trackName: string, certificateEarned: boolean) =>
    captureEvent('track_completed', { trackId, trackName, certificateEarned }),

  // Billing
  subscriptionCreated: (planId: string, currency: string, amount: number) =>
    captureEvent('subscription_created', { planId, currency, amount }),

  subscriptionCancelled: (planId: string) =>
    captureEvent('subscription_cancelled', { planId }),

  // Engagement
  loginSuccessful: (authMethod: string) =>
    captureEvent('login_successful', { authMethod }),

  signupCompleted: () =>
    captureEvent('signup_completed'),

  hintViewed: (exerciseId: string) =>
    captureEvent('hint_viewed', { exerciseId }),

  testPassed: (exerciseId: string, attempts: number) =>
    captureEvent('test_passed', { exerciseId, attempts }),
};
