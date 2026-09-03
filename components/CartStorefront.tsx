"use client";

import { ReactNode, useEffect, useState } from "react";
import Image from "next/image";
import { CartStatus, closedCartMessage } from "@/lib/cart-status";

export default function CartStorefront({ initialStatus, children }: { initialStatus: CartStatus | null; children: ReactNode }) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    let active = true;
    let pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch("/api/cart/status", { cache: "no-store" });
        if (!response.ok) throw new Error();
        const next = await response.json();
        if (active) setStatus(next);
      } catch {
        if (active) setStatus(null);
      } finally { pending = false; }
    }
    const interval = window.setInterval(() => void refresh(), 15_000);
    const opening = status?.reopensAt ? new Date(status.reopensAt).getTime() - Date.now() : null;
    const timer = opening !== null && opening >= 0 && opening < 2_147_483_647
      ? window.setTimeout(() => void refresh(), opening + 100) : null;
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      if (timer !== null) window.clearTimeout(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [status?.reopensAt]);

  if (status?.ordersEnabled) return <>{children}</>;

  return <main className="page-shell closed"><div>
    <Image className="logo" src="/logo.png" width={224} height={224} alt="Matcha Cart" loading="eager" />
    <p><strong>Thank you for visiting Matcha Cart!</strong></p>
    <p role="status">{status ? closedCartMessage(status.reopensAt) : "Sorry, the cart is temporarily unavailable. Please try again shortly."}</p>
    {status?.reopensAt && <p>This page will update when the cart opens.</p>}
    <div className="closing-icons" role="img" aria-label="Matcha cup and green heart">🍵 💚</div>
  </div></main>;
}
