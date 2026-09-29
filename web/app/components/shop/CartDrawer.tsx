"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useStore } from "../../lib/store";
import ProductIcon from "../inventory/ProductIcon";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, updateCartQuantity, removeFromCart, clearCart } = useStore();

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const freeShippingThreshold = 150;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fadeIn"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0d1525] border-l border-[#263B6A] shadow-2xl flex flex-col z-10 animate-slideRight">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#263B6A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#A0D585]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="text-base font-bold text-white">Your Shopping Cart</h3>
            <span className="text-xs text-[#6984A9]">({cart.length} items)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#6984A9] hover:text-white hover:bg-[#131e36] transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Free shipping progress */}
        <div className="px-5 py-3 bg-[#131e36]/70 border-b border-[#263B6A]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#6984A9]">
              {isFreeShipping ? (
                <span className="text-[#A0D585] font-semibold">Free Express Shipping Unlocked!</span>
              ) : (
                <span>Add <strong className="text-[#EEFABD]">${amountToFreeShipping.toFixed(2)}</strong> for free shipping</span>
              )}
            </span>
            <span className="text-[10px] font-mono text-[#6984A9]">$150.00 goal</span>
          </div>
          <div className="w-full h-1.5 bg-[#0d1525] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6984A9] to-[#A0D585] transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 inventory-scroll">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#6984A9]">
              <div className="w-14 h-14 rounded-2xl bg-[#131e36] border border-[#263B6A] flex items-center justify-center mb-3 text-[#6984A9]">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h4 className="text-white font-bold text-sm mb-1">Your cart is empty</h4>
              <p className="text-xs max-w-xs mb-4">
                Explore our catalog for GPS telematics, rugged scanners, and dispatch gear.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] text-[#A0D585] hover:text-[#EEFABD] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Browse Products
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const imageSrc = item.product.image?.startsWith("/")
                ? item.product.image
                : `/products/${item.product.image}.jpg`;

              return (
                <div
                  key={item.product.id}
                  className="p-3 bg-[#131e36]/60 border border-[#263B6A] rounded-xl flex items-center gap-3 group hover:border-[#6984A9]/70 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-lg bg-[#0d1525] border border-[#263B6A] overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <img
                      src={imageSrc}
                      alt={item.product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        // Fallback to placeholder if image fails
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center -z-10 text-[#A0D585]">
                      <ProductIcon name={item.product.image || item.product.name} className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-[#EEFABD] transition-colors">
                      {item.product.name}
                    </h4>
                    <span className="font-mono text-[10px] text-[#6984A9] block mb-1">
                      {item.product.sku}
                    </span>
                    <span className="text-xs font-black text-[#A0D585]">
                      ${item.product.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Quantity & Remove */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-[#6984A9] hover:text-rose-400 text-xs transition-colors p-0.5 cursor-pointer"
                      title="Remove item"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    <div className="flex items-center border border-[#263B6A] rounded-lg bg-[#0d1525] overflow-hidden">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="px-2 py-0.5 text-xs text-[#6984A9] hover:text-white hover:bg-[#131e36] transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold text-white font-mono min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="px-2 py-0.5 text-xs text-[#6984A9] hover:text-white hover:bg-[#131e36] transition-colors cursor-pointer disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#263B6A] bg-[#0d1525] space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[#6984A9]">
                <span>Items Subtotal:</span>
                <span className="text-white font-mono font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-[#6984A9]">
                <span>Delivery:</span>
                <span className={isFreeShipping ? "text-[#A0D585] font-semibold" : "text-white font-mono"}>
                  {isFreeShipping ? "FREE" : "$12.00"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-[#263B6A]/50">
                <span className="text-white">Estimated Total:</span>
                <span className="text-[#EEFABD] text-base font-black font-mono">
                  ${(subtotal + (isFreeShipping ? 0 : 12)).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={clearCart}
                className="px-3 py-2.5 rounded-lg bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] text-[#6984A9] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Clear Cart
              </button>
              <Link
                href="/checkout"
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] font-bold text-xs transition-colors cursor-pointer shadow-lg"
              >
                <span>Checkout</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
