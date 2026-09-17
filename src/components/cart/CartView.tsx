"use client";

import {
  CreditCard,
  Info,
  Lock,
  LogIn,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { createOrder } from "@/actions/orders";
import { trackWaClick } from "@/actions/tracking";
import { CheckoutAddressBook } from "@/components/cart/CheckoutAddressBook";
import { ShippingDestinationForm } from "@/components/cart/ShippingDestinationForm";
import { ShippingRateCard } from "@/components/cart/ShippingRateCard";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { useShipping } from "@/hooks/useShipping";
import { categoryName } from "@/lib/catalog";
import { formatEstimation, formatKg, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { cartMessage, waLink } from "@/lib/whatsapp";
import {
  lineKey,
  lineUnitPrice,
  useCart,
  type CartLine,
} from "@/providers/CartProvider";

import type { CustomerAddress } from "@/types/address";
import type { RegionOption } from "@/types/shipping";

/** Stock for a cart line: variant stock when present, else product-level stock. */
function lineStock(line: CartLine): number | null {
  if (line.variant) return line.variant.stock ?? null;
  return line.product.stock;
}

interface CartViewProps {
  isAuthenticated: boolean;
  userEmail: string | null;
  initialProvinces: RegionOption[];
  savedAddresses: CustomerAddress[];
}

export function CartView({
  isAuthenticated,
  userEmail,
  initialProvinces,
  savedAddresses,
}: CartViewProps): React.JSX.Element {
  const {
    lines,
    count,
    totalQty,
    estimatedTotal,
    hydrated,
    setQty,
    remove,
    clear,
    sessionId,
  } = useCart();
  const router = useRouter();
  const defaultAddress =
    savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0] ?? null;
  const [addressMode, setAddressMode] = React.useState<"saved" | "new">(
    defaultAddress ? "saved" : "new",
  );
  const [selectedAddressId, setSelectedAddressId] = React.useState(
    defaultAddress?.id ?? "",
  );
  const [checkingOut, setCheckingOut] = React.useState(false);
  const shipping = useShipping(
    initialProvinces,
    lines.map((l) => ({ sku: lineKey(l), qty: l.qty })),
    defaultAddress,
    isAuthenticated,
  );
  const shippingCost = shipping.rate?.price ?? 0;
  const grandTotal = estimatedTotal + shippingCost;
  const manualOngkir =
    shipping.ratesStatus === "error" || shipping.ratesStatus === "empty";
  // "idle" while a village is already selected = a quote is queued (the cart is
  // still hydrating), so treat it as in-flight rather than as a missing address.
  const quoting =
    shipping.canQuote &&
    (shipping.ratesStatus === "loading" ||
      (shipping.ratesStatus === "idle" && !!shipping.selected.village));
  const checkoutReady =
    !!shipping.destination && !quoting && (!!shipping.rate || manualOngkir);

  async function handleSignOut(): Promise<void> {
    await createClient().auth.signOut();
    router.refresh();
  }

  async function handleCheckout(): Promise<void> {
    if (!shipping.destination) {
      toast.error("Lengkapi alamat pengiriman");
      return;
    }
    if (!shipping.rate && !manualOngkir) {
      toast.error("Ongkir sedang dihitung, tunggu sebentar");
      return;
    }

    setCheckingOut(true);
    const res = await createOrder({
      sessionId,
      items: lines.map((l) => ({
        sku: lineKey(l),
        productSku: l.product.sku,
        productSlug: l.product.slug,
        name: l.product.name,
        options: l.variant?.options ?? {},
        qty: l.qty,
        unitPrice: lineUnitPrice(l),
      })),
      destination: shipping.destination,
      courierCode: shipping.rate?.courierCode ?? "",
      courierService: shipping.rate?.courierName ?? "",
    });
    if (!res.success || !res.data) {
      toast.error(res.message);
      setCheckingOut(false);
      return;
    }
    const href = waLink(
      cartMessage(
        lines.map((l) => ({
          product: l.product,
          qty: l.qty,
          options: l.variant?.options,
          unitPrice: lineUnitPrice(l),
        })),
        res.data.ref,
        {
          recipientName: shipping.destination.recipientName,
          recipientPhone: shipping.destination.recipientPhone,
          addressDetail: shipping.destination.addressDetail,
          destinationLabel: shipping.destinationLabel,
          courier: res.data.courierService || shipping.rate?.courierName || "",
          subtotal: estimatedTotal,
          shippingCost: res.data.shippingCost,
          grandTotal: res.data.grandTotal,
        },
      ),
    );
    void trackWaClick(undefined, sessionId);
    clear();
    window.location.href = href;
  }

  return (
    <div className="mx-auto max-w-[1280px] animate-[rmx-fade_.3s_ease] px-6 pt-6 pb-24">
      <div className="mb-4">
        <Breadcrumb
          items={[{ label: "Beranda", href: "/" }, { label: "Keranjang" }]}
        />
      </div>
      <h1 className="text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">
        Keranjang Penawaran
      </h1>
      <p className="mt-2 mb-8 text-[15px] text-muted">
        Kirim daftar produk ini ke tim kami untuk mendapatkan penawaran harga
        (quotation).
      </p>

      {!hydrated ? (
        <div className="min-h-[240px]" />
      ) : lines.length === 0 ? (
        <div className="rounded-card border border-hairline px-5 py-20 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[22px] bg-surface-soft text-muted-soft">
            <ShoppingCart className="h-[38px] w-[38px]" />
          </div>
          <div className="mb-1.5 text-xl font-semibold text-ink">
            Keranjang masih kosong
          </div>
          <div className="mx-auto mb-6 max-w-[360px] text-[14.5px] text-muted">
            Jelajahi katalog dan tambahkan produk yang ingin Anda tanyakan
            penawarannya.
          </div>
          <Link
            href="/search"
            className="inline-flex h-[50px] items-center rounded-btn bg-brand px-6 text-[15px] font-medium text-white hover:bg-brand-hover"
          >
            Jelajahi Produk
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {lines.map((line) => {
              const step = 1;
              const key = lineKey(line);
              const unitPrice = lineUnitPrice(line);
              return (
                <div
                  key={key}
                  className="flex flex-wrap items-center gap-4 rounded-card border border-hairline bg-white p-4"
                >
                  <Link
                    href={`/products/${line.product.slug}`}
                    className="relative flex h-[84px] w-[84px] flex-none items-center justify-center overflow-hidden rounded-[12px] bg-surface-soft text-center text-[10px] font-bold text-muted-soft"
                  >
                    {line.product.imageUrl ? (
                      <Image
                        src={line.product.imageUrl}
                        alt={line.product.name}
                        fill
                        sizes="84px"
                        className="object-cover"
                      />
                    ) : (
                      line.product.short
                    )}
                  </Link>

                  <div className="min-w-[160px] flex-1">
                    <div className="text-[11px] font-semibold tracking-[0.05em] text-muted-soft uppercase">
                      {categoryName(line.product.categorySlug)}
                    </div>
                    <Link
                      href={`/products/${line.product.slug}`}
                      className="my-0.5 block text-base font-semibold text-ink"
                    >
                      {line.product.name}
                    </Link>
                    {line.variant &&
                      Object.keys(line.variant.options).length > 0 && (
                        <div className="mt-1 mb-0.5 flex flex-wrap gap-1.5">
                          {Object.entries(line.variant.options).map(
                            ([k, v]) => (
                              <span
                                key={k}
                                className="inline-flex items-center rounded-pill bg-surface-soft px-2.5 py-0.5 text-[11.5px] font-semibold text-body"
                              >
                                {k}: {v}
                              </span>
                            ),
                          )}
                        </div>
                      )}
                    <div className="text-[13px] text-muted">
                      SKU {line.variant?.sku ?? line.product.sku} ·{" "}
                      <span className="font-semibold text-ink">
                        {formatPrice(unitPrice)}
                      </span>
                      /pcs
                    </div>
                    {(() => {
                      const stock = lineStock(line);
                      if (stock === null) return null;
                      return (
                        <div
                          className={cn(
                            "mt-1 text-[12px] font-semibold",
                            stock > 0 ? "text-green-600" : "text-red-500",
                          )}
                        >
                          {stock > 0
                            ? `Stok tersedia: ${stock} pcs`
                            : "Stok habis"}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex flex-col items-end gap-2.5">
                    <div className="inline-flex items-center overflow-hidden rounded-btn border border-hairline">
                      <button
                        type="button"
                        aria-label="Kurangi"
                        onClick={() => setQty(key, line.qty - step)}
                        className="h-[42px] w-[38px] bg-white text-lg text-body hover:bg-surface-soft"
                      >
                        −
                      </button>
                      <input
                        value={line.qty}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          const clamped = Number.isNaN(v) || v < 1 ? 1 : v;
                          const stock = lineStock(line);
                          setQty(
                            key,
                            stock !== null ? Math.min(clamped, stock) : clamped,
                          );
                        }}
                        inputMode="numeric"
                        aria-label={`Jumlah ${line.product.name}`}
                        className="h-[42px] w-[60px] border-x border-hairline text-center font-mono text-[15px] font-bold text-ink outline-none"
                      />
                      <button
                        type="button"
                        aria-label="Tambah"
                        disabled={(() => {
                          const stock = lineStock(line);
                          return stock !== null && line.qty >= stock;
                        })()}
                        onClick={() => {
                          const stock = lineStock(line);
                          setQty(
                            key,
                            stock !== null
                              ? Math.min(line.qty + step, stock)
                              : line.qty + step,
                          );
                        }}
                        className="h-[42px] w-[38px] bg-white text-lg text-body hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(key)}
                      className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-soft hover:text-brand"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col gap-6">
              <CheckoutAddressBook
                addresses={savedAddresses}
                selectedId={selectedAddressId}
                mode={addressMode}
                shipping={shipping}
                onSelect={(id) => {
                  setSelectedAddressId(id);
                  setAddressMode("saved");
                }}
                onNew={() => {
                  setSelectedAddressId("");
                  setAddressMode("new");
                  shipping.resetDestination();
                }}
              />
              {addressMode === "new" ? (
                <ShippingDestinationForm shipping={shipping} />
              ) : null}
              <ShippingRateCard shipping={shipping} />
            </div>

            <div className="flex flex-col gap-6 lg:sticky lg:top-[90px]">
              {/* Summary */}
              <div className="rounded-card border border-hairline bg-white p-6">
                <h3 className="mb-4 text-lg font-semibold text-ink">
                  Ringkasan Checkout
                </h3>
                <SummaryRow label="Jumlah jenis produk" value={String(count)} />
                <SummaryRow
                  label="Estimasi total qty"
                  value={`${totalQty} pcs`}
                />
                <SummaryRow
                  label="Subtotal produk"
                  value={formatPrice(estimatedTotal)}
                />
                <SummaryRow
                  label="Ongkir JNE Express"
                  value={
                    shipping.rate
                      ? formatPrice(shippingCost)
                      : !isAuthenticated
                        ? "Login dulu"
                        : quoting
                          ? "Menghitung…"
                          : manualOngkir
                            ? "Konfirmasi manual"
                            : "Isi alamat dulu"
                  }
                />
                <div className="flex items-center justify-between pt-4 pb-1">
                  <span className="text-[14.5px] font-semibold text-ink">
                    Total
                  </span>
                  <span className="font-mono text-xl font-extrabold text-brand">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
                {shipping.rate ? (
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-soft">
                    {shipping.rate.courierName}
                    {formatEstimation(shipping.rate.estimation)
                      ? ` · estimasi ${formatEstimation(shipping.rate.estimation)}`
                      : ""}
                    {shipping.weightGrams > 0
                      ? ` · ${formatKg(shipping.weightGrams)}`
                      : ""}
                  </p>
                ) : (
                  <div className="mt-4 flex items-center gap-2 rounded-[10px] bg-warning-subtle px-3 py-2.5 text-[13px] font-semibold text-warning-fg">
                    <Info className="h-4 w-4 flex-none" />
                    {!isAuthenticated
                      ? "Login untuk menghitung ongkir JNE otomatis."
                      : quoting
                        ? "Ongkir JNE sedang dihitung otomatis…"
                        : manualOngkir
                          ? "Ongkir akan dikonfirmasi tim via WhatsApp."
                          : "Lengkapi alamat — ongkir JNE terisi otomatis."}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col justify-center gap-3 rounded-card border border-hairline bg-white p-6">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => void handleCheckout()}
                    disabled={checkingOut || !checkoutReady}
                    className="inline-flex h-14 items-center justify-center gap-2.5 rounded-btn bg-brand text-[16.5px] font-medium text-white shadow-cta hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CreditCard className="h-[21px] w-[21px]" />
                    {checkingOut
                      ? "Memproses…"
                      : quoting
                        ? "Menghitung ongkir…"
                        : manualOngkir && !shipping.rate
                          ? "Checkout (Ongkir Manual)"
                          : "Checkout"}
                  </button>
                ) : (
                  <Link
                    href="/account/login?next=/cart"
                    className="inline-flex h-14 items-center justify-center gap-2.5 rounded-btn bg-brand text-[16.5px] font-medium text-white shadow-cta hover:bg-brand-hover"
                  >
                    <LogIn className="h-[20px] w-[20px]" />
                    Login untuk Checkout
                  </Link>
                )}
                <Link
                  href="/search"
                  className="inline-flex h-[52px] items-center justify-center rounded-btn border border-hairline bg-white text-[15px] font-medium text-ink hover:border-border-strong"
                >
                  Lanjut Belanja
                </Link>
                {isAuthenticated ? (
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-[12.5px] text-muted">
                    <span className="truncate">
                      Masuk sebagai{" "}
                      <span className="font-semibold text-body">
                        {userEmail}
                      </span>
                    </span>
                    <span aria-hidden>·</span>
                    <button
                      type="button"
                      onClick={() => void handleSignOut()}
                      className="font-semibold text-body underline underline-offset-2 hover:text-brand"
                    >
                      Keluar
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center justify-center gap-2 text-[12.5px] text-muted">
                    <Lock className="h-[13px] w-[13px]" />
                    Login diperlukan untuk checkout
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between border-b border-hairline py-3">
      <span className="text-[14.5px] text-muted">{label}</span>
      <span className="font-mono text-[15px] font-bold text-ink">{value}</span>
    </div>
  );
}
