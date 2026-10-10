# Reads the captured screens and writes composition/manifest.js: status-bar colour per screen, tap points, map-sequence cuts.
import json, glob, os
from PIL import Image, ImageChops, ImageStat

shots = {}
for f in sorted(glob.glob('shots/*.png')):
    name = os.path.basename(f)[:-4]
    im = Image.open(f).convert('RGB')
    r, g, b = im.getpixel((6, 3))
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    shots[name] = {'bar': '#%02x%02x%02x' % (r, g, b), 'dark': lum < 140}

maps = sorted(n for n in shots if n.startswith('p16-map-'))
cuts = []
for a, b in zip(maps, maps[1:]):
    A = Image.open(f'shots/{a}.png').convert('L').resize((195, 422))
    B = Image.open(f'shots/{b}.png').convert('L').resize((195, 422))
    d = ImageStat.Stat(ImageChops.difference(A, B)).mean[0]
    if d > 6: cuts.append(maps.index(b))
    print(a, b, round(d, 2))

taps = {}
for f in ('shots/taps-passenger.json', 'shots/taps-partner.json'):
    taps.update(json.load(open(f)))

os.makedirs('../composition', exist_ok=True)
with open('../composition/manifest.js', 'w') as fh:
    fh.write('window.SHOTS = ' + json.dumps(shots) + ';\n')
    fh.write('window.TAPS = ' + json.dumps(taps) + ';\n')
    fh.write('window.MAPS = ' + json.dumps(maps) + ';\n')
    fh.write('window.MAPCUTS = ' + json.dumps(cuts) + ';\n')
print('cuts', cuts)
print({k: v for k, v in shots.items() if not k.startswith('p16')})
