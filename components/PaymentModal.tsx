"use client";

import Image from "next/image";
import { buildWhatsAppUrl, ConfirmedOrder, formatTime } from "@/lib/whatsapp";

export default function PaymentModal({ order, whatsappNumber, onClose }: { order: ConfirmedOrder; whatsappNumber: string; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
      <section className="modal">
        <div aria-hidden="true" style={{ fontSize: 34 }}>✅</div>
        <h2 id="confirmation-title" className="display">Thank You!</h2>
        <p className="modal-copy">Your Matcha Cart order has been received.</p>
        <div className="order-pill">
          <strong>Order {order.orderId}</strong>
          <div className="summary-row"><span>{order.flavour} • {order.cupSize}</span><span>Qty {order.quantity}</span></div>
          <div className="summary-row"><span>₹{order.unitPrice} per cup</span><strong>₹{order.totalPrice}</strong></div>
          <div className="summary-row"><span>Preferred time</span><strong>{formatTime(order.preferredTime)}</strong></div>
        </div>
        <p className="modal-copy" style={{ marginTop: 16 }}>Please scan the QR code below and complete your payment.</p>
        <Image className="qr" src="/payment-qr.png" width={1080} height={1884} alt="PhonePe payment QR code" />
        <p className="amount">Amount to Pay: ₹{order.totalPrice}</p>
        <p className="modal-copy">Your order will be ready around {formatTime(order.preferredTime)}.</p>
        <a className="whatsapp" href={buildWhatsAppUrl(order, whatsappNumber)} target="_blank" rel="noreferrer">Send Order on WhatsApp</a>
        <button className="text-button" type="button" onClick={onClose}>Close</button>
      </section>
    </div>
  );
}
