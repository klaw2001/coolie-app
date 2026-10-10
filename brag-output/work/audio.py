# Synthesizes the soundtrack (music + sound effects) for the Coolie video, timed to composition/index.html.
# 120 BPM, D major. Everything is generated here with numpy: no samples.
import wave
import numpy as np

SR = 44100
DUR = 30.0
N = int(SR * DUR)
rng = np.random.default_rng(7)

BEAT = 0.5
STEP = BEAT / 4  # 16th note
GROOVE = 3.0  # the beat drops here; bars every 2 s after this

def hz(note):
    names = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
    n, o = note[:-1], int(note[-1])
    return 440.0 * 2 ** ((names[n] + 12 * (o + 1) - 69) / 12)

def addp(*sigs):
    """Sum signals of different lengths."""
    out = np.zeros(max(len(x) for x in sigs))
    for x in sigs: out[: len(x)] += x
    return out

def track():
    return np.zeros((2, N))

def put(buf, t, sig, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N: return
    sig = sig[: N - i] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(sig)] += sig * l * 1.414
    buf[1, i:i + len(sig)] += sig * r * 1.414

def tvec(d):
    return np.arange(int(d * SR)) / SR

def adsr(n, a=0.005, d=0.1, s=0.0, r=0.05, hold=None):
    t = np.arange(n) / SR
    env = np.minimum(1, t / max(a, 1e-4))
    dec = s + (1 - s) * np.exp(-(t - a).clip(0) / max(d, 1e-4))
    env = np.where(t < a, env, dec)
    if hold is not None:
        rel = np.exp(-(t - hold).clip(0) / max(r, 1e-4))
        env = np.where(t > hold, env * rel, env)
    return env

def band(sig, lo, hi, soft=0.15):
    """Band-pass by masking the spectrum (fine for short one-shots)."""
    S = np.fft.rfft(sig)
    f = np.fft.rfftfreq(len(sig), 1 / SR)
    m = 1 / (1 + np.exp(-(f - lo) / (lo * soft + 1))) * (1 / (1 + np.exp((f - hi) / (hi * soft + 1))))
    return np.fft.irfft(S * m, len(sig))

def additive(f, d, harmonics, amp_fn, detune=0.0):
    t = tvec(d)
    out = np.zeros_like(t)
    for k in range(1, harmonics + 1):
        if f * k > 16000: break
        out += amp_fn(k) * np.sin(2 * np.pi * f * k * t * (1 + detune * (k % 3 - 1)))
    return out

# ---------------- instruments ----------------
def kick(gain=1.0):
    t = tvec(0.42)
    f = 46 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.16)
    click = band(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t / 0.004) * 0.25
    return (body + click) * gain

def clap():
    t = tvec(0.35)
    n = rng.standard_normal(len(t))
    env = np.zeros_like(t)
    for k, off in enumerate([0, 0.009, 0.019, 0.03]):
        env += (t >= off) * np.exp(-(t - off).clip(0) / (0.006 if k < 3 else 0.09))
    return band(n, 900, 3800) * env * 0.6

def shaker(acc=1.0):
    t = tvec(0.09)
    n = rng.standard_normal(len(t))
    env = np.minimum(1, t / 0.012) * np.exp(-t / 0.03)
    return band(n, 5500, 14000) * env * 0.5 * acc

def tabla(kind='na', pitch='D5'):
    """Hand-drum strokes: 'na' rings (pitched treble drum), 'ge' is the bass drum with its upward glide, 'dha' both."""
    out = np.zeros(int(0.6 * SR))
    t = tvec(0.6)
    if kind in ('na', 'dha'):
        f0 = hz(pitch)
        ring = sum(a * np.sin(2 * np.pi * f0 * m * t) * np.exp(-t / dcy) for m, a, dcy in [(1, 1, 0.22), (2.0, 0.5, 0.12), (3.0, 0.35, 0.08), (4.1, 0.2, 0.05)])
        hit = band(rng.standard_normal(len(t)), 2000, 9000) * np.exp(-t / 0.006) * 0.4
        out += (ring * 0.6 + hit) * (0.7 if kind == 'dha' else 1)
    if kind in ('ge', 'dha'):
        f = hz('D2') * (1 + 0.35 * (1 - np.exp(-t / 0.12)))  # the bayan's characteristic upward glide
        ph = 2 * np.pi * np.cumsum(f) / SR
        out += np.sin(ph) * np.exp(-t / 0.3) * 0.9
    return out

