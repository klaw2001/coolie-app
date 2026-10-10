import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { loc, useLang } from '@/i18n';
import type { LatLng } from '@/store/types';
import { C } from '@/theme';

import { Txt } from '../ui';
import { MarkerView } from './MarkerView';
import type { MapMarker } from './types';
import { drawCity, fitCam, MAP_COLORS as M, MAX_S, MIN_S, project, toLatLng, type Cam, type Frame, type Pad } from './world';

export interface CityCamera {
  /** The map re-frames itself whenever this changes (like fitToCoordinates on a real map). */
  key: string;
  points: LatLng[];
  padding?: Pad;
  /** Pixels per metre when there is only one point to show. */
  zoom?: number;
}

interface Props {
  camera: CityCamera;
  markers?: MapMarker[];
  route?: LatLng[];
  interactive?: boolean;
  onMoveEnd?: (center: LatLng) => void;
  style?: StyleProp<ViewStyle>;
}

const NO_PAD: Pad = { top: 40, right: 40, bottom: 40, left: 40 };
const IDLE = { tx: 0, ty: 0, k: 1 };
/** Draw order: plain points under places under the selected point. */
const LAYER: Record<MapMarker['kind'], number> = { point: 0, station: 1, home: 1, pickup: 1, drop: 1, 'point-selected': 2, coolie: 3 };
/** Overscan on each side, as a fraction of the viewport. */
const OVER = 0.5;

/**
 * A drawn city map (no map SDK or API key). Drag to pan, pinch to zoom; markers and routes sit on top like on a real map.
 */
