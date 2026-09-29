"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "../lib/store";
import ShopNavbar from "../components/shop/ShopNavbar";
import CartDrawer from "../components/shop/CartDrawer";
import WishlistDrawer from "../components/shop/WishlistDrawer";
import ProductIcon from "../components/inventory/ProductIcon";

type CheckoutStep = 1 | 2 | 3 | 4;

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, checkout } = useStore();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("Maurice IRAGABA");
  const [email, setEmail] = useState("maurice@lugica.rw");
  const [phone, setPhone] = useState("+250 788 450 120");
  const [deliveryAddress, setDeliveryAddress] = useState("KG 549 St, House 14, Nyarutarama");
  const [deliverySector, setDeliverySector] = useState("Kigali Central Sector");
  const [shippingMethod, setShippingMethod] = useState<"express" | "standard" | "hub">("express");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mobile_money" | "cash_on_delivery">("mobile_money");
  const [momoNumber, setMomoNumber] = useState("+250 788 450 120");

  // Confirmation order details
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingCost =
    shippingMethod === "express" ? (subtotal >= 150 ? 0 : 15) : shippingMethod === "standard" ? (subtotal >= 150 ? 0 : 8) : 0;
  const tax = subtotal * 0.05; // 5% VAT
  const grandTotal = subtotal + shippingCost + tax;

  const handleCompleteOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const order = checkout({
      customerName: fullName,
      customerEmail: email,
      customerPhone: phone,
      shippingAddress: `${deliveryAddress}, ${deliverySector}`,
      paymentMethod,
    });

    setCompletedOrder(order);
    setCurrentStep(4);
  };

  return (
    <div className="min-h-screen bg-[#0b1324] text-white flex flex-col font-sans selection:bg-[#A0D585] selection:text-[#0d1525]">
      <ShopNavbar
        onOpenCart={() => setCartOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-xl mx-auto">
            {[
              { num: 1, label: "Shipping Address" },
              { num: 2, label: "Delivery Method" },
              { num: 3, label: "Payment" },
              { num: 4, label: "Order Receipt" },
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      currentStep === step.num
                        ? "bg-[#A0D585] text-[#0d1525] ring-4 ring-[#A0D585]/20 font-black shadow-lg"
                        : currentStep > step.num
                        ? "bg-[#263B6A] text-[#EEFABD]"
                        : "bg-[#131e36] text-[#6984A9] border border-[#263B6A]"
                    }`}
                  >
                    {currentStep > step.num ? (
                      <svg className="w-4 h-4 text-[#A0D585]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.num
                    )}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-semibold mt-1.5 hidden sm:block ${
                      currentStep >= step.num ? "text-white" : "text-[#6984A9]"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {idx < 3 && (
                  <div
                    className={`w-12 sm:w-20 h-0.5 mx-2 sm:mx-3 transition-colors ${
                      currentStep > step.num ? "bg-[#A0D585]" : "bg-[#263B6A]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 4: Success View */}
        {currentStep === 4 && completedOrder ? (
          <div className="max-w-xl mx-auto bg-[#0d1525] border border-[#263B6A] rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-[#A0D585]/15 border border-[#A0D585]/30 flex items-center justify-center mx-auto text-[#A0D585]">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <span className="text-xs text-[#A0D585] font-bold uppercase tracking-wider block mb-1">
                Order Confirmed &amp; Dispatched
              </span>
              <h2 className="text-2xl font-black text-white">Thank you, {completedOrder.customerName}!</h2>
              <p className="text-xs text-[#6984A9] mt-1">
                Your hardware package has been allocated to Lugica Courier Route #902.
              </p>
            </div>

            {/* Tracking Badge */}
            <div className="bg-[#131e36] border border-[#263B6A] rounded-xl p-4 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6984A9]">Lugica Order Tracking:</span>
                <span className="font-mono font-bold text-[#EEFABD]">{completedOrder.id}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6984A9]">Customer:</span>
                <span className="font-mono text-white">{completedOrder.customerName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6984A9]">Amount Paid:</span>
                <span className="font-bold text-[#A0D585] font-mono">${completedOrder.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6984A9]">Delivery Address:</span>
                <span className="text-white text-right truncate max-w-[240px]">{completedOrder.shippingAddress}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/shop"
                className="px-5 py-2.5 bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] rounded-xl text-xs font-semibold text-white transition-colors"
              >
                Back to Shop
              </Link>
              <Link
                href="/account"
                className="px-5 py-2.5 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] rounded-xl text-xs font-bold transition-colors shadow-lg"
              >
                View in My Orders
              </Link>
            </div>
          </div>
        ) : cart.length === 0 ? (
          <div className="text-center py-16 bg-[#0d1525] border border-[#263B6A] rounded-2xl p-8 max-w-lg mx-auto">
            <h3 className="text-lg font-bold text-white mb-2">No items to checkout</h3>
            <p className="text-xs text-[#6984A9] mb-5">Your cart is currently empty. Browse our store to select gear.</p>
            <Link
              href="/shop"
              className="px-5 py-2.5 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] rounded-xl text-xs font-bold transition-colors shadow-md"
            >
              Browse Shop Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form by Step */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Shipping Address */}
              {currentStep === 1 && (
                <div className="bg-[#0d1525] border border-[#263B6A] rounded-2xl p-6 shadow-xl space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-[#263B6A] pb-3">
                    <h3 className="text-base font-bold text-white">1. Client Contact &amp; Delivery Destination</h3>
                    <span className="text-xs text-[#A0D585] font-mono">Step 1 of 3</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#6984A9] mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#A0D585]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6984A9] mb-1">Telephone *</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#A0D585]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#6984A9] mb-1">Email Address (Order Confirmation) *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#A0D585]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#6984A9] mb-1">Street Address / Building *</label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#A0D585]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#6984A9] mb-1">Sector / District</label>
                      <select
                        value={deliverySector}
                        onChange={(e) => setDeliverySector(e.target.value)}
                        className="w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#A0D585]"
                      >
                        <option value="Kigali Central Sector">Kigali Central Sector</option>
                        <option value="Gasabo District Hub">Gasabo District Hub</option>
                        <option value="Kicukiro Dispatch Zone">Kicukiro Dispatch Zone</option>
                        <option value="Nyarugenge Downtown Hub">Nyarugenge Downtown Hub</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="flex items-center gap-1.5 px-6 py-2.5 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-md"
                    >
                      <span>Continue to Delivery Method</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Delivery Method */}
              {currentStep === 2 && (
                <div className="bg-[#0d1525] border border-[#263B6A] rounded-2xl p-6 shadow-xl space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-[#263B6A] pb-3">
                    <h3 className="text-base font-bold text-white">2. Select Delivery Dispatch Speed</h3>
                    <span className="text-xs text-[#A0D585] font-mono">Step 2 of 3</span>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        id: "express",
                        title: "Lugica Courier Priority (2-Hour Dispatch)",
                        desc: "Dedicated motorbike courier rider with live GPS tracking on driver handset.",
                        cost: subtotal >= 150 ? "FREE (Orders $150+)" : "$15.00",
                      },
                      {
                        id: "standard",
                        title: "Standard Freight (Same-Day Evening Batch)",
                        desc: "Batch scheduled courier van route covering metropolitan sectors.",
                        cost: subtotal >= 150 ? "FREE" : "$8.00",
                      },
                      {
                        id: "hub",
                        title: "Warehouse Hub Pickup",
                        desc: "Collect in person from Lugica Express Central Hub loading dock.",
                        cost: "FREE",
                      },
                    ].map((method) => (
                      <div
                        key={method.id}
                        onClick={() => setShippingMethod(method.id as any)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          shippingMethod === method.id
                            ? "bg-[#131e36] border-[#A0D585] ring-1 ring-[#A0D585]/30 shadow-md"
                            : "bg-[#0d1525] border-[#263B6A] hover:border-[#6984A9]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            checked={shippingMethod === method.id}
                            onChange={() => setShippingMethod(method.id as any)}
                            className="mt-1 accent-[#A0D585]"
                          />
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-white">{method.title}</h4>
                            <p className="text-xs text-[#6984A9]">{method.desc}</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#EEFABD] whitespace-nowrap">
                          {method.cost}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-2 text-xs text-[#6984A9] hover:text-white transition-colors cursor-pointer"
                    >
                      &larr; Back to Shipping
                    </button>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="flex items-center gap-1.5 px-6 py-2.5 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-md"
                    >
                      <span>Continue to Payment</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment Method */}
              {currentStep === 3 && (
                <form onSubmit={handleCompleteOrder} className="bg-[#0d1525] border border-[#263B6A] rounded-2xl p-6 shadow-xl space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-[#263B6A] pb-3">
                    <h3 className="text-base font-bold text-white">3. Payment Gateway</h3>
                    <span className="text-xs text-[#A0D585] font-mono">Step 3 of 3</span>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        id: "mobile_money" as const,
                        name: "MTN Mobile Money / Airtel Money",
                        desc: "Instant push prompt to your handset with instant receipt generation.",
                      },
                      {
                        id: "card" as const,
                        name: "Credit / Debit Card (Visa, MasterCard)",
                        desc: "Secure 256-bit encrypted card checkout.",
                      },
                      {
                        id: "cash_on_delivery" as const,
                        name: "Pay On Delivery (COD)",
                        desc: "Pay driver with Cash or MoMo upon physical package inspection.",
                      },
                    ].map((pay) => (
                      <div
                        key={pay.id}
                        onClick={() => setPaymentMethod(pay.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          paymentMethod === pay.id
                            ? "bg-[#131e36] border-[#A0D585] ring-1 ring-[#A0D585]/30 shadow-md"
                            : "bg-[#0d1525] border-[#263B6A] hover:border-[#6984A9]"
                        }`}
                      >
                        <input
                          type="radio"
                          checked={paymentMethod === pay.id}
                          onChange={() => setPaymentMethod(pay.id)}
                          className="mt-1 accent-[#A0D585]"
                        />
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white">{pay.name}</h4>
                          <p className="text-xs text-[#6984A9]">{pay.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {paymentMethod === "mobile_money" && (
                    <div className="p-4 rounded-xl bg-[#131e36] border border-[#263B6A] space-y-2">
                      <label className="block text-xs font-medium text-[#6984A9]">Mobile Money Number to Charge</label>
                      <input
                        type="text"
                        value={momoNumber}
                        onChange={(e) => setMomoNumber(e.target.value)}
                        className="w-full bg-[#0d1525] border border-[#263B6A] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-[#A0D585]"
                        placeholder="+250 78X XXX XXX"
                        required
                      />
                      <span className="text-[11px] text-[#A0D585]">A prompt of ${grandTotal.toFixed(2)} will be triggered on your phone.</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-4 py-2 text-xs text-[#6984A9] hover:text-white transition-colors cursor-pointer"
                    >
                      &larr; Back to Delivery
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-6 py-3 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] font-black text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-xl active:scale-95"
                    >
                      <span>Confirm &amp; Place Order (${grandTotal.toFixed(2)})</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right: Order Summary Sidebar */}
            <div className="bg-[#0d1525] border border-[#263B6A] rounded-2xl p-5 shadow-xl h-fit space-y-4">
              <div className="border-b border-[#263B6A] pb-3">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Order Summary</h4>
                <p className="text-xs text-[#6984A9]">{cart.length} unique products</p>
              </div>

              {/* Items Preview */}
              <div className="space-y-3 max-h-60 overflow-y-auto inventory-scroll pr-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded bg-[#131e36] border border-[#263B6A] flex items-center justify-center text-[10px] font-bold text-[#A0D585] flex-shrink-0">
                        {item.quantity}x
                      </span>
                      <span className="text-white truncate">{item.product.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-[#EEFABD] flex-shrink-0">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cost Calculations */}
              <div className="space-y-1.5 text-xs border-t border-[#263B6A] pt-3 text-[#6984A9]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="text-white font-mono">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping ({shippingMethod}):</span>
                  <span className="text-white font-mono">
                    {shippingCost === 0 ? <strong className="text-[#A0D585]">FREE</strong> : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (5%):</span>
                  <span className="text-white font-mono">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-[#263B6A]/60">
                  <span>Grand Total:</span>
                  <span className="text-[#EEFABD] font-mono">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#131e36]/70 border border-[#263B6A]/50 text-[11px] text-[#6984A9] space-y-1">
                <span className="text-[#A0D585] font-semibold block">Warehouse Stock Guarantee</span>
                <p>Items in your order will be deducted from active inventory immediately upon confirmation.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <WishlistDrawer
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        onOpenCart={() => {
          setWishlistOpen(false);
          setCartOpen(true);
        }}
      />
    </div>
  );
}
