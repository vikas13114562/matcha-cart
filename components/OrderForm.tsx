"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useSyncExternalStore } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { calculateTotal, CUP_SIZES, FLAVOURS, getUnitPrice, MAX_QUANTITY, MIN_QUANTITY } from "@/lib/pricing";
import { ConfirmedOrder, formatTime } from "@/lib/whatsapp";
import { OrderInput, orderSchema } from "@/lib/validation";
import PaymentModal from "./PaymentModal";
import { addresses } from "@/lib/addresses";
import { getDeliveryTime } from "@/lib/preferred-time";

function subscribeToClock(update: () => void) {
  const timer = window.setInterval(update, 1_000);
  window.addEventListener("focus", update);
  return () => { window.clearInterval(timer); window.removeEventListener("focus", update); };
}

const serverDeliveryTime = () => undefined;

export default function OrderForm() {
  const [confirmed, setConfirmed] = useState<ConfirmedOrder | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState("917734015723");
  const [serverError, setServerError] = useState("");
  const deliveryTime = useSyncExternalStore<string | undefined>(subscribeToClock, getDeliveryTime, serverDeliveryTime);
  const { register, control, handleSubmit, reset, setValue, clearErrors, formState: { errors, isSubmitting } } = useForm<OrderInput>({
    resolver: zodResolver(orderSchema),
    defaultValues: { customerName: "", mobile: "", society: addresses.length === 1 ? addresses[0].society : "", tower: "", flatNumber: "", cupSize: undefined, flavour: undefined, quantity: 1 },
  });
  const [size, flavour, quantity = 1] = useWatch({ control, name: ["cupSize", "flavour", "quantity"] });
  const unitPrice = size && flavour ? getUnitPrice(size, flavour) : 0;
  const total = size && flavour ? calculateTotal(size, flavour, quantity) : 0;
  const [society, tower] = useWatch({ control, name: ["society", "tower"] });
  const selectedSociety = addresses.find(item => item.society === society);

  function closeConfirmation() {
    setConfirmed(null);
    setServerError("");
    reset();
  }

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
        <div className="field"><label htmlFor="mobile">WhatsApp number</label><input id="mobile" className="input" type="tel" inputMode="numeric" autoComplete="tel" maxLength={10} placeholder="10-digit WhatsApp number" aria-describedby="whatsapp-help" {...register("mobile")} /><small id="whatsapp-help">Enter the 10-digit Indian number you use on WhatsApp.</small>{errors.mobile && <p className="error">{errors.mobile.message}</p>}</div>
        <div className="field">
          <label htmlFor="society">Society (required)</label>
          <select id="society" className="input" defaultValue={addresses.length === 1 ? addresses[0].society : ""} required aria-invalid={!!errors.society} {...register("society", { onChange: () => {
            setValue("tower", ""); setValue("flatNumber", ""); clearErrors(["tower", "flatNumber"]);
          } })}>
            <option value="" disabled>Select your society</option>
            {addresses.map(item => <option key={item.society} value={item.society}>{item.society}</option>)}
          </select>
          {errors.society && <p className="error">{errors.society.message}</p>}
          {selectedSociety && <small>{selectedSociety.Area}, {selectedSociety.city}, {selectedSociety.state} - {selectedSociety.pincode}</small>}
        </div>
        <div className="field">
          <label htmlFor="tower">Tower (required)</label>
          <select id="tower" className="input" defaultValue="" required disabled={!selectedSociety} aria-invalid={!!errors.tower} {...register("tower", { onChange: () => {
            setValue("flatNumber", ""); clearErrors("flatNumber");
          } })}>
            <option value="" disabled>Select your tower</option>
            {selectedSociety?.Towers.map(item => <option key={item} value={item}>Tower {item}</option>)}
          </select>
          {errors.tower && <p className="error">{errors.tower.message}</p>}
        </div>
        {selectedSociety && selectedSociety.Towers.includes(tower) && <div className="field">
          <label htmlFor="flatNumber">Enter floor and flat no. (required)</label>
          <input id="flatNumber" className="input" type="text" autoComplete="address-line2" placeholder="e.g. 12th floor, flat 1204" maxLength={30} required aria-invalid={!!errors.flatNumber} {...register("flatNumber")} />
          {errors.flatNumber && <p className="error">{errors.flatNumber.message}</p>}
        </div>}

        <section className="section"><h2 className="section-title">Choose your size <span>Step 02</span></h2><Controller control={control} name="cupSize" render={({ field }) => <div className="choice-grid">{CUP_SIZES.map(item => <button key={item} className={`choice ${field.value === item ? "selected" : ""}`} type="button" aria-pressed={field.value === item} onClick={() => field.onChange(item)}>{item}<br /><small>{item === "300 ML" ? "Starting price ₹89" : "Starting price ₹149"}</small></button>)}</div>} />{errors.cupSize && <p className="error">{errors.cupSize.message}</p>}</section>

        <section className="section"><h2 className="section-title">Pick a flavour <span>Step 03</span></h2><Controller control={control} name="flavour" render={({ field }) => <div className="choice-grid">{FLAVOURS.map(item => <button key={item.value} className={`choice flavour ${field.value === item.value ? "selected" : ""}`} type="button" aria-pressed={field.value === item.value} onClick={() => field.onChange(item.value)}><span className="emoji">{item.emoji}</span><span>{item.value}</span></button>)}</div>} />{errors.flavour && <p className="error">{errors.flavour.message}</p>}</section>

        <section className="section"><h2 className="section-title">How many? <span>Step 04</span></h2><Controller control={control} name="quantity" render={({ field }) => <div className="quantity"><button type="button" aria-label="Decrease quantity" disabled={field.value <= MIN_QUANTITY} onClick={() => field.onChange(Math.max(MIN_QUANTITY, field.value - 1))}>−</button><output aria-live="polite">{field.value}</output><button type="button" aria-label="Increase quantity" disabled={field.value >= MAX_QUANTITY} onClick={() => field.onChange(Math.min(MAX_QUANTITY, field.value + 1))}>+</button></div>} />{errors.quantity && <p className="error">{errors.quantity.message}</p>}</section>

        <section className="section"><h2 className="section-title">Delivery time <span>Step 05</span></h2><div className="field"><label htmlFor="time">Estimated delivery time (IST)</label><input id="time" className="input" type="time" value={deliveryTime ?? ""} readOnly aria-describedby="delivery-time-help" /><small id="delivery-time-help">Delivery is scheduled for 30 minutes after you place your order, to the address above. The time is set automatically.</small></div></section>

        <section className="summary" aria-live="polite"><strong>{flavour ? `${flavour} Matcha` : "Your Matcha"}</strong><div className="summary-row"><span>{size || "Choose size"}</span><span>{unitPrice ? `₹${unitPrice} × ${quantity}` : "—"}</span></div><div className="summary-row"><span>Estimated delivery</span><span>{deliveryTime ? `${formatTime(deliveryTime)} IST` : "In 30 minutes"}</span></div><div className="summary-row summary-total"><span>Total</span><span>₹{total}</span></div></section>
        <button className="cta" type="submit" disabled={isSubmitting}>{isSubmitting ? "Placing your order..." : "Place Order 🍵"}</button>
        {serverError && <p className="server-error" role="alert">{serverError}</p>}
      </form>
      {confirmed && <PaymentModal order={confirmed} whatsappNumber={whatsappNumber} onClose={closeConfirmation} />}
    </>
  );
}
