import { useApp } from '@/store/useApp';
import type { Lang } from '@/store/types';

import { translate, type TFn } from './translate';

export { loc, translate, type TFn, type TKey } from './translate';

export function useT(): TFn {
  const lang = useApp((s) => s.lang);
  return (key, vars) => translate(lang, key, vars);
}

export function useLang(): Lang {
  return useApp((s) => s.lang);
}
