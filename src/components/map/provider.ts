import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/** True when the app config passes a Google Maps key to the react-native-maps config plugin. */
function hasGoogleMapsKey(): boolean {
  return (Constants.expoConfig?.plugins ?? []).some(
    (p) => Array.isArray(p) && p[0] === 'react-native-maps' && !!(p[1] as { androidGoogleMapsApiKey?: string } | undefined)?.androidGoogleMapsApiKey,
  );
}

/**
 * Real map tiles need a provider. Expo Go ships with its own Google Maps key and iOS uses Apple Maps (no key), so those
 * get react-native-maps. A standalone Android build only gets it once a key is added to app.json; until then the drawn
 * CityMap is used, because Google Maps crashes without a key.
 */
export const USE_NATIVE_MAPS =
  Platform.OS === 'ios' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient || hasGoogleMapsKey();
