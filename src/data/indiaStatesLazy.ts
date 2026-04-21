/**
 * Lazy loader for the Indian States/Districts dataset (~80KB).
 * Step 3 of /onboarding fetches this on demand so anonymous landing-page
 * visitors and earlier onboarding steps never pay for it.
 *
 * Source: github.com/sab99r/Indian-States-And-Districts (CC0)
 * Embedded inline below to avoid a network round-trip during onboarding.
 */

export interface CountryOption { code: string; name: string; }

export const COUNTRIES: CountryOption[] = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AE", name: "UAE" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "SG", name: "Singapore" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "OTHER", name: "Other (type below)" },
];

interface StatesPayload {
  states: { state: string; districts: string[] }[];
}

let cache: StatesPayload | null = null;
let inflight: Promise<StatesPayload> | null = null;

/**
 * Returns the India states+districts list. Imports the JSON dynamically so
 * the chunk is split out of the main bundle.
 */
export async function loadIndiaStates(): Promise<StatesPayload> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = import("./indiaStatesData").then(m => {
    cache = m.default as StatesPayload;
    inflight = null;
    return cache;
  });
  return inflight;
}
