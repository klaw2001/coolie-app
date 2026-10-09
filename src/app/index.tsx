import { Redirect } from 'expo-router';

import { useApp } from '@/store/useApp';

/** Sends people to the right place: onboarding, login, role choice, profile setup, or their home tab. */
export default function Index() {
  const onboarded = useApp((s) => s.onboarded);
  const loggedIn = useApp((s) => s.loggedIn);
  const role = useApp((s) => s.role);
  const hasPassenger = useApp((s) => !!s.passenger);
  const hasCoolie = useApp((s) => !!s.coolie);

  if (!onboarded) return <Redirect href="/welcome" />;
  if (!loggedIn) return <Redirect href="/login" />;
  if (!role) return <Redirect href="/role" />;
  if (role === 'passenger') return hasPassenger ? <Redirect href="/home" /> : <Redirect href="/setup?role=passenger" />;
  return hasCoolie ? <Redirect href="/duty" /> : <Redirect href="/setup?role=coolie" />;
}
