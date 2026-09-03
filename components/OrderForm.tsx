"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { calculateTotal, CUP_SIZES, FLAVOURS, getUnitPrice, MAX_QUANTITY, MIN_QUANTITY } from "@/lib/pricing";
import { ConfirmedOrder, formatTime } from "@/lib/whatsapp";
import { OrderInput, orderSchema } from "@/lib/validation";
import PaymentModal from "./PaymentModal";

export default function OrderForm() {
  const [confirmed, setConfirmed] = useState<ConfirmedOrder | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState("917734015723");
  const [serverError, setServerError] = useState("");
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<OrderInput>({
    resolver: zodResolver(orderSchema),
    defaultValues: { customerName: "", mobile: "", address: "", cupSize: undefined, flavour: undefined, quantity: 1, preferredTime: "" },
  });
  const [size, flavour, quantity = 1, time] = useWatch({ control, name: ["cupSize", "flavour", "quantity", "preferredTime"] });
  const unitPrice = size && flavour ? getUnitPrice(size, flavour) : 0;
  const total = size && flavour ? calculateTotal(size, flavour, quantity) : 0;

  async function submit(values: OrderInput) {
    setServerError("");
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.order) {
        throw new Error(typeof data?.message === "string" ? data.message : "Unable to confirm your order. Please try again shortly.");
      }
      setConfirmed(data.order);
      setWhatsappNumber(data.whatsappNumber);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Something went wrong while placing your order. Please try again.");
    }
  }

  return (
    <>
      <form className="card" onSubmit={handleSubmit(submit)} noValidate>
        <h2 className="section-title">Your details <span>Step 01</span></h2>
        <div className="field"><label htmlFor="name">Name</label><input id="name" className="input" autoComplete="name" placeholder="Your name" {...register("customerName")} />{errors.customerName && <p className="error">{errors.customerName.message}</p>}</div>
        <div className="field"><label htmlFor="mobile">Mobile number</label><input id="mobile" className="input" type="tel" inputMode="numeric" autoComplete="tel" maxLength={10} placeholder="10-digit mobile number" {...register("mobile")} />{errors.mobile && <p className="error">{errors.mobile.message}</p>}</div>
        <div className="field"><label htmlFor="address">Address <span style={{ fontWeight: 500, color: "#7b847c" }}>(optional)</span></label><textarea id="address" className="input" autoComplete="street-address" placeholder="Delivery or landmark details" {...register("address")} />{errors.address && <p className="error">{errors.address.message}</p>}</div>

        <section className="section"><h2 className="section-title">Choose your size <span>Step 02</span></h2><Controller control={control} name="cupSize" render={({ field }) => <div className="choice-grid">{CUP_SIZES.map(item => <button key={item} className={`choice ${field.value === item ? "selected" : ""}`} type="button" aria-pressed={field.value === item} onClick={() => field.onChange(item)}>{item}<br /><small>{item === "300 ML" ? "from ₹89" : "from ₹149"}</small></button>)}</div>} />{errors.cupSize && <p className="error">{errors.cupSize.message}</p>}</section>

        <section className="section"><h2 className="section-title">Pick a flavour <span>Step 03</span></h2><Controller control={control} name="flavour" render={({ field }) => <div className="choice-grid">{FLAVOURS.map(item => <button key={item.value} className={`choice flavour ${field.value === item.value ? "selected" : ""}`} type="button" aria-pressed={field.value === item.value} onClick={() => field.onChange(item.value)}><span className="emoji">{item.emoji}</span><span>{item.value}</span></button>)}</div>} />{errors.flavour && <p className="error">{errors.flavour.message}</p>}</section>

        <section className="section"><h2 className="section-title">How many? <span>Step 04</span></h2><Controller control={control} name="quantity" render={({ field }) => <div className="quantity"><button type="button" aria-label="Decrease quantity" disabled={field.value <= MIN_QUANTITY} onClick={() => field.onChange(Math.max(MIN_QUANTITY, field.value - 1))}>−</button><output aria-live="polite">{field.value}</output><button type="button" aria-label="Increase quantity" disabled={field.value >= MAX_QUANTITY} onClick={() => field.onChange(Math.min(MAX_QUANTITY, field.value + 1))}>+</button></div>} />{errors.quantity && <p className="error">{errors.quantity.message}</p>}</section>

        <section className="section"><h2 className="section-title">Preferred time <span>Step 05</span></h2><div className="field"><label htmlFor="time">Pickup / preparation time</label><input id="time" className="input" type="time" {...register("preferredTime")} />{errors.preferredTime && <p className="error">{errors.preferredTime.message}</p>}</div></section>

        <section className="summary" aria-live="polite"><strong>{flavour ? `${flavour} Matcha` : "Your Matcha"}</strong><div className="summary-row"><span>{size || "Choose size"}</span><span>{unitPrice ? `₹${unitPrice} × ${quantity}` : "—"}</span></div><div className="summary-row"><span>Preferred time</span><span>{time ? formatTime(time) : "Not selected"}</span></div><div className="summary-row summary-total"><span>Total</span><span>₹{total}</span></div></section>
        <button className="cta" type="submit" disabled={isSubmitting}>{isSubmitting ? "Placing your order..." : "Place Order 🍵"}</button>
        {serverError && <p className="server-error" role="alert">{serverError}</p>}
      </form>
      {confirmed && <PaymentModal order={confirmed} whatsappNumber={whatsappNumber} onClose={() => setConfirmed(null)} />}
    </>
  );
}
