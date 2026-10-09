import { useT } from '@/i18n';
import { useApp } from '@/store/useApp';

import { Screen, StepBar, StickyFooter, TopBar } from './ui';

export const BOOK_STEPS = 5;

export function BookShell({ step, title, children, footer }: { step: number; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const t = useT();
  const journey = useApp((s) => s.draft.journeyType);
  return (
    <Screen
      keyboard
      header={
        <>
          <TopBar title={title} subtitle={t(`journey.${journey}`)} />
          <StepBar step={step} total={BOOK_STEPS} label={t('book.step', { n: step, total: BOOK_STEPS })} />
        </>
      }
      footer={footer ? <StickyFooter>{footer}</StickyFooter> : undefined}>
      {children}
    </Screen>
  );
}
