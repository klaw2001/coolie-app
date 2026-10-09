import { router } from 'expo-router';
import { useState } from 'react';

import { BookingCard } from '@/components/BookingCard';
import { Empty, Screen, Segmented, TopBar } from '@/components/ui';
import { useT } from '@/i18n';
import { coolieJobs, isLiveForCoolie, useApp } from '@/store/useApp';

export default function Jobs() {
  const t = useT();
  const bookings = useApp((s) => s.bookings);
  const [tab, setTab] = useState<'active' | 'history'>(() => (coolieJobs(bookings).some(isLiveForCoolie) ? 'active' : 'history'));
  const jobs = coolieJobs(bookings).sort((a, b) => b.statusAt - a.statusAt);
  const active = jobs.filter(isLiveForCoolie);
  const history = jobs.filter((b) => !isLiveForCoolie(b));
  const list = tab === 'active' ? active : history;

  return (
    <Screen header={<TopBar title={t('jobs.title')} back={false} />}>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'active', label: `${t('jobs.active')}${active.length ? ` (${active.length})` : ''}` },
          { value: 'history', label: `${t('jobs.history')} (${history.length})` },
        ]}
      />
      {list.length === 0 ? (
        <Empty icon="briefcase-outline" title={t('jobs.empty')} body={t('jobs.emptyBody')} />
      ) : (
        list.map((b) => <BookingCard key={b.id} b={b} coolieView onPress={() => router.push(`/job/${b.id}`)} />)
      )}
    </Screen>
  );
}
