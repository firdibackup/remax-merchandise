"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

import type { RegionLevel, UseShippingResult } from "@/hooks/useShipping";
import type { RegionOption } from "@/types/shipping";

const FIELD =
  "h-12 w-full rounded-btn border border-hairline bg-white px-3.5 text-[14.5px] text-ink outline-none focus:border-brand";
const LABEL = "text-[13px] font-semibold text-body";

interface ShippingDestinationFormProps {
  shipping: UseShippingResult;
  compact?: boolean;
}

/** Recipient details + cascading destination (province → kelurahan) for checkout. */
export function ShippingDestinationForm({
  shipping,
  compact = false,
}: ShippingDestinationFormProps): React.JSX.Element {
  const {
    provinces,
    regencies,
    districts,
    villages,
    loading,
    selected,
    selectRegion,
    recipientName,
    recipientPhone,
    addressDetail,
    setRecipientName,
    setRecipientPhone,
    setAddressDetail,
    error,
  } = shipping;

  return (
    <div className={compact ? "" : "rounded-card border border-hairline bg-white p-6"}>
      {!compact && (
        <h3 className="mb-4 text-lg font-semibold text-ink">Alamat Pengiriman</h3>
      )}

      <div className="flex flex-col gap-3.5">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Nama Penerima</span>
            <input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="mis. Budi Santoso"
              className={FIELD}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>No. HP / WhatsApp</span>
            <input
              value={recipientPhone}
              onChange={(e) =>
                setRecipientPhone(e.target.value.replace(/[^\d+]/g, ""))
              }
              inputMode="tel"
              placeholder="08xxxxxxxxxx"
              className={`${FIELD} font-mono`}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <RegionSelect
            label="Provinsi"
            level="province"
            options={provinces}
            value={selected.province?.code ?? ""}
            disabled={false}
            loading={loading.province}
            placeholder="Pilih provinsi"
            onSelect={selectRegion}
          />
          <RegionSelect
            label="Kota / Kabupaten"
            level="regency"
            options={regencies}
            value={selected.regency?.code ?? ""}
            disabled={!selected.province}
            loading={loading.regency}
            placeholder="Pilih kota/kabupaten"
            onSelect={selectRegion}
          />
          <RegionSelect
            label="Kecamatan"
            level="district"
            options={districts}
            value={selected.district?.code ?? ""}
            disabled={!selected.regency}
            loading={loading.district}
            placeholder="Pilih kecamatan"
            onSelect={selectRegion}
          />
          <RegionSelect
            label="Kelurahan / Desa"
            level="village"
            options={villages}
            value={selected.village?.code ?? ""}
            disabled={!selected.district}
            loading={loading.village}
            placeholder="Pilih kelurahan/desa"
            onSelect={selectRegion}
          />
        </div>

        {error ? (
          <p role="alert" className="text-[13px] font-semibold text-danger">
            {error}. Coba pilih ulang wilayah di atas.
          </p>
        ) : null}

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Alamat Lengkap</span>
          <textarea
            value={addressDetail}
            onChange={(e) => setAddressDetail(e.target.value)}
            rows={3}
            placeholder="Nama jalan, nomor rumah, RT/RW, patokan…"
            className="resize-y rounded-btn border border-hairline bg-white px-3.5 py-3 text-[14.5px] text-ink outline-none focus:border-brand"
          />
        </label>
      </div>
    </div>
  );
}

interface RegionSelectProps {
  label: string;
  level: RegionLevel;
  options: RegionOption[];
  value: string;
  disabled: boolean;
  loading: boolean;
  placeholder: string;
  onSelect: (level: RegionLevel, option: RegionOption | null) => void;
}

function RegionSelect({
  label,
  level,
  options,
  value,
  disabled,
  loading,
  placeholder,
  onSelect,
}: RegionSelectProps): React.JSX.Element {
  const isDisabled = disabled || loading;
  return (
    <label className="flex flex-col gap-1.5">
      <span className={LABEL}>{label}</span>
      <div className="relative">
        <select
          value={value}
          disabled={isDisabled}
          onChange={(e) =>
            onSelect(level, options.find((o) => o.code === e.target.value) ?? null)
          }
          className={cn(
            FIELD,
            "cursor-pointer appearance-none pr-9",
            isDisabled && "cursor-not-allowed bg-surface-soft opacity-70",
          )}
        >
          <option value="">{loading ? "Memuat…" : placeholder}</option>
          {options.map((o) => (
            <option
              key={o.code}
              value={o.code}
              disabled={o.isCourierSupport === false}
            >
              {o.name}
              {o.isCourierSupport === false ? " — tidak dilayani kurir" : ""}
            </option>
          ))}
        </select>
        {loading && (
          <Loader2 className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-muted" />
        )}
      </div>
    </label>
  );
}
