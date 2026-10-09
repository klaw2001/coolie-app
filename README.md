# Coolie

A demo React Native (Expo) app for booking a railway coolie (porter), the way you'd book a Rapido or Porter ride, except the coolie carries your luggage to or from your train.

Everything is dummy data and runs on your phone: stations, trains, PNRs, coolies, payments and live tracking are all simulated. Nothing calls a real server.

- **Expo SDK 57**, Expo Router, TypeScript
- Runs in **Expo Go** (Android and iOS). No native build needed.
- Red-and-white coolie-uniform theme with a brass "billa" (arm badge) accent
- **English and Hindi**, switchable from any profile screen or the `EN | हिं` toggle

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** (Android) or the Camera app (iOS). Your phone and computer need to be on the same Wi-Fi. If they aren't, use `npx expo start --tunnel`.

## Demo cheat-sheet

| Where | What to enter |
| --- | --- |
| Login OTP | `1234` (any 10-digit mobile number starting 6–9) |
| PNR | Tap a demo PNR (e.g. `2451873690`). Any 10-digit number starting 1–8 also works. |
| UPI app PIN | Any 6 digits succeed. `000000` fails. |
| UPI ID | Any `name@bank` succeeds. `fail@upi` is declined. |
| Card | `4111 1111 1111 1111` succeeds. `4000 0000 0000 0002` is declined. Card OTP is `123456`. |
| Coolie OTP | Shown on the passenger's trip screen (and as a hint in coolie mode). |

## Two roles in one app

After login you pick **I'm travelling** (passenger) or **I'm a coolie**. You can switch any time from Profile.

**Passenger and coolie are linked.** When you book as a passenger:

- If you do nothing, a dummy coolie accepts after about **10 s**, and the trip plays out on its own: coolie walks to you, arrives, OTP, station steps, delivered.
- Or tap **Switch to Coolie mode** on the "Finding a coolie" screen. Your own booking shows up at the top of the Duty tab (gold border). Accept it and drive the trip yourself: *I've arrived* → enter OTP → mark each step → *Complete delivery* → collect cash. Switch back to see the passenger side updated.

In coolie mode, dummy requests from other passengers also keep arriving while you're online (each expires after 30 s).

## Features

**Passenger**
- 3 journey types: **Home → Train**, **Station Gate → Train**, **Train → Exit** (arrivals)
- Train details by **PNR lookup** or **manual pick** (station → date → train → coach → seat), across 10 major stations (Mumbai CSMT, New Delhi, Howrah, Chennai Central, KSR Bengaluru, Pune, Ahmedabad, Lucknow, Jaipur, Hyderabad) and 31 trains
- Pickup: saved addresses, popular areas, or **pick on map** (Home → Train); gates, parking and drop-off (Gate → Train); cab stand, metro and exits (Train → Exit)
- Luggage by bag type with an estimated weight you can adjust, extra coolies, trolley and wheelchair add-ons
- **Book now** or **schedule** (time slots based on your train time). Scheduled bookings look for a coolie 15 min before. In the demo you can tap *Start now*.
- Pay online (UPI apps, UPI ID, saved or new cards with OTP, Coolie Wallet) or **cash after the trip**
- Live trip: **map** while the coolie comes to you, then a **station view** (platform board, train coach strip with your coach highlighted, step-by-step progress)
- Start OTP, coolie card with brass badge number, simulated **call**, **chat** with quick replies, **SOS** sheet (railway helpline 139, 112, share trip)
- Cancel with a reason (free until the coolie arrives; prepaid refunds go to Coolie Wallet instantly)
- Rate the coolie, add tags and a **tip** (online or cash), receipt, timeline, *Book again*
- Bookings (active and past), Wallet (balance, top-up, saved methods, history), Profile, saved addresses, rate card, help/FAQ

**Coolie**
- Online/offline duty toggle, today's earnings, trips and rating
- Incoming requests with a countdown, accept/decline
- Job screen: map/station view, OTP verification, step-by-step progress, cash collection
- Jobs history, 7-day earnings chart, cash vs online, tips, withdraw to bank
- Profile with licensed-porter badge, documents and language

## Pricing (weight slabs, per coolie)

| Weight carried | Price |
| --- | --- |
| Up to 20 kg | ₹80 |
| 21–40 kg | ₹150 |
| 41–60 kg | ₹220 |
| Every extra 20 kg | +₹70 |

- Weight is split equally between coolies, and each coolie is charged the slab for their share. One coolie carries up to 60 kg.
- Home → Train adds ₹12/km. Trolley ₹50, wheelchair assistance ₹200.

Change these in `src/data/fare.ts`.

## Project layout

```
src/
  app/                     Expo Router screens
    (auth)/                welcome, login, otp
    (app)/(passenger)/     home, bookings, wallet, profile tabs
    (app)/(coolie)/        duty, jobs, earnings, profile tabs
    (app)/book/            train → point → luggage → schedule → review (+ map-pick)
    (app)/pay/             method picker, UPI app, UPI ID, card, result
    (app)/trip/            live trip, completion (rate/tip)
    (app)/job/             coolie's live job
    (app)/booking/, chat/  receipt/details, chat
  components/              UI kit (ui/), maps, tracker, sheets, cards
  data/                    stations, trains & PNRs, coolies, areas, bags, fares, journey stages
  store/useApp.ts          Zustand store (persisted with AsyncStorage) + the simulation tick
  i18n/                    en.ts, hi.ts
```

All state lives on the device (AsyncStorage). *Profile → Reset demo data* wipes it.

## Notes

- Maps use `react-native-maps`, which works in Expo Go with no API key. A store build would need a Google Maps key (see the Expo docs).
- Calls are simulated in-app. Only the SOS sheet opens the real phone dialler, and it asks you to confirm first.
- The web build (`npx expo start --web`) works for quick previews, but maps there are a simple placeholder. The app is meant for Expo Go.
