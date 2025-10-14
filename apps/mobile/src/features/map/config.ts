// src/features/map/config.ts

// Expo injects EXPO_PUBLIC_* into process.env at build/dev time
export const MAPTILER_KEY: string = process.env.EXPO_PUBLIC_MAPTILER_KEY ?? "";

// One consistent style across iOS/Android/Web
export const STYLE_URL =
  `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

// Optional: warn during dev if the key isn't set
export function assertMapKey() {
  if (!MAPTILER_KEY) {
    console.warn(
      "[Map] Missing EXPO_PUBLIC_MAPTILER_KEY. Add it to .env.local and restart Expo."
    );
  }
}
