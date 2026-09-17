"use client";

import { CreditCard, Loader2, ShoppingCart, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { createPortal } from "react-dom";

import { getProductOptions } from "@/actions/products";
import { useCheckout } from "@/hooks/useCheckout";
import { categoryName } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  COLOR_DIMENSION,
  findVariant,
  priceFrom,
  productOptions,
  variantPrice,
  variantTitle,
} from "@/lib/variants";
import { useCart } from "@/providers/CartProvider";
import type { Product, ProductDetail } from "@/types/product";

interface QuickAddSheetProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

type LoadStatus = "loading" | "error" | "ready";

/**
 * Variant picker shown when a card's add-to-cart / checkout is triggered for a
 * product that has options. Bottom sheet on mobile, centered dialog on desktop.
 * The option/variant matrix (omitted from the lean catalog list) is fetched on
 * demand, then the user picks options + quantity before the line is committed.
 */
export function QuickAddSheet({
  product,
  open,
  onClose,
}: QuickAddSheetProps): React.ReactNode {
  const { add } = useCart();
  const { checkout, pending } = useCheckout();

  const [mounted, setMounted] = React.useState(false);
  const [detail, setDetail] = React.useState<ProductDetail | null>(null);
  const [status, setStatus] = React.useState<LoadStatus>("loading");
  const [selected, setSelected] = React.useState<Record<string, string>>({});
  const [qty, setQty] = React.useState(1);
  const loadedSlug = React.useRef<string | null>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setMounted(true), []);

  // Load the option/variant matrix on demand when the sheet opens; cached per
  // product so reopening the same card is instant.
  React.useEffect(() => {
    if (!open) return;
    if (loadedSlug.current === product.slug && detail) {
      setStatus("ready");
      return;
    }
    let active = true;
    setStatus("loading");
    void getProductOptions(product.slug)
      .then((res) => {
        if (!active) return;
        if (res.success && res.data) {
          setDetail(res.data);
          loadedSlug.current = product.slug;
          setStatus("ready");
        } else {
          setStatus("error");
        }
      })
      .catch(() => {
        // Never leave a rejected action unhandled — show the graceful error
        // state (with a link to the product page) instead of an uncaught error.
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [open, product.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const dims = React.useMemo(
    () =>
      detail
        ? productOptions(detail.colors, detail.sizes, detail.customVariants)
        : [],
    [detail],
  );

  // Reset the selection to the first value of each dimension when a new
  // product's options arrive.
  React.useEffect(() => {
    if (!detail) return;
    setSelected(Object.fromEntries(dims.map((d) => [d.name, d.values[0]])));
    setQty(1);
  }, [detail, dims]);

  // Escape-to-close + scroll lock while open.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  const variants = detail?.variants ?? [];
  const hasVariants = variants.length > 0;
  const variant = hasVariants ? findVariant(variants, selected) : undefined;
  const basePrice = detail?.price ?? product.price;
  const unitPrice = variant
    ? variantPrice(variant, basePrice)
    : priceFrom(variants, basePrice);
  const baseStock = detail?.stock ?? product.stock;
  const selectionStock = hasVariants ? (variant?.stock ?? null) : baseStock;
  const soldOut = hasVariants
    ? !variant || (variant.stock !== null && variant.stock <= 0)
    : baseStock !== null && baseStock <= 0;

  // Clamp qty down when the selected variant has less stock than the current qty.
  React.useEffect(() => {
    if (selectionStock !== null && selectionStock > 0 && qty > selectionStock) {
      setQty(selectionStock);
    }
  }, [selectionStock, qty]);

  function handleAdd(): void {
    if (soldOut || status !== "ready") return;
    const cartVariant =
      hasVariants && variant
        ? {
            sku: variant.sku,
            title: variant.title || variantTitle(variant.options),
            price: unitPrice,
            options: variant.options,
            stock: variant.stock ?? null,
          }
        : undefined;
    add(product, qty, cartVariant);
    onClose();
  }

  function handleCheckout(): void {
    if (soldOut || status !== "ready") return;
    const cartVariant =
      hasVariants && variant
        ? {
            sku: variant.sku,
            title: variant.title || variantTitle(variant.options),
            price: unitPrice,
            options: variant.options,
            stock: variant.stock ?? null,
          }
        : undefined;
    void checkout({ product, qty, variant: cartVariant });
  }

  if (!mounted || !open) return null;

  const disabled = soldOut || pending || status !== "ready";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quickadd-title"
    >
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50 animate-[rmx-fade-in_.2s_ease] motion-reduce:animate-none"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[92vh] w-full flex-col overflow-hidden bg-white shadow-menu outline-none",
          "rounded-t-modal sm:w-[460px] sm:max-w-[calc(100vw-2.5rem)] sm:rounded-modal",
          "animate-[rmx-slide-up_.28s_cubic-bezier(0.22,1,0.36,1)] sm:animate-[rmx-pop_.2s_ease]",
          "motion-reduce:animate-none",
        )}
      >
        {/* Drag handle (mobile bottom-sheet affordance) */}
        <div className="mx-auto mt-2.5 h-1 w-9 flex-none rounded-full bg-gray-200 sm:hidden" />

        {/* Product summary */}
        <div className="flex items-start gap-3.5 px-4 pt-3 pb-4 sm:px-5 sm:pt-5">
          <div className="relative h-16 w-16 flex-none overflow-hidden rounded-btn bg-gray-100">
            {product.imageUrl && (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="type-uppercase-tag text-muted">
              {categoryName(product.categorySlug)}
            </div>
            <h2
              id="quickadd-title"
              className="truncate text-[15.5px] leading-snug font-semibold text-ink"
            >
              {product.name}
            </h2>
            <div className="mt-0.5 font-mono text-[17px] font-bold text-brand">
              {formatPrice(unitPrice)}
              <span className="ml-1 text-[12px] font-normal text-muted">
                /pcs
              </span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="-mr-1 flex h-8 w-8 flex-none items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-ink"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        {status === "error" ? (
          <div className="border-t border-hairline px-4 py-8 text-center sm:px-5">
            <p className="text-[14px] text-muted">
              Gagal memuat pilihan produk.
            </p>
            <Link
              href={`/products/${product.slug}`}
              onClick={onClose}
              className="mt-3 inline-flex h-11 items-center justify-center rounded-btn border border-gray-200 px-5 text-sm font-medium text-ink transition-colors hover:border-border-strong"
            >
              Buka halaman produk
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto border-t border-hairline px-4 py-4 sm:px-5">
              {status === "loading" ? (
                <div className="animate-pulse space-y-5" aria-hidden="true">
                  <div className="space-y-2.5">
                    <div className="h-3 w-24 rounded bg-gray-100" />
                    <div className="flex gap-2.5">
                      <div className="h-11 w-16 rounded-btn bg-gray-100" />
                      <div className="h-11 w-16 rounded-btn bg-gray-100" />
                      <div className="h-11 w-16 rounded-btn bg-gray-100" />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div className="h-3 w-20 rounded bg-gray-100" />
                    <div className="flex gap-2.5">
                      <div className="h-11 w-14 rounded-btn bg-gray-100" />
                      <div className="h-11 w-14 rounded-btn bg-gray-100" />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Option availability */}
                  {hasVariants && !variant ? (
                    <div className="mb-4 text-[13px] font-semibold text-red-500">
                      Kombinasi tidak tersedia
                    </div>
                  ) : null}

                  {/* Option dimensions */}
                  {dims.map((dim) => (
                    <div key={dim.name} className="mb-5">
                      <div className="mb-2.5 text-[13px] font-bold text-ink">
                        {dim.name === COLOR_DIMENSION
                          ? "Pilihan Warna"
                          : dim.name}
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {dim.values.map((value) => {
                          const active = selected[dim.name] === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              aria-pressed={active}
                              onClick={() =>
                                setSelected((s) => ({ ...s, [dim.name]: value }))
                              }
                              className={cn(
                                "h-11 min-w-[48px] rounded-btn border px-3.5 text-sm font-medium transition-colors",
                                active
                                  ? "border-brand bg-brand-subtle text-brand"
                                  : "border-gray-200 bg-white text-ink hover:border-border-strong",
                              )}
                            >
                              {value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Quantity */}
                  <div className="flex items-center gap-3.5">
                    <div className="text-[13px] font-bold text-ink">Jumlah</div>
                    <div className="inline-flex items-center overflow-hidden rounded-btn border border-gray-200">
                      <button
                        type="button"
                        aria-label="Kurangi"
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="h-11 w-11 bg-white text-xl text-gray-600 hover:bg-gray-50"
                      >
                        −
                      </button>
                      <input
                        value={qty}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          const clamped = Number.isNaN(v) || v < 1 ? 1 : v;
                          setQty(
                            selectionStock !== null
                              ? Math.min(clamped, selectionStock)
                              : clamped,
                          );
                        }}
                        inputMode="numeric"
                        aria-label="Jumlah"
                        className="h-11 w-14 border-x border-gray-200 text-center font-mono text-base font-bold outline-none"
                      />
                      <button
                        type="button"
                        aria-label="Tambah"
                        disabled={
                          selectionStock !== null && qty >= selectionStock
                        }
                        onClick={() =>
                          setQty(
                            selectionStock !== null
                              ? Math.min(qty + 1, selectionStock)
                              : qty + 1,
                          )
                        }
                        className="h-11 w-11 bg-white text-xl text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[12.5px] text-gray-400">pcs</span>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-none gap-2.5 border-t border-hairline px-4 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:px-5">
              <button
                type="button"
                disabled={disabled}
                onClick={handleAdd}
                className={cn(
                  "inline-flex h-[52px] flex-1 items-center justify-center gap-2 rounded-btn border text-[15px] font-medium transition-colors",
                  disabled
                    ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                    : "border-gray-200 bg-white text-ink hover:border-border-strong",
                )}
              >
                <ShoppingCart className="h-[18px] w-[18px]" />
                Keranjang
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={handleCheckout}
                className={cn(
                  "inline-flex h-[52px] flex-1 items-center justify-center gap-2 rounded-btn text-[15px] font-medium shadow-cta transition-colors",
                  disabled
                    ? "cursor-not-allowed bg-gray-200 text-gray-400 shadow-none"
                    : "bg-brand text-white hover:bg-brand-hover",
                )}
              >
                {pending ? (
                  <Loader2 className="h-[18px] w-[18px] animate-spin" />
                ) : (
                  <CreditCard className="h-[18px] w-[18px]" />
                )}
                {soldOut ? "Stok Habis" : pending ? "Memproses…" : "Checkout"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
