import { router } from 'expo-router';
import { useState } from 'react';

import { BookingCard } from '@/components/BookingCard';
import { PartnerTopBar } from '@/components/PartnerTopBar';
import { Empty, Screen, Segmented } from '@/components/ui';
import { useT } from '@/i18n';
import { coolieJobs, isLiveFor, useApp, useCoolie } from '@/store/useApp';

export default function Jobs() {
  const t = useT();
  const me = useCoolie();
  const bookings = useApp((s) => s.bookings);
  const live = isLiveFor(me?.id);
  const [tab, setTab] = useState<'active' | 'history'>(() => (coolieJobs(bookings, me?.id).some(live) ? 'active' : 'history'));
  const jobs = coolieJobs(bookings, me?.id).sort((a, b) => b.statusAt - a.statusAt);
  const active = jobs.filter(live);
  const history = jobs.filter((b) => !live(b));
  const list = tab === 'active' ? active : history;

  return (
    <Screen edges={[]} header={<PartnerTopBar title={t('jobs.title')} back={false} />}>
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
