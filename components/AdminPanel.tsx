"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatTime } from "@/lib/whatsapp";

type RecentOrder = { _id: string; orderId: string; customerName: string; mobile: string; flavour: string; cupSize: string; quantity: number; totalPrice: number; preferredTime: string };

export default function AdminPanel({ initiallyAuthenticated }: { initiallyAuthenticated: boolean }) {
  const [authenticated, setAuthenticated] = useState(initiallyAuthenticated);
  const [enabled, setEnabled] = useState(true);
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/admin/settings", { cache: "no-store" });
        const data = await response.json();
        if (!active) return;
        if (response.status === 401) { setAuthenticated(false); return; }
        if (!response.ok) throw new Error(data.message);
        setEnabled(data.ordersEnabled); setOrders(data.orders);
      } catch { if (active) setError("Unable to load the dashboard."); }
    }
    void load();
    return () => { active = false; };
  }, [authenticated]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: form.get("username"), password: form.get("password") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setAuthenticated(true);
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to sign in."); } finally { setBusy(false); }
  }

  async function toggle() {
    const next = !enabled; setEnabled(next); setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ordersEnabled: next }) });
      if (!response.ok) throw new Error();
    } catch { setEnabled(!next); setError("Unable to update order status."); } finally { setBusy(false); }
  }

  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); setAuthenticated(false); setOrders([]); }

  if (!authenticated) return <section className="card" style={{ marginTop: "18vh" }}><p className="eyebrow">Private access</p><h1 className="display" style={{ fontSize: 40, margin: "4px 0 24px" }}>Matcha Cart Admin</h1><form onSubmit={login}><div className="field"><label htmlFor="username">Username</label><input className="input" id="username" name="username" autoComplete="username" required /></div><div className="field"><label htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" autoComplete="current-password" required /></div><button className="cta" disabled={busy}>{busy ? "Signing in..." : "Login"}</button>{error && <p className="server-error">{error}</p>}</form></section>;

  return <><header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 2px" }}><h1 className="display" style={{ fontSize: 34, margin: 0 }}>Matcha Cart Admin</h1><button className="text-button" onClick={logout}>Logout</button></header><section className="card"><p style={{ margin: 0, color: enabled ? "#2f7a46" : "#a53c31", fontWeight: 900 }}>{enabled ? "● ACCEPTING ORDERS" : "● ORDERS PAUSED"}</p><button className="cta" style={{ background: enabled ? "#cadd8e" : "#eed2cd" }} onClick={toggle} disabled={busy}>Turn orders {enabled ? "OFF" : "ON"}</button>{error && <p className="server-error">{error}</p>}</section><section className="section"><h2 className="section-title">Recent orders <span>Latest 20</span></h2>{busy && !orders.length ? <p>Loading…</p> : orders.length ? orders.map(order => <article className="card" style={{ marginBottom: 10, padding: 16 }} key={order._id}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><strong>{order.orderId}</strong><strong>₹{order.totalPrice}</strong></div><p style={{ margin: "8px 0 4px" }}>{order.flavour} • {order.cupSize} • Qty {order.quantity}</p><small>{formatTime(order.preferredTime)} · {order.customerName} · {order.mobile}</small></article>) : <p style={{ color: "#68766d" }}>No orders yet.</p>}</section></>;
}
