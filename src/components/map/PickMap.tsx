import { DrawnPickMap } from './DrawnMaps';
import { NativePickMap } from './NativeMaps';
import { USE_NATIVE_MAPS } from './provider';
import type { PickMapProps } from './types';

export function PickMap(props: PickMapProps) {
  return USE_NATIVE_MAPS ? <NativePickMap {...props} /> : <DrawnPickMap {...props} />;
}
