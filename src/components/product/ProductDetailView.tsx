"use client";

import { CreditCard, Info, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Badge } from "@/components/ui/Badge";
import { useCheckout } from "@/hooks/useCheckout";
import { BADGE_LABELS } from "@/lib/data/catalog";
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
import type { Category } from "@/types/category";
import type { Product, ProductDetail } from "@/types/product";

interface ProductDetailViewProps {
  product: ProductDetail;
  category: Category;
  related: Product[];
}

export function ProductDetailView({
  product,
  category,
  related,
}: ProductDetailViewProps): React.JSX.Element {
  const { add } = useCart();
  const { checkout, pending } = useCheckout();
  const step = 1;

  // Option dimensions come from the product; fall back to the category for
  // legacy products that don't define their own options/variants.
  const productDims = productOptions(
    product.colors,
    product.sizes,
    product.customVariants,
  );
  const dims =
    productDims.length > 0
      ? productDims
      : productOptions(category.colors, category.sizes, []);

  const [qty, setQty] = React.useState(1);
  const [selected, setSelected] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(dims.map((d) => [d.name, d.values[0]])),
  );

  const finalQty = qty;
  const hasVariants = product.variants.length > 0;
  const variant = hasVariants
    ? findVariant(product.variants, selected)
    : undefined;

  const unitPrice = variant
    ? variantPrice(variant, product.price)
    : priceFrom(product.variants, product.price);

  // Stock for the current selection: variant stock, else product-level stock.
  const selectionStock = hasVariants ? (variant?.stock ?? null) : product.stock;
  // Sold out when the matched variant (or simple product) is at 0, or when a
  // variable product has no variant for the chosen combination.
  const soldOut = hasVariants
    ? !variant || (variant.stock !== null && variant.stock <= 0)
    : product.stock !== null && product.stock <= 0;

  // Clamp qty when variant/stock changes (e.g. user switches to a variant with lower stock)
  React.useEffect(() => {
    if (selectionStock !== null && selectionStock > 0 && qty > selectionStock) {
      setQty(selectionStock);
    }
  }, [selectionStock]); // eslint-disable-line react-hooks/exhaustive-deps

  const specs: { k: string; v: string }[] = [
    { k: "Bahan", v: category.material },
    { k: "Metode Branding", v: category.branding },
    { k: "Kategori", v: category.name },
  ];

  // Gallery images: full set from Hygraph, falling back to the primary image.
  const galleryImages =
    product.images.length > 0
      ? product.images
      : product.imageUrl
        ? [product.imageUrl]
        : [];

  function addToCart(): void {
    if (soldOut) return;
    const base: Product = {
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      short: product.short,
      categorySlug: product.categorySlug,
      price: product.price,
      stock: product.stock,
      badge: product.badge,
      imageUrl: product.imageUrl,
      keywords: product.keywords ?? "",
      hasOptions: product.hasOptions,
    };
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
    add(base, finalQty, cartVariant);
  }

  function handleCheckout(): void {
    if (soldOut) return;
    const base: Product = {
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      short: product.short,
      categorySlug: product.categorySlug,
      price: product.price,
      stock: product.stock,
      badge: product.badge,
      imageUrl: product.imageUrl,
      keywords: product.keywords ?? "",
      hasOptions: product.hasOptions,
    };
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
    void checkout({ product: base, qty: finalQty, variant: cartVariant });
  }

  return (
    <div className="mx-auto max-w-[1280px] animate-[rmx-fade_.3s_ease] px-6 pt-[22px] pb-12">
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <ProductGallery images={galleryImages} alt={product.name} />

        {/* Info */}
        <div>
          <div className="mb-3 flex gap-2">
            {product.badge && (
              <Badge variant={product.badge}>
                {BADGE_LABELS[product.badge]}
              </Badge>
            )}
            <Link
              href={`/categories/${category.slug}`}
              className="inline-flex items-center rounded-pill bg-gray-100 px-3.5 py-1.5 text-[11.5px] font-semibold text-gray-600"
            >
              {category.name}
            </Link>
          </div>

          <h1 className="text-[26px] leading-tight font-semibold tracking-tight text-ink sm:text-[30px]">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-2.5 border-b border-gray-200 pb-4">
            <span className="text-[13px] text-muted">Mulai dari</span>
            <span className="font-mono text-[32px] font-bold text-brand">
              {formatPrice(unitPrice)}
            </span>
            <span className="text-[13px] text-muted">/pcs</span>
          </div>

          {hasVariants && !variant ? (
            <div className="mt-3 mb-[14px] text-[13px] font-semibold text-red-500">
              Kombinasi tidak tersedia
            </div>
          ) : (
            <div className="mb-[18px]" />
          )}

          {/* Options */}
          {dims.map((dim) => (
            <div key={dim.name} className="mb-[18px]">
              <div className="mb-2.5 text-[13px] font-bold text-ink">
                {dim.name === COLOR_DIMENSION ? "Pilihan Warna" : dim.name}
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
                        "h-11 min-w-[48px] rounded-btn border px-3.5 text-sm font-medium",
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
          <div className="mb-[22px] flex items-center gap-3.5">
            <div className="text-[13px] font-bold text-ink">Jumlah</div>
            <div className="inline-flex items-center overflow-hidden rounded-btn border border-gray-200">
              <button
                type="button"
                aria-label="Kurangi"
                onClick={() => setQty(Math.max(1, finalQty - step))}
                className="h-[46px] w-11 bg-white text-xl text-gray-600 hover:bg-gray-50"
              >
                −
              </button>
              <input
                value={finalQty}
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
                className="h-[46px] w-16 border-x border-gray-200 text-center font-mono text-base font-bold outline-none"
              />
              <button
                type="button"
                aria-label="Tambah"
                disabled={
                  selectionStock !== null && finalQty >= selectionStock
                }
                onClick={() =>
                  setQty(
                    selectionStock !== null
                      ? Math.min(finalQty + step, selectionStock)
                      : finalQty + step,
                  )
                }
                className="h-[46px] w-11 bg-white text-xl text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>
            <span className="text-[12.5px] text-gray-400">pcs</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={soldOut || pending}
              onClick={handleCheckout}
              className={cn(
                "inline-flex h-[54px] min-w-[200px] flex-1 items-center justify-center gap-2.5 rounded-btn text-base font-medium shadow-cta transition-colors",
                soldOut
                  ? "cursor-not-allowed bg-gray-200 text-gray-400 shadow-none"
                  : "bg-brand text-white hover:bg-brand-hover disabled:opacity-60",
              )}
            >
              <CreditCard className="h-5 w-5" />
              {soldOut ? "Stok Habis" : pending ? "Memproses…" : "Checkout"}
            </button>
            <button
              type="button"
              disabled={soldOut}
              onClick={addToCart}
              className={cn(
                "inline-flex h-[54px] flex-none items-center justify-center gap-2.5 rounded-btn border px-6 text-[15.5px] font-medium",
                soldOut
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : "border-gray-200 bg-white text-ink hover:border-border-strong",
              )}
            >
              <ShoppingCart className="h-[19px] w-[19px]" />
              {soldOut ? "Stok Habis" : "Tambah ke Keranjang"}
            </button>
          </div>

          {/* Trust row */}
          <div className="mt-[22px] flex flex-wrap gap-5 px-[18px] py-4">
            <div className="flex items-center gap-2.5 text-[13.5px] text-gray-700">
              <Truck className="h-[17px] w-[17px] text-brand" />
              Kirim seluruh Indonesia
            </div>
            <div className="flex items-center gap-2.5 text-[13.5px] text-gray-700">
              <ShieldCheck className="h-[17px] w-[17px] text-brand" />
              Garansi kualitas
            </div>
            <div className="flex items-center gap-2 rounded-[8px] bg-amber-50 px-2.5 py-1 text-[13.5px] font-semibold text-amber-700">
              <Info className="h-[16px] w-[16px] flex-none text-amber-500" />
              Harga belum termasuk ongkir
            </div>
          </div>
        </div>
      </div>

      {/* Description + Specs */}
      <div className="mt-11 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-gray-200 p-6.5">
          <h3 className="mb-3 text-lg font-semibold text-ink">Deskripsi</h3>
          <p className="text-[15px] leading-relaxed text-gray-600">
            {product.description || category.description}
          </p>
        </div>
        <div className="rounded-card border border-gray-200 p-6.5">
          <h3 className="mb-3.5 text-lg font-semibold text-ink">
            Spesifikasi
          </h3>
          <div className="flex flex-col">
            {specs.map((s) => (
              <div
                key={s.k}
                className="flex justify-between gap-4 border-b border-gray-200 py-[11px] last:border-b-0"
              >
                <span className="text-sm text-muted">{s.k}</span>
                <span className="text-right text-sm font-semibold text-ink">
                  {s.v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-13">
        <h2 className="mb-[18px] text-[22px] font-semibold tracking-tight text-ink">
          Rekomendasi Produk
        </h2>
        <ProductGrid products={related} />
      </div>

      {/* Mobile sticky buy bar */}
      <div className="fixed right-0 bottom-0 left-0 z-[60] flex items-center gap-3 border-t border-gray-200 bg-white p-3 shadow-[0_-6px_24px_rgba(0,14,53,0.08)] lg:hidden">
        <div className="flex-none">
          <div className="text-[11px] text-muted">Mulai</div>
          <div className="font-mono text-[19px] font-extrabold text-brand">
            {formatPrice(unitPrice)}
          </div>
        </div>
        <button
          type="button"
          aria-label="Tambah ke keranjang"
          disabled={soldOut}
          onClick={addToCart}
          className={cn(
            "flex h-[50px] w-[52px] flex-none items-center justify-center rounded-btn border",
            soldOut
              ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
              : "border-gray-200 bg-white text-ink",
          )}
        >
          <ShoppingCart className="h-5 w-5" />
        </button>
        <button
          type="button"
          disabled={soldOut || pending}
          onClick={handleCheckout}
          className={cn(
            "inline-flex h-[50px] flex-1 items-center justify-center gap-2.5 rounded-btn text-[15.5px] font-medium",
            soldOut
              ? "cursor-not-allowed bg-gray-200 text-gray-400"
              : "bg-brand text-white disabled:opacity-60",
          )}
        >
          <CreditCard className="h-[19px] w-[19px]" />
          {soldOut ? "Stok Habis" : pending ? "Memproses…" : "Checkout"}
        </button>
      </div>
    </div>
  );
}