def ks_pluck(f, d=1.2, bright=0.6, decay=0.996, buzz=0.0):
    """Karplus-Strong plucked string, vectorized one period at a time. Optional 'jawari' buzz for a sitar-ish tone."""
    n = int(d * SR)
    period = max(2, int(round(SR / f)))
    y = np.zeros(n + period)
    exc = rng.uniform(-1, 1, period)
    exc = bright * exc + (1 - bright) * np.convolve(exc, np.ones(4) / 4, mode='same')
    exc -= exc.mean()
    y[:period] = exc
    k = period
    while k < n:
        prev = y[k - period:k]
        shifted = np.concatenate(([y[k - period - 1] if k - period - 1 >= 0 else 0.0], prev[:-1]))
        seg = decay * 0.5 * (prev + shifted)
        y[k:k + period] = seg[: len(y) - k]
        k += period
    y = y[:n]
    if buzz:
        y = np.tanh(y * (1 + buzz * 3)) / np.tanh(1 + buzz * 3)
    fade = np.minimum(1, (n - np.arange(n)) / (0.05 * SR))
    return y * fade

def sitar(note, d=1.1, vel=1.0):
    f = hz(note)
    s = addp(ks_pluck(f, d, bright=0.8, decay=0.9975, buzz=0.35),
             0.35 * ks_pluck(f * 2.0, d * 0.7, bright=0.7, decay=0.995))  # sympathetic octave shimmer
    return s * vel * 0.55

def bass(note, d=0.24, dark=False):
    f = hz(note)
    t = tvec(d)
    cutoff_h = 3 if dark else 7
    s = additive(f, d, cutoff_h, lambda k: (1 / k) * (1 if k == 1 else np.exp(-(k - 1) * 0.35)))
    env = adsr(len(t), 0.004, 0.18, 0.35, 0.03, hold=d - 0.03)
    return s * env * 0.6

def pad(notes, d, dark=False):
    t = tvec(d)
    out = np.zeros_like(t)
    for n in notes:
        f = hz(n)
        h = 4 if dark else 9
        for det in (-0.004, 0.004):
            out += additive(f * (1 + det), d, h, lambda k: (1 / k) ** 1.4)
    env = np.minimum(1, t / 0.25) * np.minimum(1, (d - t) / 0.3)
    trem = 1 + 0.06 * np.sin(2 * np.pi * 4.5 * t)
    return out * env * trem / (len(notes) * 2)

def stab(notes, d=0.22, dark=False):
    """Electric-piano style stab: a sine pair per note with a fast-decaying bell partial."""
    t = tvec(d + 0.25)
    out = np.zeros_like(t)
    for n in notes:
        f = hz(n)
        out += np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.08)
        if not dark: out += 0.18 * np.sin(2 * np.pi * 7 * f * t) * np.exp(-t / 0.02)
    env = adsr(len(t), 0.003, 0.16, 0.25, 0.08, hold=d)
    return out * env / len(notes)

def tanpura(d, root='D2'):
    """Drone on Pa (A) and Sa (D) with the tanpura's buzzy, beating overtones."""
    t = tvec(d)
    out = np.zeros_like(t)
    for note, a in ((root, 1.0), ('A2', 0.7), ('D3', 0.8)):
        f = hz(note)
        for k in range(1, 16):
            amp = a * (1 / k) * (0.6 + 0.4 * np.sin(2 * np.pi * (0.13 + 0.07 * k) * t + k))
            out += amp * np.sin(2 * np.pi * f * k * t * (1 + 0.0007 * (k % 2)))
    return out / 10

def noise_sweep(d, f0, f1, rising=True):
    t = tvec(d)
    n = rng.standard_normal(len(t))
    out = np.zeros_like(t)
    seg = int(0.02 * SR)
    for i in range(0, len(t), seg):
        p = i / len(t)
        fc = f0 * (f1 / f0) ** p
        chunk = n[i:i + seg]
        out[i:i + seg] = band(np.pad(chunk, (0, seg - len(chunk))), fc * 0.6, fc * 1.6)[: len(chunk)]
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** (1.5 if rising else 0.8)
    if rising: env *= np.linspace(0.3, 1, len(t))
    return out * env

