"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatTime } from "@/lib/whatsapp";
import { formatOpeningTime, fromIndiaDateTimeInput, toIndiaDateTimeInput } from "@/lib/cart-status";

type RecentOrder = {
  _id: string; orderId: string; customerName: string; mobile: string; address?: string;
  flavour: string; cupSize: string; quantity: number; totalPrice: number; preferredTime: string; createdAt?: string;
};

async function readResponse(response: Response) {
  if (response.status === 404) throw new Error("The dashboard API was not found. Restart the development server and refresh this page.");
  const data = await response.json().catch(() => null);
  if (!data) throw new Error("The server returned an unexpected response. Please try again.");
  if (!response.ok) throw new Error(data.message || "The request failed. Please try again.");
  return data;
}

export default function AdminPanel({ initiallyAuthenticated }: { initiallyAuthenticated: boolean }) {
  const [authenticated, setAuthenticated] = useState(initiallyAuthenticated);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [reopensAt, setReopensAt] = useState<string | null>(null);
  const [openingInput, setOpeningInput] = useState("");
  const [loading, setLoading] = useState(initiallyAuthenticated);
  const [reload, setReload] = useState(0);
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function expireSession() {
    setAuthenticated(false); setEnabled(null); setOrders([]);
    setReopensAt(null); setOpeningInput(""); setNotice("");
    setError("Your session expired. Please sign in again.");
  }

  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/admin/settings", { cache: "no-store" });
        if (!active) return;
        if (response.status === 401) { expireSession(); return; }
        const data = await readResponse(response);
        if (!active) return;
        setEnabled(data.ordersEnabled); setOrders(data.orders);
        setReopensAt(data.reopensAt ?? null);
        setOpeningInput(toIndiaDateTimeInput(data.reopensAt ?? null));
      } catch (error) {
        if (active) setError(error instanceof Error ? error.message : "Unable to load the dashboard. Please try again.");
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [authenticated, reload]);

  useEffect(() => {
    if (!authenticated || !reopensAt || busy) return;
    const delay = Math.min(2_147_483_647, Math.max(0, new Date(reopensAt).getTime() - Date.now()) + 250);
    const timer = window.setTimeout(() => {
      setLoading(true); setEnabled(null); setError(""); setNotice("");
      setReload(value => value + 1);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [authenticated, reopensAt, busy]);

  function refresh() {
    setLoading(true); setEnabled(null); setError(""); setNotice(""); setReload(value => value + 1);
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      await readResponse(response);
      setEnabled(null); setOrders([]); setLoading(true); setAuthenticated(true);
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to sign in."); }
    finally { setBusy(false); }
  }

  async function saveSettings(next: boolean, opening: string | null) {
    if (enabled === null || loading || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordersEnabled: next, reopensAt: opening }),
      });
      if (response.status === 401) { expireSession(); return; }
      const data = await readResponse(response);
      setEnabled(data.ordersEnabled); setReopensAt(data.reopensAt ?? null);
      setOpeningInput(toIndiaDateTimeInput(data.reopensAt ?? null));
      setNotice(data.ordersEnabled ? "The cart is open. Customers can place orders." : "The cart is closed. Customers will see the closure message.");
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to update order status."); }
    finally { setBusy(false); }
  }

  function schedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const opening = fromIndiaDateTimeInput(openingInput);
      if (new Date(opening).getTime() <= Date.now()) throw new Error();
      void saveSettings(false, opening);
    } catch { setError("Choose a reopening date and time in the future."); }
  }

  async function logout() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      setAuthenticated(false); setEnabled(null); setOrders([]); setReopensAt(null); setOpeningInput(""); setNotice("");
    } catch { setError("Unable to log out. Please try again."); }
    finally { setBusy(false); }
  }

  if (!authenticated) return (
    <section className="card" style={{ marginTop: "18vh" }}>
      <p className="eyebrow">Private access</p>
      <h1 className="display" style={{ fontSize: 40, margin: "4px 0 24px" }}>Matcha Cart Admin</h1>
      <form onSubmit={login}>
        <div className="field"><label htmlFor="username">Username</label><input className="input" id="username" name="username" autoComplete="username" required /></div>
        <div className="field"><label htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" autoComplete="current-password" required /></div>
        <button className="cta" disabled={busy}>{busy ? "Signing in..." : "Login"}</button>
        {error && <p className="server-error" role="alert">{error}</p>}
      </form>
    </section>
  );

  const disabled = busy || loading || enabled === null;
  return <>
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "18px 2px" }}>
      <h1 className="display" style={{ fontSize: 34, margin: 0 }}>Matcha Cart Admin</h1>
      <button className="text-button" onClick={logout} disabled={busy}>Logout</button>
    </header>
    <section className="card">
      <p style={{ margin: 0, color: enabled ? "#2f7a46" : "#a53c31", fontWeight: 900 }}>
        {loading ? "Loading order status…" : enabled === null ? "Order status unavailable" : enabled ? "● ACCEPTING ORDERS" : "● ORDERS PAUSED"}
      </p>
      <button className="cta" style={{ background: enabled ? "#cadd8e" : "#eed2cd" }} onClick={() => void saveSettings(!enabled, null)} disabled={disabled}>
        {busy ? "Saving…" : enabled === null ? "Turn orders ON / OFF" : `Turn orders ${enabled ? "OFF" : "ON"}`}
      </button>
      <p>Turn the cart off to show a closed message to customers. Turn it on to accept orders immediately.</p>
      {reopensAt && <p><strong>Scheduled reopening:</strong><br />{formatOpeningTime(reopensAt)}</p>}
      {enabled === false && !reopensAt && <p>The cart will stay closed until you turn it on or schedule a reopening.</p>}
      <form onSubmit={schedule} style={{ borderTop: "1px solid #e1ddcf", paddingTop: 20, marginTop: 20 }}>
        <div className="field">
          <label htmlFor="reopensAt">Reopening date and time (IST)</label>
          <input className="input" type="datetime-local" id="reopensAt" name="reopensAt" value={openingInput}
            onChange={event => setOpeningInput(event.target.value)} disabled={disabled} required aria-describedby="schedule-help" />
        </div>
        <p id="schedule-help">India Standard Time. The cart closes now and opens automatically at this time. Customers will see this date and time on the closed page.</p>
        <button className="cta" disabled={disabled || !openingInput}>{enabled === false ? "Save reopening time" : "Close cart and schedule reopening"}</button>
      </form>
      {reopensAt && <button className="text-button" style={{ marginTop: 16 }} onClick={() => void saveSettings(false, null)} disabled={disabled}>Cancel scheduled reopening</button>}
      {notice && <p role="status">{notice}</p>}
      {error && <p className="server-error" role="alert">{error}</p>}
    </section>
    <section className="section">
      <h2 className="section-title">Recent orders <span>Latest 20</span></h2>
      <button className="text-button" onClick={refresh} disabled={busy || loading}>Refresh dashboard</button>
      {loading ? <p>Loading…</p> : enabled === null ? <p>Dashboard unavailable. Refresh to try again.</p> : orders.length ? orders.map(order => (
        <article className="card" style={{ marginBottom: 10, marginTop: 10, padding: 16 }} key={order._id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><strong>{order.orderId}</strong><strong>₹{order.totalPrice}</strong></div>
          <p style={{ margin: "8px 0 4px" }}>{order.flavour} • {order.cupSize} • Qty {order.quantity}</p>
          <p style={{ margin: "8px 0" }}>{order.customerName} · WhatsApp: <a href={`tel:${order.mobile}`}>{order.mobile}</a></p>
          <small>Preferred time: {formatTime(order.preferredTime)}</small>
          {order.address && <p>{order.address}</p>}
          {order.createdAt && <p style={{ marginBottom: 0 }}><small>Placed: {formatOpeningTime(order.createdAt)}</small></p>}
        </article>
      )) : <p style={{ color: "#68766d" }}>No orders yet.</p>}
    </section>
  </>;
}
