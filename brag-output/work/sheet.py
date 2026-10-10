import sys, glob, os
from PIL import Image, ImageDraw
files = sorted(glob.glob(sys.argv[1] + '/still-*.png'), key=lambda f: float(os.path.basename(f)[6:-4]))
if len(sys.argv) > 3: files = files[int(sys.argv[3]):int(sys.argv[4])]
W, H = 480, 270
cols = 3
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * W, rows * (H + 16)), 'white')
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    x, y = (i % cols) * W, (i // cols) * (H + 16)
    sheet.paste(Image.open(f).convert('RGB').resize((W, H)), (x, y + 16))
    d.text((x + 4, y + 2), os.path.basename(f)[6:-4] + 's', fill='black')
sheet.save(sys.argv[2])
