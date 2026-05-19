export const WELCOME_ONBOARDING_STORAGE_KEY = "creator-vision-welcome-seen";

export function hasSeenWelcomeOnboarding(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return localStorage.getItem(WELCOME_ONBOARDING_STORAGE_KEY) === "true";
  } catch {
    return true;
  }
}

export function markWelcomeOnboardingSeen(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(WELCOME_ONBOARDING_STORAGE_KEY, "true");
  } catch {
    // ignore storage errors
  }
}