export function CityMap({ camera, markers = [], route, interactive = true, onMoveEnd, style }: Props) {
  const lang = useLang();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const sig = `${camera.key}|${size.w}x${size.h}`;
  // The camera is framed once per key/size and then only moves when the user drags it.
  const [held, setHeld] = useState<{ sig: string; cam: Cam; moved?: boolean } | null>(null);
  const [gesture, setGesture] = useState(IDLE);
  let cam = held?.cam ?? null;
  if (size.w > 0 && held?.sig !== sig) {
    const pad = camera.padding ?? NO_PAD;
    // Pins hang above their point with a label on top, so leave them room at the top edge.
    const room = camera.points.length > 1 ? Math.min(44, size.h * 0.1) : 0;
    cam = fitCam(camera.points, size.w, size.h, { ...pad, top: pad.top + room }, camera.zoom ?? 0.5);
    setHeld({ sig, cam });
  }

  const ox = Math.round(size.w * OVER), oy = Math.round(size.h * OVER);
  const frame: Frame | null = useMemo(() => (cam ? { cam, w: size.w, h: size.h, ox, oy } : null), [cam, size.w, size.h, ox, oy]);
  const drawing = useMemo(() => (frame ? drawCity(frame) : null), [frame]);

  // Tell the screen where the user moved the map to (not when the map frames itself).
  useEffect(() => {
    if (held?.moved) onMoveEnd?.(toLatLng(held.cam.x, held.cam.y, held.cam.kx));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [held]);

  const [responder] = useState(() => {
    let cur = IDLE;
    let base = { n: 0, k: 1, tx: 0, ty: 0, x: 0, y: 0, d: 1 };
    const point = (e: GestureResponderEvent, g: PanResponderGestureState) => {
      const ts = e.nativeEvent.touches ?? [];
      if (ts.length >= 2) {
        const [a, b] = ts;
        return { n: 2, x: (a.pageX + b.pageX) / 2, y: (a.pageY + b.pageY) / 2, d: Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY) };
      }
      return { n: 1, x: g.moveX || g.x0, y: g.moveY || g.y0, d: 1 };
    };
    const end = () => {
      const g = cur;
      cur = IDLE;
      base = { ...base, n: 0 };
      setGesture(IDLE);
      if (g.tx === 0 && g.ty === 0 && g.k === 1) return;
      setHeld((h) => {
        if (!h) return h;
        const sc = Math.min(MAX_S, Math.max(MIN_S, h.cam.s * g.k));
        return { sig: h.sig, moved: true, cam: { ...h.cam, s: sc, x: h.cam.x - g.tx / sc, y: h.cam.y + g.ty / sc } };
      });
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 6,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (_, g) => {
        cur = IDLE;
        base = { n: 1, k: 1, tx: 0, ty: 0, x: g.x0, y: g.y0, d: 1 };
      },
      onPanResponderMove: (e, g) => {
        const p = point(e, g);
        if (p.n !== base.n) base = { n: p.n, k: cur.k, tx: cur.tx, ty: cur.ty, x: p.x, y: p.y, d: Math.max(1, p.d) };
        // Pinch zooms about the map centre; moving the fingers pans.
        const r = p.n === 2 ? Math.min(6 / base.k, Math.max(0.2 / base.k, p.d / base.d)) : 1;
        cur = { k: base.k * r, tx: r * base.tx + (p.x - base.x), ty: r * base.ty + (p.y - base.y) };
        setGesture(cur);
      },
      onPanResponderRelease: end,
      onPanResponderTerminate: end,
    });
  });

  const routeD =
    frame && route && route.length > 1
      ? route
          .map((p, i) => {
            const q = project(frame, p);
            return `${i ? 'L' : 'M'}${q.X.toFixed(1)},${q.Y.toFixed(1)}`;
          })
          .join('')
      : '';
  const cw = size.w + 2 * ox, ch = size.h + 2 * oy;
  // Area names step aside for pins.
  const pins = frame ? markers.map((m) => project(frame, m.coord)) : [];
  const camKey = cam ? `${cam.x}|${cam.y}|${cam.s}` : '';

  return (
    <View
      style={[s.root, style]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (Math.round(width) !== size.w || Math.round(height) !== size.h) setSize({ w: Math.round(width), h: Math.round(height) });
      }}
      {...(interactive ? responder.panHandlers : null)}>
      {frame && drawing ? (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            left: -ox,
            top: -oy,
            width: cw,
            height: ch,
            transform: [{ translateX: gesture.tx }, { translateY: gesture.ty }, { scale: gesture.k }],
          }}>
          <Svg width={cw} height={ch} pointerEvents="none">
            <Path d={drawing.blocks} fill={M.block} stroke={M.block} strokeWidth={4} strokeLinejoin="round" />
            <Path d={drawing.blocks2} fill={M.block2} stroke={M.block2} strokeWidth={4} strokeLinejoin="round" />
            <Path d={drawing.parks} fill={M.park} stroke={M.park} strokeWidth={6} strokeLinejoin="round" />
            <Path d={drawing.water} fill={M.water} />
            <Path d={drawing.trees} fill={M.tree} />
            <Path d={drawing.minor} stroke={M.street} strokeWidth={5} strokeLinecap="round" fill="none" />
            <Path d={drawing.majorCase} stroke={M.majorCase} strokeWidth={11} strokeLinecap="round" fill="none" />
            <Path d={drawing.avenueCase} stroke={M.avenueCase} strokeWidth={13} strokeLinecap="round" fill="none" />
            <Path d={drawing.major} stroke={M.street} strokeWidth={8} strokeLinecap="round" fill="none" />
            <Path d={drawing.avenue} stroke={M.avenue} strokeWidth={10} strokeLinecap="round" fill="none" />
            <Path d={drawing.plaza} fill={M.plaza} stroke={M.plaza} strokeWidth={24} strokeLinejoin="round" />
            <Path d={drawing.railBed} stroke={M.railBed} strokeWidth={drawing.railBedWidth} fill="none" />
            <Path d={drawing.ties} stroke={M.tie} strokeWidth={9} strokeDasharray="1.6,5" fill="none" />
            <Path d={drawing.rails} stroke={M.rail} strokeWidth={1.4} fill="none" />
            <Path d={drawing.precinct} fill={M.precinct} stroke={M.precinctLine} strokeWidth={1.5} strokeLinejoin="round" />
            <Path d={drawing.tracks} stroke={M.rail} strokeWidth={1.2} fill="none" />
            <Path d={drawing.platforms} stroke={M.platform} strokeWidth={drawing.platformWidth} strokeLinecap="round" fill="none" />
            <Path d={drawing.concourse} fill={M.concourse} stroke={M.concourse} strokeWidth={3} strokeLinejoin="round" />
            <Path d={drawing.train} stroke={M.train} strokeWidth={drawing.trainWidth} strokeLinecap="round" fill="none" />
            <Path d={drawing.engine} stroke={M.engine} strokeWidth={drawing.trainWidth} strokeLinecap="round" fill="none" />
            {routeD ? (
              <>
                <Path d={routeD} stroke={C.white} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <Path d={routeD} stroke={C.red} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </>
            ) : null}
          </Svg>

          {drawing.labels.filter((l) => !pins.some((q) => Math.abs(q.X - l.X) < 70 && l.Y - q.Y < 24 && q.Y - l.Y < 70)).map((l) => (
            <View key={l.key} pointerEvents="none" style={[s.label, { left: l.X - 80, top: l.Y - 9 }]}>
              <Txt v="tiny" size={10} weight="semibold" color={M.label} numberOfLines={1} style={s.labelText}>
                {loc(lang, l.area.name, l.area.nameHi)}
              </Txt>
            </View>
          ))}

          {markers
            .filter((m) => m.kind !== 'coolie')
            .sort((a, b) => LAYER[a.kind] - LAYER[b.kind])
            .map((m) => {
              const q = project(frame, m.coord);
              const body = <MarkerView kind={m.kind} label={m.label} icon={m.icon} />;
              return (
                <View key={m.id} pointerEvents="box-none" style={[s.pin, { left: q.X - 80, bottom: ch - q.Y }]}>
                  {m.onPress ? (
                    <Pressable onPress={m.onPress} hitSlop={8}>
                      {body}
                    </Pressable>
                  ) : (
                    body
                  )}
                </View>
              );
            })}
          {markers
            .filter((m) => m.kind === 'coolie')
            .map((m) => {
              const q = project(frame, m.coord);
              return (
                <Glide key={m.id} x={q.X - 23} y={q.Y - 23} snap={camKey}>
                  <MarkerView kind="coolie" />
                </Glide>
              );
            })}
        </View>
      ) : null}
    </View>
  );
}

/** Slides a marker to each new position over a second (the trip simulation ticks once a second), and jumps when the camera changes. */
function Glide({ x, y, snap, children }: { x: number; y: number; snap: string; children: React.ReactNode }) {
  const [pos] = useState(() => new Animated.ValueXY({ x, y }));
  const lastSnap = useRef(snap);
  useEffect(() => {
    if (lastSnap.current !== snap) {
      lastSnap.current = snap;
      pos.setValue({ x, y });
      return;
    }
    const a = Animated.timing(pos, { toValue: { x, y }, duration: 950, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' });
    a.start();
    return () => a.stop();
  }, [x, y, snap, pos]);
  return (
    <Animated.View pointerEvents="none" style={[s.glide, { transform: pos.getTranslateTransform() }]}>
      {children}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { overflow: 'hidden', backgroundColor: M.land },
  label: { position: 'absolute', width: 160, alignItems: 'center' },
  labelText: { letterSpacing: 1.2, textTransform: 'uppercase' },
  pin: { position: 'absolute', width: 160, alignItems: 'center' },
  glide: { position: 'absolute', left: 0, top: 0 },
});
