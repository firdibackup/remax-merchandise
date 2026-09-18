"use client";

import { MapPin, Package, Truck, X } from "lucide-react";
import * as React from "react";

import { Modal } from "@/components/admin/Modal";
import { OrderItemThumb } from "@/components/admin/OrderItemThumb";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { withBasePath } from "@/lib/constants";
import { formatKg, formatPrice } from "@/lib/format";
import { ORDER_STATUS_META, trackingUrl } from "@/lib/orders/status";
import type { Order } from "@/types/order";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fullAddress(order: Order): string {
  const d = order.destination;
  return [
    d.addressDetail,
    d.villageName,
    d.districtName,
    d.regencyName,
    d.provinceName,
    d.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

const SECTION_TITLE =
  "mb-2 flex items-center gap-1.5 text-[11.5px] font-bold tracking-[0.04em] text-gray-400 uppercase";

function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}): React.JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-4 text-[13px]">
      <span className={strong ? "font-semibold text-ink" : "text-gray-500"}>
        {label}
      </span>
      <span
        className={
          strong
            ? "font-mono text-[14px] font-bold text-brand"
            : "font-mono text-gray-600"
        }
      >
        {value}
      </span>
    </div>
  );
}

interface OrderDetailDialogProps {
  order: Order | null;
  /** Primary product image URL keyed by product slug (order items store slugs). */
  productImages: Record<string, string>;
  onClose: () => void;
}

/** Read-only full breakdown of an order (items, biaya, pengiriman, timeline). */
export function OrderDetailDialog({
  order,
  productImages,
  onClose,
}: OrderDetailDialogProps): React.ReactNode {
  const track = order ? trackingUrl(order.resi) : null;

  return (
    <Modal
      open={Boolean(order)}
      onClose={onClose}
      ariaLabel="Detail pesanan"
      className="max-w-[620px] p-0"
    >
      {order ? (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-admin-border px-5 py-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[15px] font-extrabold text-ink">
                  #{order.ref}
                </span>
                <StatusBadge status={order.status} />
              </div>
              <div className="mt-1 text-[12.5px] text-gray-400">
                {formatDateTime(order.createdAt)} · {order.customerEmail}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="-mt-1 -mr-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-btn text-gray-400 hover:bg-gray-50 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="rmx-scrollbar flex-1 overflow-y-auto px-5 py-4">
            <div className={SECTION_TITLE}>
              <Package className="h-3.5 w-3.5" />
              Item ({order.items.length})
            </div>
            <div className="flex flex-col gap-2.5">
              {order.items.map((it, idx) => (
                <div
                  key={`${it.sku}-${idx}`}
                  className="flex items-start gap-3 rounded-btn border border-admin-border px-3 py-2.5"
                >
                  <OrderItemThumb
                    src={productImages[it.productSlug] ?? null}
                    alt={it.name}
                    size={52}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold text-ink">
                      {it.name}
                    </div>
                    {Object.keys(it.options).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {Object.entries(it.options).map(([k, v]) => (
                          <span
                            key={k}
                            className="inline-flex items-center rounded-pill bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600"
                          >
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-1 font-mono text-[11.5px] text-gray-400">
                      SKU {it.sku} · {formatKg(it.weightGrams)}/pcs
                    </div>
                  </div>
                  <div className="flex-none text-right">
                    <div className="font-mono text-[13.5px] font-bold text-ink">
                      {formatPrice(it.unitPrice * it.qty)}
                    </div>
                    <div className="mt-0.5 font-mono text-[11.5px] text-gray-400">
                      {formatPrice(it.unitPrice)} × {it.qty}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-1.5 rounded-btn bg-admin-bg px-3 py-3">
              <Row
                label={`Subtotal (${order.totalQty} pcs)`}
                value={formatPrice(order.estimatedTotal)}
              />
              <Row
                label={`Ongkir ${order.courierService || order.courierCode || "—"}`}
                value={formatPrice(order.shippingCost)}
              />
              <Row label="Berat total" value={formatKg(order.totalWeightGrams)} />
              <div className="my-1 h-px bg-admin-border" />
              <Row label="Total" value={formatPrice(order.grandTotal)} strong />
            </div>

            <div className="mt-5">
              <div className={SECTION_TITLE}>
                <MapPin className="h-3.5 w-3.5" />
                Pengiriman
              </div>
              <div className="rounded-btn border border-admin-border px-3 py-3 text-[13px]">
                <div className="font-semibold text-ink">
                  {order.destination.recipientName || "—"}
                </div>
                {order.destination.recipientPhone && (
                  <div className="mt-0.5 font-mono text-[12.5px] text-gray-500">
                    {order.destination.recipientPhone}
                  </div>
                )}
                <div className="mt-1 leading-snug text-gray-500">
                  {fullAddress(order) || "Alamat belum diisi"}
                </div>
                {order.resi ? (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-admin-border pt-2.5">
                    <Truck className="h-3.5 w-3.5 text-gray-400" />
                    <span className="font-mono text-[12.5px] text-gray-600">
                      {order.courier} · {order.resi}
                    </span>
                    {track && (
                      <a
                        href={track}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12.5px] font-semibold text-brand hover:underline"
                      >
                        Lacak
                      </a>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {order.history.length > 0 && (
              <div className="mt-5">
                <div className={SECTION_TITLE}>Riwayat status</div>
                <ol className="flex flex-col gap-2.5">
                  {[...order.history].reverse().map((h, idx) => (
                    <li
                      key={`${h.status}-${h.createdAt}-${idx}`}
                      className="flex gap-2.5 text-[13px]"
                    >
                      <span className="mt-[6px] h-1.5 w-1.5 flex-none rounded-full bg-gray-300" />
                      <div className="min-w-0">
                        <span className="font-semibold text-ink">
                          {ORDER_STATUS_META[h.status].label}
                        </span>
                        <span className="ml-2 text-[11.5px] text-gray-400">
                          {formatDateTime(h.createdAt)}
                        </span>
                        {h.note && (
                          <p className="mt-0.5 text-gray-500">{h.note}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-admin-border px-5 py-3.5">
            <a
              href={withBasePath(`/api/admin/orders/${order.id}/form`)}
              className="inline-flex h-9 items-center gap-1.5 rounded-btn border border-admin-border bg-white px-3.5 text-[13px] font-semibold text-gray-600 hover:text-ink"
            >
              Unduh PDF
            </a>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center rounded-btn bg-brand px-4 text-[13px] font-semibold text-white hover:bg-brand-hover"
            >
              Tutup
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
