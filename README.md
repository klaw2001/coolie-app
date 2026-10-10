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

### Android APK (no computer needed at the demo)

The app also installs as a normal Android app, `com.coolie.app`. It runs fully offline, because all data is dummy data stored on the phone.

To build the APK yourself (needs JDK 17+ and the Android SDK with `ANDROID_HOME` set):

```bash
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

Or build it in Expo's cloud with EAS Build (free Expo account): add a profile with `"android": { "buildType": "apk" }` to `eas.json`, then run `npx eas-cli@latest build -p android --profile <name>`.

To install it, copy the APK to the phone and open it. Allow *Install unknown apps* when Android asks, and tap *Install anyway* if Play Protect warns about an unknown developer.

### iPhone

An iPhone app can't be sideloaded like an APK. You need either:
- **Expo Go** on the iPhone, with your computer running `npx expo start --tunnel`; or
- a paid **Apple Developer Program** account. EAS Build can then build in the cloud (no Mac needed) for TestFlight, or for an ad hoc build installed on registered iPhones.

## Two apps, two logins

The first screen is a gateway with two doors:

- **I'm a passenger**: the red-and-white **Coolie** app for booking a coolie.
- **I'm a coolie**: the dark **Coolie Partner** app for porters, with its own branding, welcome screens, login, registration and screens.

Each side has its own accounts, so a passenger never sees coolie screens and vice versa. Logging out returns you to the gateway.

### Demo accounts

Both login screens have a one-tap demo account card. The OTP fills itself in, as if read from SMS.

| App | Account | History already loaded |
| --- | --- | --- |
| Passenger | **Ananya Sharma**, +91 98765 01234, Mumbai CSMT | Past trips (one carried by Ramesh), an unrated trip, a cancelled trip with a wallet refund, a trip scheduled for tomorrow, wallet balance, saved card and UPI ID |
| Coolie Partner | **Ramesh Yadav**, +91 98200 41177, badge **CSMT-472** | A week of jobs and earnings, payouts, ratings, verified KYC |

New numbers go through sign-up instead. A passenger fills in a short profile. A coolie goes through **partner registration** (personal details, station and badge number, shift, document uploads, Aadhaar and bank details, consent), then a verification screen that approves the application in a few seconds.

## Investor demo script (one phone)

Bookings are shared on the phone, so a booking made by Ananya reaches Ramesh after you switch logins.

1. Gateway → **I'm a passenger** → tap **Ananya Sharma**. Show the home screen, bookings history and wallet.
2. Book **Station Gate → Train**: tap demo PNR `2451873690` (Mumbai CSMT) → *Main Entrance (Gate 1)* → add bags → *Now* → *Cash after trip* → **Book**.
3. On "Finding a coolie", tap **Open Coolie Partner app**. This holds the booking for a partner and opens the partner login.
4. Tap **Ramesh Yadav** → **Go online**. Ananya's booking appears as **Booked just now**. Accept it, then *I've arrived* → enter the OTP shown in the hint → mark each step → *Complete delivery* → *Collect cash*. Show Earnings (weekly chart and bonus) and Profile (badge, verified documents).
5. Profile → **Log out** → **I'm a passenger** → **Ananya Sharma**. The trip shows as completed by Ramesh, ready to rate and tip.

To show the passenger side alone, just wait on "Finding a coolie": while the passenger is logged in, a simulated coolie accepts after about 10 seconds and the whole trip plays out automatically.

Partner bookings are matched by station. The demo partner works at **Mumbai CSMT**, so use a CSMT PNR (`2451873690` or `8213650479`) or pick CSMT manually for step 2.

## Demo cheat-sheet

| Where | What to enter |
| --- | --- |
| Login OTP | `1234` (demo accounts fill it automatically) |
| PNR | Tap a demo PNR (e.g. `2451873690`). Any 10-digit number starting 1–8 also works. |
| UPI app PIN | Any 6 digits succeed. `000000` fails. |
| UPI ID | Any `name@bank` succeeds. `fail@upi` is declined. |
| Card | `4111 1111 1111 1111` succeeds. `4000 0000 0000 0002` is declined. Card OTP is `123456`. |
| Coolie OTP | Shown on the passenger's trip screen (and as a hint in coolie mode). |

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

**Coolie Partner**
- Partner registration with simulated KYC (document uploads, Aadhaar, bank account) and a verification/approval screen
- Online/offline duty toggle, today's earnings, trips and rating
- Incoming requests: real bookings from passenger accounts at the partner's station ("Booked just now"), plus simulated requests that arrive every ~20 s while online and expire after 30 s
- Job screen: map/station view, OTP verification, step-by-step progress, cash collection, chat and call with the passenger
- Jobs history, weekly bonus tracker, 7-day earnings chart, cash vs online, tips, withdraw to bank
- Profile with licensed-porter badge, languages, shift, verified documents and partner-since date

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
    (auth)/                gateway, welcome, login, otp, signup, partner-signup, partner-review
    (app)/(passenger)/     home, bookings, wallet, profile tabs
    (app)/(coolie)/        duty, jobs, earnings, profile tabs
    (app)/book/            train → point → luggage → schedule → review (+ map-pick)
    (app)/pay/             method picker, UPI app, UPI ID, card, result
    (app)/trip/            live trip, completion (rate/tip)
    (app)/job/             coolie's live job
    (app)/booking/, chat/  receipt/details, chat
  components/              UI kit (ui/), maps, tracker, sheets, cards
  data/                    stations, trains & PNRs, coolies, areas, bags, fares, journey stages, demo accounts
  store/useApp.ts          Zustand store: passenger and partner accounts, session, shared bookings, simulation tick
  i18n/                    en.ts, hi.ts
```

All state lives on the device (AsyncStorage). *Profile → Reset demo data* wipes everything, including new sign-ups, and restores the two demo accounts.

## Notes

- Maps: Expo Go and iOS show real map tiles (`react-native-maps`). A standalone Android build has no Google Maps key yet, so it shows the app's own drawn city map instead (`src/components/map/CityMap.tsx`): streets, parks, railway lines, station platforms and a waiting train, with drag and pinch-zoom. To switch the APK to real tiles, add the key and rebuild:
  ```json
  "plugins": [["react-native-maps", { "androidGoogleMapsApiKey": "YOUR_KEY" }]]
  ```
  The app detects the key and uses the real map automatically (see `src/components/map/provider.ts`).
- Calls are simulated in-app. Only the SOS sheet opens the real phone dialler, and it asks you to confirm first.
- The web build (`npx expo start --web`) works for quick previews and uses the drawn map.