def bell(note, d=1.2):
    f = hz(note)
    t = tvec(d)
    return sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / dc) for m, a, dc in [(1, 1, 0.5), (2.76, 0.35, 0.18), (5.4, 0.15, 0.07)])

# ---------------- arrangement ----------------
drums, perc, bassT, keys, lead, padT, drone, fx = (track() for _ in range(8))
duck = np.ones(N)

def bar_t(b):  # bar index 0 = 3.0 s
    return GROOVE + b * 2.0

CHORDS = {
    'D': ['D3', 'F#3', 'A3', 'D4'], 'Bm': ['B2', 'D3', 'F#3', 'B3'], 'G': ['G2', 'B2', 'D3', 'G3'], 'A': ['A2', 'C#3', 'E3', 'A3'],
}
ROOT = {'D': 'D2', 'Bm': 'B1', 'G': 'G1', 'A': 'A1'}
STAB = {'D': ['F#4', 'A4', 'D5'], 'Bm': ['F#4', 'B4', 'D5'], 'G': ['G4', 'B4', 'D5'], 'A': ['E4', 'A4', 'C#5']}
PROG = ['D', 'Bm', 'G', 'A', 'D', 'Bm', 'G', 'A', 'Bm', 'G', 'A']  # bars 0..10 (3 s → 25 s)

# Hook (0–3 s): thud, drone, rising plucks, tabla roll into the drop.
put(fx, 0.40, addp(kick(1.0) * 0.9, tabla('ge') * 0.5), 0.95)
put(fx, 0.40, band(rng.standard_normal(int(0.25 * SR)), 60, 400) * np.exp(-tvec(0.25) / 0.05), 0.35)
put(drone, 0.38, tanpura(2.7) * np.minimum(1, tvec(2.7) / 0.5) * np.minimum(1, (2.7 - tvec(2.7)) / 0.3), 0.55)
put(fx, 1.45, noise_sweep(0.5, 400, 4000), 0.18)
for k, (tt, nn) in enumerate([(1.62, 'D4'), (1.78, 'A4'), (1.94, 'D5')]):
    put(lead, tt, sitar(nn, 1.0), 0.75, pan=-0.2 + 0.2 * k)
roll = []
tt = 2.05
gap = 0.125
while tt < 2.96:
    roll.append(tt)
    gap = max(0.045, gap * 0.86)
    tt += gap
for i, tt in enumerate(roll):
    v = 0.25 + 0.75 * (i / len(roll))
    put(perc, tt, tabla('na', 'D5' if i % 2 else 'A4'), 0.35 * v, pan=0.25 if i % 2 else -0.25)
put(fx, 2.2, noise_sweep(0.8, 300, 9000), 0.16)
put(fx, 2.78, noise_sweep(0.5, 2000, 500, rising=False), 0.12)  # red shrinks into the icon

# Groove (3–25 s)
for b, ch in enumerate(PROG):
    t0 = bar_t(b)
    partner = b >= 8
    build = b == 10
    # drums
    for s in ([0, 6, 8, 14] if not partner else [0, 8, 11]):
        put(drums, t0 + s * STEP, kick(), 0.95)
        i = int((t0 + s * STEP) * SR)
        L = int(0.22 * SR)
        duck[i:i + L] = np.minimum(duck[i:i + L], 1 - 0.55 * np.exp(-np.arange(min(L, N - i)) / (0.07 * SR)))
    for s in (4, 12):
        put(drums, t0 + s * STEP, clap(), 0.5 if not partner else 0.35)
    if not partner:
        for s in range(16):
            acc = 1.0 if s % 4 == 2 else 0.55 if s % 2 == 0 else 0.3
            put(perc, t0 + s * STEP, shaker(acc), 0.22, pan=0.35)
    for s, kind, p in [(3, 'na', 'D5'), (10, 'na', 'A4'), (15, 'dha', 'D5')]:
        put(perc, t0 + s * STEP, tabla(kind, p), 0.22 if not partner else 0.18, pan=-0.3)
    if build:
        for s in range(8, 16):
            put(perc, t0 + s * STEP, tabla('na', 'D5' if s % 2 else 'A4'), 0.12 + 0.03 * (s - 8), pan=0.2)
        put(fx, t0 + 0.9, noise_sweep(1.1, 300, 10000), 0.2)
    # bass
    root = ROOT[ch]
    up = root[:-1] + str(int(root[-1]) + 1)
    for s, n in [(0, root), (3, root), (6, up), (8, root), (11, root), (14, up)]:
        put(bassT, t0 + s * STEP, bass(n, 0.2 if s % 8 else 0.3, dark=partner), 0.7)
    # pad + stabs
    put(padT, t0, pad(CHORDS[ch], 2.05, dark=partner), 0.5)
    for s in ([2, 6, 10, 14] if not partner else [6, 14]):
        put(keys, t0 + s * STEP, stab(STAB[ch], 0.12, dark=partner), 0.32, pan=0.15)

