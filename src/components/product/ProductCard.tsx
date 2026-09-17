"use client";

import { CreditCard, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type ReactElement, useState } from "react";

import { QuickAddSheet } from "@/components/product/QuickAddSheet";
import { Badge } from "@/components/ui/Badge";
import { useCheckout } from "@/hooks/useCheckout";
import { categoryName } from "@/lib/catalog";
import { BADGE_LABELS } from "@/lib/data/catalog";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/providers/CartProvider";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }): ReactElement {
  const { add } = useCart();
  const { checkout, pending } = useCheckout();
  const [pickerOpen, setPickerOpen] = useState(false);
  const href = `/products/${product.slug}`;

  // Products with selectable options (color / size / custom) must be specified
  // before they hit the cart — open the picker instead of adding a bare line.
  function handleCheckout(): void {
    if (product.hasOptions) {
      setPickerOpen(true);
      return;
    }
    void checkout({ product });
  }

  function handleAddToCart(): void {
    if (product.hasOptions) {
      setPickerOpen(true);
      return;
    }
    add(product);
  }

  return (
    <article className="group flex h-full flex-col">
      <Link href={href} className="relative block overflow-hidden rounded-card">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-[#f4f4f6] to-[#e9eaee]">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 1068px) 50vw, (max-width: 1800px) 25vw, 300px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-[56%] w-[56%] items-center justify-center rounded-card bg-[repeating-linear-gradient(45deg,#e4e5e9,#e4e5e9_10px,#eeeef1_10px,#eeeef1_20px)] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)]">
              <span className="px-2 text-center text-xs font-bold tracking-[0.12em] text-gray-300 uppercase">
                {product.short}
              </span>
            </div>
          )}
        </div>
        {product.badge && (
          <span className="absolute top-3 left-3">
            <Badge variant={product.badge}>{BADGE_LABELS[product.badge]}</Badge>
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-[5px] pt-3">
        <span className="type-uppercase-tag text-muted">
          {categoryName(product.categorySlug)}
        </span>
        <Link
          href={href}
          className="text-[16px] leading-snug font-semibold text-ink"
        >
          {product.name}
        </Link>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="font-mono text-[17px] font-bold text-brand">
            {formatPrice(product.price)}
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={handleCheckout}
            className="inline-flex h-[42px] flex-1 items-center justify-center gap-[7px] rounded-btn bg-brand text-[14px] font-medium text-white transition-colors hover:bg-brand-hover disabled:bg-brand-disabled"
          >
            <CreditCard className="h-4 w-4" />
            {pending ? "Memproses…" : "Checkout"}
          </button>
          <button
            type="button"
            aria-label={
              product.hasOptions
                ? `Pilih varian ${product.name}`
                : `Tambah ${product.name} ke keranjang`
            }
            onClick={handleAddToCart}
            className="inline-flex h-[42px] w-[42px] flex-none items-center justify-center rounded-btn border border-gray-200 bg-white text-ink transition-colors hover:border-border-strong"
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {product.hasOptions && (
        <QuickAddSheet
          product={product}
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </article>
  );
}
