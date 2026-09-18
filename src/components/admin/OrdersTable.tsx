"use client";

import {
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  Pencil,
  Truck,
  X,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { confirmOrder } from "@/actions/orders";
import {
  AdvanceOrderDialog,
  type AdvanceTarget,
} from "@/components/admin/AdvanceOrderDialog";
import { OrderDetailDialog } from "@/components/admin/OrderDetailDialog";
import { OrderItemThumb } from "@/components/admin/OrderItemThumb";
import { ShippingOverrideDialog } from "@/components/admin/ShippingOverrideDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { withBasePath } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/order";

const STATUS_FILTERS: { value: "all" | OrderStatus; label: string; dot: string }[] =
  [
    { value: "all", label: "Semua", dot: "bg-gray-400" },
    { value: "pending", label: "Menunggu", dot: "bg-warning" },
    { value: "confirmed", label: "Dikonfirmasi", dot: "bg-brand" },
    { value: "processing", label: "Diproses", dot: "bg-blue-500" },
    { value: "shipped", label: "Dikirim", dot: "bg-violet-500" },
    { value: "completed", label: "Selesai", dot: "bg-success" },
    { value: "rejected", label: "Ditolak", dot: "bg-gray-400" },
  ];

/** Items shown inline in the table; the rest live in the detail dialog. */
const ITEM_PREVIEW_COUNT = 2;

const TH =
  "px-4 py-3.5 text-left text-[12px] font-bold tracking-[0.04em] text-gray-400 uppercase";
const BTN_PRIMARY =
  "inline-flex h-8 items-center gap-1.5 rounded-btn bg-brand px-3 text-[12.5px] font-semibold text-white hover:bg-brand-hover disabled:opacity-60";
const BTN_OUTLINE =
  "inline-flex h-8 items-center gap-1.5 rounded-btn border border-admin-border bg-white px-3 text-[12.5px] font-semibold text-gray-600 hover:text-ink disabled:opacity-60";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function optionsLabel(options: Record<string, string>): string {
  const vals = Object.values(options);
  return vals.length ? ` (${vals.join(" / ")})` : "";
}

interface DialogState {
  order: Order;
  target: AdvanceTarget;
}

interface OrdersTableProps {
  orders: Order[];
  /** Primary product image URL keyed by product slug (order items store slugs). */
  productImages: Record<string, string>;
}

export function OrdersTable({
  orders,
  productImages,
}: OrdersTableProps): React.JSX.Element {
  const [items, setItems] = React.useState<Order[]>(orders);
  const [statusFilter, setStatusFilter] = React.useState<"all" | OrderStatus>(
    "all",
  );
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [dialog, setDialog] = React.useState<DialogState | null>(null);
  const [shippingDialog, setShippingDialog] = React.useState<Order | null>(null);
  const [detailId, setDetailId] = React.useState<string | null>(null);

  const detailOrder = items.find((o) => o.id === detailId) ?? null;

  const filtered =
    statusFilter === "all"
      ? items
      : items.filter((o) => o.status === statusFilter);

  async function onConfirm(id: string): Promise<void> {
    setBusyId(id);
    const res = await confirmOrder(id);
    if (res.success) {
      patchOrder(id, { status: "confirmed" });
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
    setBusyId(null);
  }

  function patchOrder(id: string, patch: Partial<Order>): void {
    setItems((list) => list.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  function pdfLink(o: Order): React.JSX.Element {
    return (
      <a href={withBasePath(`/api/admin/orders/${o.id}/form`)} className={BTN_OUTLINE}>
        <FileText className="h-[14px] w-[14px]" />
        PDF
      </a>
    );
  }

  function renderActions(o: Order): React.JSX.Element {
    switch (o.status) {
      case "pending":
        return (
          <div className="inline-flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={busyId === o.id}
              onClick={() => void onConfirm(o.id)}
              className={BTN_PRIMARY}
            >
              <Check className="h-[14px] w-[14px]" />
              Konfirmasi
            </button>
            <button
              type="button"
              disabled={busyId === o.id}
              onClick={() => setDialog({ order: o, target: "rejected" })}
              className={cn(BTN_OUTLINE, "hover:text-danger")}
            >
              <X className="h-[14px] w-[14px]" />
              Tolak
            </button>
          </div>
        );
      case "confirmed":
        return (
          <div className="inline-flex flex-wrap justify-end gap-2">
            {pdfLink(o)}
            <button
              type="button"
              onClick={() => setDialog({ order: o, target: "processing" })}
              className={BTN_PRIMARY}
            >
              <ArrowRight className="h-[14px] w-[14px]" />
              Proses
            </button>
          </div>
        );
      case "processing":
        return (
          <div className="inline-flex flex-wrap justify-end gap-2">
            {pdfLink(o)}
            <button
              type="button"
              onClick={() => setDialog({ order: o, target: "shipped" })}
              className={BTN_PRIMARY}
            >
              <Truck className="h-[14px] w-[14px]" />
              Kirim
            </button>
          </div>
        );
      case "shipped":
        return (
          <div className="inline-flex flex-wrap justify-end gap-2">
            {pdfLink(o)}
            <button
              type="button"
              onClick={() => setDialog({ order: o, target: "completed" })}
              className={BTN_PRIMARY}
            >
              <Check className="h-[14px] w-[14px]" />
              Selesai
            </button>
          </div>
        );
      case "completed":
        return pdfLink(o);
      default:
        return <span className="text-[12.5px] text-gray-300">—</span>;
    }
  }

  return (
    <div className="animate-[rmx-fade_.3s_ease]">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Pesanan
        </h1>
        <p className="mt-0.5 text-[14.5px] text-gray-500">
          Konfirmasi, proses, dan lacak pengiriman pesanan
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "inline-flex h-[38px] items-center gap-2 rounded-pill border px-3.5 text-[13px] font-semibold",
                active
                  ? "border-brand bg-brand-subtle text-brand"
                  : "border-admin-border bg-white text-gray-600 hover:bg-gray-50",
              )}
            >
              <span className={cn("h-[7px] w-[7px] rounded-full", f.dot)} />
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-card border border-admin-border bg-white">
        <div className="rmx-scrollbar overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-[#FAFBFC]">
                <th className={TH}>Order</th>
                <th className={TH}>Tanggal</th>
                <th className={TH}>Customer</th>
                <th className={TH}>Item</th>
                <th className={TH}>Total</th>
                <th className={TH}>Pengiriman</th>
                <th className={TH}>Status</th>
                <th className={cn(TH, "text-right")}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-14 text-center text-[14px] text-gray-400"
                  >
                    Belum ada pesanan.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-gray-50 align-top hover:bg-[#FAFBFC]"
                  >
                    <td className="px-4 py-3.5 font-mono text-[12.5px] font-bold text-ink">
                      {o.ref}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] whitespace-nowrap text-gray-600">
                      {formatDate(o.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-gray-600">
                      {o.customerEmail}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex max-w-[260px] flex-col items-start gap-1">
                        {o.items.slice(0, ITEM_PREVIEW_COUNT).map((it, idx) => (
                          <div
                            key={`${it.sku}-${idx}`}
                            className="flex w-full items-center gap-2 text-[13px] text-ink"
                          >
                            <OrderItemThumb
                              src={productImages[it.productSlug] ?? null}
                              alt={it.name}
                              size={32}
                            />
                            <span className="min-w-0 flex-1 truncate font-semibold">
                              {it.name}
                              <span className="font-normal text-gray-400">
                                {optionsLabel(it.options)}
                              </span>
                            </span>
                            <span className="font-mono whitespace-nowrap text-gray-500">
                              ×{it.qty}
                            </span>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setDetailId(o.id)}
                          className="mt-0.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline"
                        >
                          {o.items.length > ITEM_PREVIEW_COUNT
                            ? `+${o.items.length - ITEM_PREVIEW_COUNT} lainnya · Lihat detail`
                            : "Lihat detail"}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-mono text-[13.5px] font-bold text-brand">
                        {formatPrice(o.grandTotal)}
                      </div>
                      <div className="mt-0.5 text-[11px] text-gray-400">
                        Subtotal {formatPrice(o.estimatedTotal)} · Ongkir {formatPrice(o.shippingCost)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[12.5px] text-gray-600">
                      <div className="font-semibold text-ink">
                        {o.destination.recipientName || "—"}
                      </div>
                      {o.destination.villageName ? (
                        <>
                          <div className="mt-0.5 max-w-[220px] leading-snug text-gray-500">
                            {o.destination.addressDetail}, {o.destination.villageName}, {o.destination.districtName}, {o.destination.regencyName}
                          </div>
                          <div className="mt-1 font-mono text-[11px] text-gray-400">
                            {o.courierService || o.courierCode || "Kurir belum dipilih"} · {(o.totalWeightGrams / 1000).toFixed(2)} kg
                          </div>
                        </>
                      ) : null}
                      {o.status !== "completed" && o.status !== "rejected" ? (
                        <button
                          type="button"
                          onClick={() => setShippingDialog(o)}
                          className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-btn border border-admin-border bg-white px-2.5 text-[11.5px] font-semibold text-gray-600 hover:text-ink"
                        >
                          <Pencil className="h-3 w-3" />
                          Ubah ongkir
                        </button>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={o.status} />
                      {o.resi ? (
                        <div className="mt-1 font-mono text-[11px] text-gray-400">
                          {o.courier} · {o.resi}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5 text-right">{renderActions(o)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdvanceOrderDialog
        order={dialog?.order ?? null}
        target={dialog?.target ?? null}
        onClose={() => setDialog(null)}
        onDone={patchOrder}
      />
      <ShippingOverrideDialog
        order={shippingDialog}
        onClose={() => setShippingDialog(null)}
        onDone={patchOrder}
      />
      <OrderDetailDialog
        order={detailOrder}
        productImages={productImages}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}
