# Egg Fertility Detector — React Native (Expo)

This is a full React Native / Expo conversion of the original Lovable web app
(TanStack Router + shadcn/ui) into native components using `View`, `Text`,
`StyleSheet`, `expo-router`, `expo-image-picker`, and AsyncStorage.

## Getting started

```bash
npm install
npx expo start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR
code with Expo Go on a physical device.

## Backend connection

The Analyze screen POSTs the captured/picked photo as `multipart/form-data`
to a FastAPI backend at:

```
src/lib/config.ts → PREDICT_URL = "http://localhost:8000/predict"
```

**Important:** `localhost` only works when the app runs in a simulator on the
same machine as your FastAPI server. On a **physical device**, replace it
with your computer's LAN IP address, e.g. `http://192.168.1.23:8000/predict`
(and make sure the phone and computer are on the same Wi-Fi network).

The backend is expected to accept a `file` (and/or `image`) field and return
JSON shaped roughly like:

```json
{
  "prediction": "Fertile",
  "confidence": 0.87,
  "candling": {
    "vein_density": 72,
    "air_cell_clarity": 64,
    "embryo_movement": 58,
    "opacity": 70,
    "notes": "Branching vascular network detected..."
  }
}
```

`prediction`/`confidence` field names are matched loosely (`label`/`result`,
`score`/`probability` are also accepted), and `confidence` can be sent as
either a 0–1 fraction or a 0–100 percentage.

If the request fails (server offline, wrong URL, network error), the app
automatically falls back to a **local simulated analysis** so you can keep
testing the UI without a running backend, and shows an alert explaining what
happened.

## Project structure

```
app/
  _layout.tsx              root stack
  (tabs)/
    _layout.tsx             bottom tab navigator (Analyze / History / Batches / Analytics)
    index.tsx                Analyze — camera/gallery capture, run analysis, tag & save
    history.tsx               Scan logbook — search, edit, delete, CSV export
    batches.tsx                Batches grouped view with per-batch fertility rate
    analytics.tsx               Stats, donut chart, batch comparison bars
src/
  components/
    AppHeader.tsx
    ResultCard.tsx
    BatchCombobox.tsx
    ProgressBar.tsx
    DonutChart.tsx
  lib/
    config.ts                API endpoint
    egg-types.ts              Scan / CandlingDetails / Prediction types
    egg-storage.ts             AsyncStorage-backed hooks (useScans, useBatchNames)
    egg-analysis.ts             persistImage, mockAnalyze, apiAnalyze
    egg-csv.ts                CSV export + native share sheet
  theme/
    colors.ts                Egg color palette
```

## Data & storage

- Scans and remembered batch names are persisted locally with
  `@react-native-async-storage/async-storage` (mirrors the original app's
  `localStorage` usage), under keys `efd.scans.v1` and `efd.batches.v1`.
- Captured/picked photos are copied into the app's document directory
  (`FileSystem.documentDirectory/egg-scans/`) so they survive cache clears,
  and each `Scan` stores that file's local `imageUri`.
- CSV export (scan history, batch summaries) writes a temp file and opens
  the native share sheet via `expo-sharing`.

## Notes on the conversion

- The original web app sampled `<canvas>` pixel data to fabricate a
  "mock analysis." React Native has no DOM/canvas, so the mock analysis here
  derives deterministic-per-photo metrics from a hash of the image file
  instead — same purpose (a believable offline fallback), different
  implementation.
- Recharts (`PieChart`/`BarChart`) were replaced with a small `react-native-svg`
  donut chart and plain `View`-based bars — no extra charting library needed.
- Per your requirements, there is **no settings screen/menu**: the API
  endpoint is a fixed constant in `src/lib/config.ts` rather than a
  user-editable setting.