# Drone continues softly under the groove.
put(drone, 3.0, tanpura(22.2) * np.minimum(1, tvec(22.2) / 1.0), 0.16)

# Sitar lead: hook motif at the reveal, lighter during the taps, answer phrase in tracking, low register for the partner app.
MOTIF_A = [(0, 'A4'), (3, 'D5'), (6, 'E5'), (8, 'F#5'), (11, 'E5'), (14, 'D5'), (16, 'B4'), (19, 'D5'), (22, 'F#5'), (24, 'A5'), (28, 'F#5')]
MOTIF_B = [(0, 'D5'), (3, 'B4'), (6, 'D5'), (8, 'E5'), (12, 'D5'), (16, 'C#5'), (19, 'E5'), (22, 'A5'), (24, 'G5'), (26, 'F#5'), (28, 'E5')]
MOTIF_LOW = [(0, 'B3'), (3, 'D4'), (6, 'F#4'), (8, 'E4'), (12, 'D4'), (16, 'G3'), (19, 'B3'), (22, 'D4'), (24, 'E4'), (28, 'A3')]
def phrase(start_bar, motif, vel=1.0, pan=-0.15):
    for s, n in motif:
        put(lead, bar_t(start_bar) + s * STEP, sitar(n, 0.9), 0.55 * vel, pan=pan)
phrase(0, MOTIF_A, 1.0)
phrase(2, [(0, 'D5'), (8, 'E5'), (16, 'C#5'), (24, 'E5')], 0.55)
phrase(4, MOTIF_B, 0.75)
phrase(6, MOTIF_A[:6] + [(16, 'C#5'), (19, 'E5'), (24, 'A5')], 0.7)
phrase(8, MOTIF_LOW, 0.85, pan=0.1)
phrase(10, [(0, 'C#4'), (4, 'E4'), (8, 'A4'), (12, 'C#5')], 0.7, pan=0.1)

# Outro (25–30 s): final hit on D, everything rings out.
T_END = 25.0
put(drums, T_END, kick(1.1), 1.0)
put(drums, T_END, band(rng.standard_normal(int(1.8 * SR)), 3000, 14000) * np.exp(-tvec(1.8) / 0.45), 0.14)  # crash-like wash
put(bassT, T_END, bass('D2', 2.5) * np.exp(-tvec(2.5) / 1.2), 0.8)
put(padT, T_END, pad(CHORDS['D'] + ['F#4', 'A4'], 4.8), 0.6)
put(keys, T_END, stab(['D4', 'F#4', 'A4', 'D5'], 0.9), 0.4)
for k, n in enumerate(['D4', 'A4', 'D5', 'F#5', 'A5']):
    put(lead, T_END + 0.012 * k, sitar(n, 2.5), 0.35)  # strum
for tt, n in [(26.5, 'A5'), (26.75, 'F#5'), (27.0, 'E5'), (27.25, 'D5'), (27.75, 'A4'), (28.0, 'D5')]:
    put(lead, tt, sitar(n, 1.6), 0.4, pan=-0.1)
