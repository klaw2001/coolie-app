import { router, type Href } from 'expo-router';

/** Unwind the stack back to a tab, then optionally open a screen on top (e.g. after booking or paying). */
export function backToTab(tab: '/home' | '/wallet' | '/bookings' | '/duty', then?: Href) {
  router.dismissTo(tab);
  if (then) router.push(then);
}
