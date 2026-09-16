"use client";

import * as React from "react";

import { withBasePath } from "@/lib/constants";

import type { ActionResult } from "@/types/action";
import type {
  RegionOption,
  ShippingDestination,
  ShippingRate,
} from "@/types/shipping";

/**
 * Checkout shipping state: the cascading destination selector (province → regency
 * → district → village) plus live courier rates (ongkir). Provinces are fetched
 * server-side and passed in; deeper levels + rates load on demand from our proxy
 * routes inside event handlers (never useEffect, per the data-fetching rules).
 *
 * Ongkir is fully automatic — there is no courier picker. Picking a village (or
 * a saved address) quotes immediately and the single JNE Express rate is applied
 * to the total; a later cart edit re-quotes on its own after a short debounce.
 */

export type RegionLevel = "province" | "regency" | "district" | "village";
export type RatesStatus = "idle" | "loading" | "ready" | "empty" | "error";

export interface CartItemRef {
  sku: string;
  qty: number;
}

export interface UseShippingResult {
  provinces: RegionOption[];
  regencies: RegionOption[];
  districts: RegionOption[];
  villages: RegionOption[];
  loading: Record<RegionLevel, boolean>;
  selected: Record<RegionLevel, RegionOption | null>;
  selectRegion: (level: RegionLevel, option: RegionOption | null) => void;
  applyDestination: (destination: ShippingDestination) => void;
  resetDestination: () => void;
  recipientName: string;
  recipientPhone: string;
  addressDetail: string;
  setRecipientName: (v: string) => void;
  setRecipientPhone: (v: string) => void;
  setAddressDetail: (v: string) => void;
  /** Auto-quoted JNE Express rate for the current destination + cart, else null. */
  rate: ShippingRate | null;
  ratesStatus: RatesStatus;
  weightGrams: number;
  /** False while quoting is gated (the rate API requires a logged-in customer). */
  canQuote: boolean;
  /** Manual retry, used only when an automatic quote failed. */
  quote: () => void;
  /** Full destination once every level + recipient field is set, else null. */
  destination: ShippingDestination | null;
  /** "Kelurahan, Kecamatan, Kota, Provinsi" label for summaries/messages. */
  destinationLabel: string;
  error: string;
}

async function getRegions(url: string): Promise<RegionOption[]> {
  const res = await fetch(url);
  const body = (await res.json()) as ActionResult<RegionOption[]>;
  if (!body.success || !body.data) {
    throw new Error(body.message || "Gagal memuat wilayah");
  }
  return body.data;
}

interface QuoteResult {
  rate: ShippingRate | null;
  weightGrams: number;
}

/**
 * Quotes already fetched this page-load, keyed by destination + exact cart. The
 * same cart shipped to the same address always bills the same, so re-entering
 * /cart, toggling back to a saved address, or undoing a qty change reuses the
 * answer instead of re-hitting the route. Module-level so it survives component
 * remounts; a full reload starts empty and falls through to the server-side
 * cache in lib/shipping/cost.ts, which is what actually spares the paid API.
 *
 * Only settled quotes land here — a failure must stay retryable.
 */
const quoteCache = new Map<string, QuoteResult>();

/** Cache key for a quote — order-independent, so a reordered cart still hits. */
function quoteKey(villageCode: string, items: CartItemRef[]): string {
  return `${villageCode}|${items
    .map((i) => `${i.sku}:${i.qty}`)
    .sort()
    .join(",")}`;
}

const NO_LOADING: Record<RegionLevel, boolean> = {
  province: false,
  regency: false,
  district: false,
  village: false,
};