put(drone, T_END, tanpura(4.9) * np.minimum(1, (4.9 - tvec(4.9)) / 2.5), 0.3)
put(perc, T_END + 1.0, tabla('dha', 'D5'), 0.25)
put(perc, 27.0, tabla('na', 'A4'), 0.16)
put(perc, 29.0, tabla('ge'), 0.2)

# ---------------- sound effects (in key, under the music) ----------------
def tap_sfx():
    t = tvec(0.09)
    tone = np.sin(2 * np.pi * hz('D6') * t) * np.exp(-t / 0.018)
    click = band(rng.standard_normal(len(t)), 2500, 8000) * np.exp(-t / 0.003)
    return tone * 0.6 + click * 0.25

def swish():
    return noise_sweep(0.22, 1800, 6000) * 0.8

TAPS = [7.2, 7.8, 8.6, 9.15, 9.75, 10.15, 10.35, 10.55, 11.0, 11.45, 12.55, 17.2, 20.0, 21.6]
PUSHES = [7.35, 8.75, 9.9, 11.15, 11.6, 13.0, 19.12, 21.75, 23.0]
for tt in TAPS:
    put(fx, tt, tap_sfx(), 0.16, pan=0.3)
for tt in PUSHES:
    put(fx, tt - 0.04, swish(), 0.05, pan=0.35)
put(fx, 3.3, noise_sweep(0.6, 600, 3000), 0.12, pan=0.4)  # phone slides in
put(fx, 13.15, bell('D6', 1.0), 0.07); put(fx, 13.3, bell('A6', 1.0), 0.06)  # coolie on the way
put(fx, 14.62, addp(bell('A6', 1.4), 0.5 * bell('E7', 0.8)), 0.06, pan=-0.4)  # brass badge glint
put(fx, 18.82, noise_sweep(0.6, 6000, 400, rising=False), 0.18, pan=0.5)  # night wipe
for k, n in enumerate(['D6', 'F#6', 'A6']):
    put(fx, 20.17 + k * 0.07, bell(n, 0.9), 0.07)  # "Booked just now"
put(fx, 21.62, bell('A5', 0.6), 0.06)  # accept
put(fx, 24.8, noise_sweep(0.3, 500, 7000), 0.14)  # red wipe

# ---------------- mix ----------------
def reverb(x, secs=1.6, wet=0.25):
    n = int(secs * SR)
    t = np.arange(n) / SR
    out = np.zeros_like(x)
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-t / (secs / 5))
        ir = band(ir, 200, 7000)
        ir[: int(0.012 * SR)] = 0
        ir /= np.sqrt(np.sum(ir ** 2))
        L = 1 << int(np.ceil(np.log2(N + n)))
        out[ch] = np.fft.irfft(np.fft.rfft(x[ch], L) * np.fft.rfft(ir, L), L)[:N]
    return x * (1 - wet) + out * wet * 1.6

music = (
    drums * 0.95 + perc * 0.8 + bassT * 0.75 * duck + keys * 0.7 * (0.5 + 0.5 * duck) + padT * 0.6 * duck + drone * 0.5
)
music = reverb(music, 1.4, 0.16) + reverb(lead * 0.8, 1.8, 0.3)
fx_bus = reverb(fx, 1.0, 0.18)
mix = music + fx_bus

# Gentle master: remove DC and sub-rumble, fade edges, soft-clip, normalize to -1 dBFS.
for ch in range(2):
    S = np.fft.rfft(mix[ch])
    f = np.fft.rfftfreq(N, 1 / SR)
    S *= 1 / (1 + (28 / np.maximum(f, 1e-3)) ** 4)
    mix[ch] = np.fft.irfft(S, N)
t = np.arange(N) / SR
mix *= np.minimum(1, t / 0.01) * np.minimum(1, (DUR - t) / 0.6)
mix = mix / np.max(np.abs(mix)) * 1.15
mix = np.tanh(mix) / np.tanh(1.15)
mix *= 10 ** (-1 / 20)
rms = np.sqrt(np.mean(mix ** 2))
print('peak', np.max(np.abs(mix)).round(3), 'rms dBFS', (20 * np.log10(rms)).round(1))

pcm = (np.clip(mix.T, -1, 1) * 32767).astype(np.int16)
with wave.open('soundtrack.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('wrote soundtrack.wav')
