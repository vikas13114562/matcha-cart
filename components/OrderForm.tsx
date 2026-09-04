"use client";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { addresses } from "@/lib/addresses";
import { CUP_SIZES, CupSize, FLAVOURS, Flavour, getUnitPrice, MAX_QUANTITY, OrderItemInput, priceItems } from "@/lib/pricing";
import { preferredDateTimeError } from "@/lib/preferred-time";
import { ConfirmedOrder } from "@/lib/whatsapp";
import { OrderInput, orderSchema } from "@/lib/validation";
import PaymentModal from "./PaymentModal";
import PreferredTimePicker from "./PreferredTimePicker";

const keyFor = (size: CupSize, flavour: Flavour) => `${size}|${flavour}`;
const emptyQuantities = Object.fromEntries(CUP_SIZES.flatMap(size => FLAVOURS.map(({ value }) => [keyFor(size, value), 0]))) as Record<string, number>;

export default function OrderForm() {
  const [activeSize, setActiveSize] = useState<CupSize>("500 ML");
  const [quantities, setQuantities] = useState(emptyQuantities);
  const [preferredDateTime, setPreferredDateTime] = useState("");
  const [confirmed, setConfirmed] = useState<ConfirmedOrder | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState("917734015723");
  const [serverError, setServerError] = useState("");
  const { register, control, handleSubmit, reset, setValue, clearErrors, formState: { errors, isSubmitting } } = useForm<OrderInput>({ resolver: zodResolver(orderSchema), defaultValues: { customerName: "", mobile: "", society: addresses.length === 1 ? addresses[0].society : "", tower: "", flatNumber: "", items: [], preferredDateTime: "" } });
  const [society, tower] = useWatch({ control, name: ["society", "tower"] });
  const selectedSociety = addresses.find(item => item.society === society);
  const items: OrderItemInput[] = CUP_SIZES.flatMap(cupSize => FLAVOURS.map(({ value: flavour }) => ({ cupSize, flavour, quantity: quantities[keyFor(cupSize, flavour)] }))).filter(item => item.quantity > 0);
  const pricedItems = priceItems(items), total = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  useEffect(() => { setValue("items", items, { shouldValidate: false }); }, [items, setValue]);
  function changeQuantity(flavour: Flavour, delta: number) { const key = keyFor(activeSize, flavour); setQuantities(current => ({ ...current, [key]: Math.max(0, Math.min(MAX_QUANTITY, current[key] + delta)) })); clearErrors("items"); }
  function selectTime(value: string) { setPreferredDateTime(value); setValue("preferredDateTime", value, { shouldValidate: true }); }
  function closeConfirmation() { setConfirmed(null); setServerError(""); setQuantities(emptyQuantities); setPreferredDateTime(""); reset(); }
  async function submit(values: OrderInput) {
    const timeError = preferredDateTimeError(preferredDateTime); if (timeError) { setServerError(timeError); return; }
    setServerError("");
    const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, items, preferredDateTime }) });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.order) { setServerError(data?.message || "Unable to confirm your order. Please try again shortly."); return; }
    setConfirmed(data.order); setWhatsappNumber(data.whatsappNumber);
  }
  return <>
    <form className="card order-card" onSubmit={handleSubmit(submit)} noValidate>
      <h2 className="section-title">Your details <span>Step 01</span></h2>
      <div className="field"><label htmlFor="name">Name</label><input id="name" className="input" autoComplete="name" placeholder="Your name" {...register("customerName")} />{errors.customerName && <p className="error">{errors.customerName.message}</p>}</div>
      <div className="field"><label htmlFor="mobile">WhatsApp number</label><input id="mobile" className="input" type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit WhatsApp number" {...register("mobile")} />{errors.mobile && <p className="error">{errors.mobile.message}</p>}</div>
      <div className="field"><label htmlFor="society">Society (required)</label><select id="society" className="input" required {...register("society", { onChange: () => { setValue("tower", ""); setValue("flatNumber", ""); } })}><option value="" disabled>Select your society</option>{addresses.map(x => <option key={x.society}>{x.society}</option>)}</select>{errors.society && <p className="error">{errors.society.message}</p>}{selectedSociety && <small>{selectedSociety.Area}, {selectedSociety.city}, {selectedSociety.state} - {selectedSociety.pincode}</small>}</div>
      <div className="field"><label htmlFor="tower">Tower (required)</label><select id="tower" className="input" required disabled={!selectedSociety} {...register("tower", { onChange: () => setValue("flatNumber", "") })}><option value="" disabled>Select your tower</option>{selectedSociety?.Towers.map(x => <option key={x} value={x}>Tower {x}</option>)}</select>{errors.tower && <p className="error">{errors.tower.message}</p>}</div>
      {selectedSociety?.Towers.includes(tower) && <div className="field"><label htmlFor="flatNumber">Enter floor and flat no. (required)</label><input id="flatNumber" className="input" required placeholder="e.g. 12th floor, flat 1204" {...register("flatNumber")} />{errors.flatNumber && <p className="error">{errors.flatNumber.message}</p>}</div>}
      <section className="section"><h2 className="section-title">Choose your size <span>Step 02</span></h2><div className="size-grid">{["500 ML", "300 ML"].map(size => <button type="button" key={size} className={`size-card ${activeSize === size ? "selected" : ""}`} onClick={() => setActiveSize(size as CupSize)}><strong>{size}</strong><small>From ₹{size === "500 ML" ? 149 : 89}</small></button>)}</div></section>
      <section className="section"><h2 className="section-title">Choose your Matcha <span>Step 03</span></h2><div className="flavour-menu">{FLAVOURS.map(({ value, image }) => { const quantity = quantities[keyFor(activeSize, value)], price = getUnitPrice(activeSize, value); return <article className="flavour-row" key={value}><span className="drink-image"><Image src={image} alt="" width={260} height={312} sizes="64px" /></span><span className="flavour-info"><strong>{value === "Classic Matcha" ? value : `${value} Matcha`}</strong><small>₹{price}</small></span><div className={`item-quantity ${quantity > 0 ? "expanded" : ""}`}>{quantity > 0 && <><button type="button" aria-label={`Remove one ${value} ${activeSize}`} onClick={() => changeQuantity(value, -1)}>−</button><output>{quantity}</output></>}<button type="button" aria-label={`Add one ${value} ${activeSize}`} disabled={quantity >= MAX_QUANTITY} onClick={() => changeQuantity(value, 1)}>+</button></div></article>; })}</div>{errors.items && <p className="error">{errors.items.message}</p>}</section>
      <section className="summary"><strong>Your Order</strong>{pricedItems.length ? pricedItems.map(item => <div className="order-line" key={keyFor(item.cupSize, item.flavour)}><span><strong>{item.flavour === "Classic Matcha" ? item.flavour : `${item.flavour} Matcha`}</strong><small>{item.cupSize} × {item.quantity}</small></span><strong>₹{item.lineTotal}</strong></div>) : <p>Choose your Matcha to start your order 🍵</p>}<div className="summary-row summary-total"><span>Total</span><span>₹{total}</span></div></section>
      <PreferredTimePicker value={preferredDateTime} onChange={selectTime} />
      <input type="hidden" {...register("items")} /><input type="hidden" {...register("preferredDateTime")} />
      <button className="cta" type="submit" disabled={isSubmitting || !items.length}>{isSubmitting ? "Placing your order..." : "Place Order 🍵"}</button>{serverError && <p className="server-error" role="alert">{serverError}</p>}
    </form>{confirmed && <PaymentModal order={confirmed} whatsappNumber={whatsappNumber} onClose={closeConfirmation} />}
  </>;
}
