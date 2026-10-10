# Coolie: 30-second launch video plan

Made with `/brag` → `/brag-slim` (Opus 5.5). Landscape 1920×1080, 30 fps, **30 s** (the user asked for 30 s; the skill's default is ~20 s).

## Answers

- **What is it?** An app for booking a licensed railway coolie (porter) to carry your luggage to or from your train, the way you book a ride.
- **Who is it for?** Train passengers with heavy bags, and the coolies themselves, who get a partner app.
- **What sets it apart?** Two sides on one platform: the passenger books by PNR and tracks the coolie live to their seat. The coolie gets trips at their station, fixed fares and weekly payouts. Prices are fixed by weight, so there's no haggling.
- **Most impressive claim:** "Licensed railway porters, booked like a ride." (the app's own copy)
- **Visual hook:** the app's logo is a porter balancing a suitcase on his head. Drop the suitcase first ("Heavy luggage?"), then the porter rises under it ("Leave it to us.").
- **Real UI to show:** the booking flow (PNR → meeting point → bags → fare), the live map with the coolie walking to the gate, the station view, and the dark Coolie Partner app (go online → "Booked just now" → accept → earnings).
- **Tone:** `app-store` (clean feature cards, smooth slides) with `default` warmth. The audience is investors, so it shouldn't be goofy.
- **Share caption:** "Licensed railway porters, booked like a ride. Coolie: your luggage, our shoulders."

## Angle

Every rail traveller knows the platform scramble with heavy bags. Coolie turns hiring a porter into a two-tap ride booking, and gives porters a proper partner app. The video shows both sides, using the app's real screens and copy only.

## Visual identity (from the code)

- Coolie red `#D3252B`, white, cream `#FBF6F4`, ink `#241616`, brass "billa" `#B98A22` / `#E8C468`
- Coolie Partner night `#1A1011`
- Poppins (800 for headlines, 500/600 for body). The porter logo is reused as SVG from `src/components/Logo.tsx`.
- Real screens captured from the running app at 2×, shown in a phone frame with touch ripples where the real taps happened.

## Storyboard (the music is 120 BPM, and every scene cut lands on a bar)

| Time | Scene | On screen | Text (all from the app) | Sound |
|---|---|---|---|---|
| 0.0–3.0 | **Hook** | Full red. A white suitcase drops onto a line and lands with a thud. The porter rises under it and lifts it. Together they form the logo. | "Heavy luggage?" → "Leave it to us." | Thud, tabla roll into the downbeat |
| 3.0–7.0 | **Reveal** | The red screen shrinks into the app icon. The wordmark appears and the phone slides in on the passenger home screen. | "Book a licensed coolie in seconds" / "Like booking a ride, but for your luggage." | The groove drops (D–Bm–G–A) |
| 7.0–13.0 | **Highlight 1: book** | Taps through the real flow: Station Gate → Train, PNR, Main Entrance (Gate 1), bags, Cash, "Book coolie · ₹220". The steps light up on the left. | HOW IT WORKS · Enter your PNR · Pick where to meet · Add your bags → "Fair prices by weight" ₹220 · 56 kg | Soft taps in key |
| 13.0–19.0 | **Highlight 2: track** | Live map: the coolie walks to the gate (real frame sequence), then a tap on Station shows the platform view. | "Live tracking till your seat" + brass badge "Licensed porters with railway badge" | Chime when the coolie is found |
| 19.0–25.0 | **Highlight 3: partner** | A night wipe opens the Coolie Partner app: go online → "Booked just now" request → Accept → Earnings. | Coolie Partner · "More trips. Fair pay. Respect." · Trips at your station · Fixed fares · Weekly payouts | Darker, filtered section, with a ding on the request |
| 25.0–30.0 | **Outro** | A red circle wipe. The big white porter mark and wordmark on red. | "Your luggage, our shoulders." / "Licensed railway porters, booked like a ride." / Passenger app + Coolie Partner app · English + हिंदी | Final hit, chord rings out |

Durations: 3 + 4 + 6 + 6 + 6 + 5 = **30 s**.

## Sound

The music is synthesized for this video: 120 BPM in D major, kick and clap, shaker, a tabla-style hand drum, a plucked bass, electric-piano chords, and a sitar-like plucked lead (Karplus–Strong). The effects are pitched to the key (taps on D6, a D/A chime) and sit under the music. The partner section is low-passed for a night feel.

## Poster

Pick a settled frame: the reveal (logo, headline and phone) or the outro card.

## Re-render

From `brag-output/work/`, with the web build running (`npx expo start --web`):

```bash
node capture-passenger.js && node capture-partner.js     # real app screens → shots/
mkdir -p fonts && for w in 400Regular 500Medium 600SemiBold 700Bold 800ExtraBold; do
  cp ../../node_modules/@expo-google-fonts/poppins/$w/Poppins_$w.ttf fonts/; done
python3 build_manifest.py                                 # → ../composition/manifest.js
python3 audio.py                                          # → soundtrack.wav (needs numpy)
node render.js ../brag.mp4                                # 900 frames + audio → brag.mp4 (frame 0 = poster)
```
