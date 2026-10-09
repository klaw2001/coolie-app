import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { MarkerView } from './MarkerView';
import type { PickMapProps } from './types';

export function PickMap({ initial, onChange, reference }: PickMapProps) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={{ ...initial, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      onRegionChangeComplete={(r) => onChange({ latitude: r.latitude, longitude: r.longitude })}
      showsPointsOfInterests={false}
      toolbarEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}>
      {reference ? (
        <Marker coordinate={reference.coord} anchor={{ x: 0.5, y: 1 }}>
          <MarkerView kind="station" label={reference.label} />
        </Marker>
      ) : null}
    </MapView>
  );
}