export function useShipping(
  initialProvinces: RegionOption[],
  items: CartItemRef[],
  initialDestination?: ShippingDestination | null,
  /**
   * The rate API is login-gated (it proxies a paid service), so quoting is
   * suppressed for guests — otherwise every guest quote 401s and the UI
   * misreports it as "courier doesn't serve this address". Defaults to true for
   * callers that never quote (e.g. the address book).
   */
  canQuote = true,
): UseShippingResult {
  const initialProvince = initialDestination
    ? { code: initialDestination.provinceCode, name: initialDestination.provinceName }
    : null;
  const initialRegency = initialDestination
    ? { code: initialDestination.regencyCode, name: initialDestination.regencyName }
    : null;
  const initialDistrict = initialDestination
    ? { code: initialDestination.districtCode, name: initialDestination.districtName }
    : null;
  const initialVillage = initialDestination
    ? { code: initialDestination.villageCode, name: initialDestination.villageName }
    : null;
  const [regencies, setRegencies] = React.useState<RegionOption[]>(
    initialRegency ? [initialRegency] : [],
  );
  const [districts, setDistricts] = React.useState<RegionOption[]>(
    initialDistrict ? [initialDistrict] : [],
  );
  const [villages, setVillages] = React.useState<RegionOption[]>(
    initialVillage ? [initialVillage] : [],
  );
  const [selected, setSelected] = React.useState<
    Record<RegionLevel, RegionOption | null>
  >({
    province: initialProvince,
    regency: initialRegency,
    district: initialDistrict,
    village: initialVillage,
  });
  const [loading, setLoading] = React.useState<Record<RegionLevel, boolean>>(
    NO_LOADING,
  );
  const [recipientName, setRecipientName] = React.useState(
    initialDestination?.recipientName ?? "",
  );
  const [recipientPhone, setRecipientPhone] = React.useState(
    initialDestination?.recipientPhone ?? "",
  );
  const [addressDetail, setAddressDetail] = React.useState(
    initialDestination?.addressDetail ?? "",
  );
  const [rate, setRate] = React.useState<ShippingRate | null>(null);
  const [ratesStatus, setRatesStatus] = React.useState<RatesStatus>("idle");
  const [weightGrams, setWeightGrams] = React.useState(0);
  const [error, setError] = React.useState("");

  // Latest cart contents / selected village kept in refs so the memoized handlers
  // always read fresh values without being re-created on every render.
  const itemsRef = React.useRef(items);
  itemsRef.current = items;
  const villageRef = React.useRef<RegionOption | null>(null);
  villageRef.current = selected.village;
  // Guards a late response from an earlier quote overwriting a newer one.
  const quoteSeq = React.useRef(0);
  const canQuoteRef = React.useRef(canQuote);
  canQuoteRef.current = canQuote;

  const fetchRates = React.useCallback(
    async (villageCode: string): Promise<void> => {
      const current = itemsRef.current;
      if (!villageCode || !canQuoteRef.current) return;
      if (current.length === 0) {
        setRatesStatus("idle");
        return;
      }
      const seq = ++quoteSeq.current;
      const cacheKey = quoteKey(villageCode, current);
      const hit = quoteCache.get(cacheKey);
      if (hit) {
        setRate(hit.rate);
        setWeightGrams(hit.weightGrams);
        setRatesStatus(hit.rate ? "ready" : "empty");
        setError("");
        return;
      }
      setRatesStatus("loading");
      setError("");
      try {
        const res = await fetch(withBasePath("/api/shipping/cost"), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            destinationVillageCode: villageCode,
            items: current,
          }),
        });
        const body = (await res.json()) as ActionResult<{
          rates: ShippingRate[];
          weightGrams: number;
        }>;
        if (seq !== quoteSeq.current) return;
        if (!body.success || !body.data) {
          setRate(null);
          setWeightGrams(0);
          setRatesStatus("error");
          setError(body.message || "Gagal menghitung ongkir");
          return;
        }
        // One courier only (JNE Express) — apply it straight to the total so the
        // customer never has to pick anything.
        const quoted = body.data.rates[0] ?? null;
        quoteCache.set(cacheKey, {
          rate: quoted,
          weightGrams: body.data.weightGrams,
        });
        setRate(quoted);
        setWeightGrams(body.data.weightGrams);
        setRatesStatus(quoted ? "ready" : "empty");
      } catch {
        if (seq !== quoteSeq.current) return;
        setRate(null);
        setRatesStatus("error");
        setError("Gagal menghitung ongkir. Coba lagi.");
      }
    },
    [],
  );

  const selectRegion = React.useCallback(
    (level: RegionLevel, option: RegionOption | null): void => {
      setError("");
      if (level === "province") {
        setSelected({ province: option, regency: null, district: null, village: null });
        setRegencies([]);
        setDistricts([]);
        setVillages([]);
        setRate(null);
        setRatesStatus("idle");
        if (option) {
          setLoading((l) => ({ ...l, regency: true }));
          getRegions(
            withBasePath(`/api/regional/regencies?province=${option.code}`),
          )
            .then(setRegencies)
            .catch(() => setError("Gagal memuat kota/kabupaten"))
            .finally(() => setLoading((l) => ({ ...l, regency: false })));
        }
      } else if (level === "regency") {
        setSelected((s) => ({ ...s, regency: option, district: null, village: null }));
        setDistricts([]);
        setVillages([]);
        setRate(null);
        setRatesStatus("idle");
        if (option) {
          setLoading((l) => ({ ...l, district: true }));
          getRegions(
            withBasePath(`/api/regional/districts?regency=${option.code}`),
          )
            .then(setDistricts)
            .catch(() => setError("Gagal memuat kecamatan"))
            .finally(() => setLoading((l) => ({ ...l, district: false })));
        }
      } else if (level === "district") {
        setSelected((s) => ({ ...s, district: option, village: null }));
        setVillages([]);
        setRate(null);
        setRatesStatus("idle");
        if (option) {
          setLoading((l) => ({ ...l, village: true }));
          getRegions(
            withBasePath(`/api/regional/villages?district=${option.code}`),
          )
            .then(setVillages)
            .catch(() => setError("Gagal memuat desa/kelurahan"))
            .finally(() => setLoading((l) => ({ ...l, village: false })));
        }
      } else {
        setSelected((s) => ({ ...s, village: option }));
        setRate(null);
        setRatesStatus(option ? "loading" : "idle");
        if (option) void fetchRates(option.code);
      }
    },
    [fetchRates],
  );

  const applyDestination = React.useCallback(
    (destination: ShippingDestination): void => {
      const province = { code: destination.provinceCode, name: destination.provinceName };
      const regency = { code: destination.regencyCode, name: destination.regencyName };
      const district = { code: destination.districtCode, name: destination.districtName };
      const village = { code: destination.villageCode, name: destination.villageName };
      setSelected({ province, regency, district, village });
      setRegencies([regency]);
      setDistricts([district]);
      setVillages([village]);
      setRecipientName(destination.recipientName);
      setRecipientPhone(destination.recipientPhone);
      setAddressDetail(destination.addressDetail);
      setRate(null);
      setRatesStatus("loading");
      void fetchRates(destination.villageCode);
    },
    [fetchRates],
  );

  const resetDestination = React.useCallback((): void => {
    quoteSeq.current += 1;
    setSelected({ province: null, regency: null, district: null, village: null });
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    setRecipientName("");
    setRecipientPhone("");
    setAddressDetail("");
    setRate(null);
    setRatesStatus("idle");
    setError("");
  }, []);

  const quote = React.useCallback((): void => {
    if (villageRef.current) void fetchRates(villageRef.current.code);
  }, [fetchRates]);

  // Quote whenever the billed weight can change: on mount with a saved default
  // address (the cart hydrates from localStorage, so this also covers the empty
  // → hydrated transition) and on every later cart edit. Debounced so holding
  // "+" fires one request, not one per click. Picking a region quotes instantly
  // from selectRegion/applyDestination instead — itemsSig is unchanged there, so
  // this effect stays out of the way and never double-quotes.
  const itemsSig = items.map((i) => `${i.sku}:${i.qty}`).join(",");
  React.useEffect(() => {
    const village = villageRef.current;
    if (!village || !itemsSig || !canQuote) return;
    // Already known (revisit, or an undone qty change)? Apply it synchronously —
    // debouncing a cached answer would only flash "Menghitung…" for nothing.
    if (quoteCache.has(quoteKey(village.code, itemsRef.current))) {
      void fetchRates(village.code);
      return;
    }
    // Drop the old price immediately: it was quoted for the previous cart
    // weight, so pairing it with the new subtotal would show a wrong total.
    setRate(null);
    setRatesStatus("loading");
    // Resolve the village when the timer FIRES, not when it was armed: the
    // customer may have cleared or switched addresses during the debounce, and
    // quoting the address they just abandoned would price a destination that is
    // no longer on screen.
    const timer = window.setTimeout(() => {
      const village = villageRef.current;
      if (village) void fetchRates(village.code);
      else setRatesStatus("idle");
    }, 400);
    return () => window.clearTimeout(timer);
  }, [itemsSig, fetchRates, canQuote]);

  const destination = React.useMemo<ShippingDestination | null>(() => {
    const { province, regency, district, village } = selected;
    if (!province || !regency || !district || !village) return null;
    if (!recipientName.trim() || !recipientPhone.trim() || !addressDetail.trim()) {
      return null;
    }
    return {
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      addressDetail: addressDetail.trim(),
      provinceCode: province.code,
      provinceName: province.name,
      regencyCode: regency.code,
      regencyName: regency.name,
      districtCode: district.code,
      districtName: district.name,
      villageCode: village.code,
      villageName: village.name,
      postalCode: "",
    };
  }, [selected, recipientName, recipientPhone, addressDetail]);

  const destinationLabel = React.useMemo<string>(
    () =>
      [
        selected.village?.name,
        selected.district?.name,
        selected.regency?.name,
        selected.province?.name,
      ]
        .filter(Boolean)
        .join(", "),
    [selected],
  );

  return {
    provinces: initialProvinces,
    regencies,
    districts,
    villages,
    loading,
    selected,
    selectRegion,
    applyDestination,
    resetDestination,
    recipientName,
    recipientPhone,
    addressDetail,
    setRecipientName,
    setRecipientPhone,
    setAddressDetail,
    rate,
    ratesStatus,
    weightGrams,
    canQuote,
    quote,
    destination,
    destinationLabel,
    error,
  };
}
