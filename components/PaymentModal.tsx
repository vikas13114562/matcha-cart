"use client";

import Image from "next/image";
import { buildWhatsAppUrl, ConfirmedOrder, formatTime } from "@/lib/whatsapp";

export default function PaymentModal({ order, whatsappNumber, onClose }: { order: ConfirmedOrder; whatsappNumber: string; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
      <section className="modal">
        <button className="modal-close" type="button" aria-label="Close order details" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
        <div aria-hidden="true" style={{ fontSize: 34 }}>💬</div>
        <h2 id="confirmation-title" className="display">Finish on WhatsApp</h2>
        <p className="modal-copy">Your order has been saved. One important step remains: send it to us on WhatsApp.</p>
        <div className="order-pill">
          <strong>Order {order.orderId}</strong>
          <div className="summary-row"><span>{order.flavour} • {order.cupSize}</span><span>Qty {order.quantity}</span></div>
          <div className="summary-row"><span>₹{order.unitPrice} per cup</span><strong>₹{order.totalPrice}</strong></div>
          <div className="summary-row"><span>Preferred time</span><strong>{formatTime(order.preferredTime)}</strong></div>
        </div>
        <p className="modal-copy" style={{ marginTop: 16 }}>Please scan the QR code below and complete your payment.</p>
        <Image className="qr" src="/payment-qr.png" width={1080} height={1884} alt="PhonePe payment QR code" />
        <p className="amount">Amount to Pay: ₹{order.totalPrice}</p>
        <div className="whatsapp-notice">
          <strong>Important: send your order on WhatsApp</strong>
          <p>Tap the button below, then press <strong>Send</strong> in WhatsApp to share your order with us. This step is required to complete your order.</p>
        </div>
        <a className="whatsapp" href={buildWhatsAppUrl(order, whatsappNumber)} target="_blank" rel="noreferrer" onClick={onClose}>Send Order on WhatsApp</a>
      </section>
    </div>
  );
}
