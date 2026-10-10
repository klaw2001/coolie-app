import { Platform } from 'react-native';

/** Colours taken from a railway coolie's uniform: the red shirt, white, and the brass arm badge ("billa"). */
export const C = {
  red: '#D3252B',
  redDark: '#A8161C',
  redDeep: '#7A0E12',
  redSoft: '#FCE8E8',
  redTint: '#FFF5F4',
  white: '#FFFFFF',
  bg: '#FBF6F4',
  card: '#FFFFFF',
  ink: '#241616',
  inkSoft: '#5F4B4A',
  muted: '#9B8584',
  line: '#F0E2E0',
  lineStrong: '#E2CDCA',
  brass: '#B98A22',
  brassSoft: '#FBF1D6',
  green: '#15925A',
  greenSoft: '#E2F5EB',
  amber: '#C77D00',
  amberSoft: '#FFF2D8',
  blue: '#2459D6',
  blueSoft: '#E7EEFF',
  overlay: 'rgba(36,22,22,0.5)',
};

/** Coolie Partner app: the same uniform red, set against a dark, night-shift background. */
export const PC = {
  night: '#1A1011',
  night2: '#2B1517',
  night3: '#3A2022',
  nightLine: 'rgba(255,255,255,0.12)',
  nightText: 'rgba(255,255,255,0.72)',
  brassLight: '#E8C468',
  online: '#16A34A',
  onlineLight: '#4ADE80',
};

export const R = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };

export const F = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extrabold: 'Poppins_800ExtraBold',
};

export const shadow = {
  sm: { boxShadow: '0px 2px 8px rgba(122, 14, 18, 0.07)' },
  md: { boxShadow: '0px 6px 18px rgba(122, 14, 18, 0.10)' },
  lg: { boxShadow: '0px 12px 32px rgba(122, 14, 18, 0.16)' },
} as const;

export const isWeb = Platform.OS === 'web';
