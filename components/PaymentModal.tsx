"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { buildWhatsAppUrl, ConfirmedOrder, formatDeliveryTime } from "@/lib/whatsapp";

export default function PaymentModal({
  order,
  whatsappNumber,
  onClose,
}: {
  order: ConfirmedOrder;
  whatsappNumber: string;
  onClose: () => void;
}) {
  const [whatsappOpened, setWhatsappOpened] = useState(false);
  const thankYouHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (whatsappOpened) thankYouHeading.current?.focus();
  }, [whatsappOpened]);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
    >
      <section className="modal">
        <button
          className="modal-close"
          type="button"
          aria-label="Close order details"
          onClick={onClose}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
        {whatsappOpened ? (
          <>
            <div aria-hidden="true" style={{ fontSize: 34 }}>
              🍵 💚
            </div>
            <h2
              id="confirmation-title"
              className="display"
              ref={thankYouHeading}
              tabIndex={-1}
            >
              Thank you for your order!
            </h2>
            <p className="modal-copy" style={{ marginTop: 16 }}>
              We look forward to making your matcha. If we need any more
              details, we’ll contact you on WhatsApp at{" "}
              <strong>{order.mobile}</strong>.
            </p>
            <p className="modal-copy">
              Please make sure you press <strong>Send</strong> in WhatsApp to
              share your order with us.
            </p>
            <p className="modal-copy">
              Your order reference: <strong>{order.orderId}</strong>
            </p>
          </>
        ) : (
          <>
            <div aria-hidden="true" style={{ fontSize: 34 }}>
              💬
            </div>
            <h2 id="confirmation-title" className="display">
              Thank you for your order! 🍵
            </h2>
            <p className="modal-copy">
              Your order has been saved. One important step remains: send it to
              us on WhatsApp.
            </p>
            <div className="order-pill">
              <strong>Order {order.orderId}</strong>
              {order.items.map(item => <div className="summary-row" key={`${item.cupSize}-${item.flavour}`}><span>{item.quantity} × {item.flavour} • {item.cupSize}</span><strong>₹{item.lineTotal}</strong></div>)}
              <div className="summary-row">
                <span>Ready</span>
                <strong>{formatDeliveryTime(order)}</strong>
              </div>
            </div>
            <p className="modal-copy" style={{ marginTop: 16 }}>
              Please scan the QR code below and complete your payment.
            </p>
            <Image
              className="qr"
              src="/payment-qr.png"
              width={1080}
              height={1884}
              alt="PhonePe payment QR code"
            />
            <p className="amount">Amount to Pay: ₹{order.totalPrice}</p>
            <div className="whatsapp-notice">
              <strong>Important: send your order on WhatsApp</strong>
              <p>
                Tap the button below, then press <strong>Send</strong> in
                WhatsApp to share your order with us. This step is required to
                complete your order.
              </p>
            </div>
            <a
              className="whatsapp"
              href={buildWhatsAppUrl(order, whatsappNumber)}
              target="_blank"
              rel="noreferrer"
              onClick={() => setWhatsappOpened(true)}
            >
              Send Order on WhatsApp
            </a>
          </>
        )}
        {whatsappOpened && (
          <button className="cta" type="button" onClick={onClose}>
            Close
          </button>
        )}
      </section>
    </div>
  );
}
