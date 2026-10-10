import { router } from 'expo-router';
import { useState } from 'react';

import { BookingCard } from '@/components/BookingCard';
import { Empty, Screen, Segmented, TopBar } from '@/components/ui';
import { ACTIVE } from '@/data/journey';
import { useT } from '@/i18n';
import { passengerBookings, useApp, usePassenger } from '@/store/useApp';

export default function Bookings() {
  const t = useT();
  const bookings = useApp((s) => s.bookings);
  const me = usePassenger();
  const startDraft = useApp((s) => s.startDraft);
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const mine = passengerBookings(bookings, me?.id);
  const active = mine.filter((b) => ACTIVE.includes(b.status) || b.status === 'scheduled').sort((a, b) => b.createdAt - a.createdAt);
  const past = mine.filter((b) => b.status === 'completed' || b.status === 'cancelled').sort((a, b) => b.createdAt - a.createdAt);
  const list = tab === 'active' ? active : past;

  return (
    <Screen header={<TopBar title={t('bookings.title')} back={false} />}>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'active', label: `${t('bookings.active')}${active.length ? ` (${active.length})` : ''}` },
          { value: 'past', label: t('bookings.past') },
        ]}
      />
      {list.length === 0 ? (
        tab === 'active' ? (
          <Empty
            icon="bag-suitcase-outline"
            title={t('bookings.emptyActive')}
            body={t('bookings.emptyActiveBody')}
            action={{
              title: t('bookings.bookNow'),
              onPress: () => {
                startDraft('gate_to_train');
                router.push('/book/train');
              },
            }}
          />
        ) : (
          <Empty icon="history" title={t('bookings.emptyPast')} />
        )
      ) : (
        list.map((b) => (
          <BookingCard key={b.id} b={b} onPress={() => router.push(ACTIVE.includes(b.status) ? `/trip/${b.id}` : `/booking/${b.id}`)} />
        ))
      )}
    </Screen>
  );
}
