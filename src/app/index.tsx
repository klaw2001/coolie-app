import { Redirect } from 'expo-router';

import { useApp } from '@/store/useApp';

/** Signed-in users land in their own app; everyone else starts at the gateway. */
export default function Index() {
  const session = useApp((s) => s.session);
  const authIntent = useApp((s) => s.authIntent);

  if (session) return <Redirect href={session.app === 'passenger' ? '/home' : '/duty'} />;
  if (authIntent) return <Redirect href={{ pathname: '/login', params: { app: authIntent } }} />;
  return <Redirect href="/gateway" />;
}
