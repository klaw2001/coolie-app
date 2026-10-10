import { DrawnTripMap } from './DrawnMaps';
import { NativeTripMap } from './NativeMaps';
import { USE_NATIVE_MAPS } from './provider';
import type { TripMapProps } from './types';

export function TripMap(props: TripMapProps) {
  return USE_NATIVE_MAPS ? <NativeTripMap {...props} /> : <DrawnTripMap {...props} />;
}
