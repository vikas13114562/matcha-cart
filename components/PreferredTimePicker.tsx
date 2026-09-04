"use client";
import { useState } from "react";
import { formatPreferredDateTime, getTimeSlots } from "@/lib/preferred-time";

export default function PreferredTimePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const slots = getTimeSlots();
  const quick = slots.slice(0, 4);
  const groups = slots.reduce<Record<string, string[]>>((all, slot) => {
    const label = formatPreferredDateTime(slot).split(",")[0];
    (all[label] ||= []).push(slot); return all;
  }, {});
  const button = (slot: string) => <button key={slot} type="button" className={`time-slot ${value === slot ? "selected" : ""}`} onClick={() => { onChange(slot); setOpen(false); }}>{formatPreferredDateTime(slot).replace(/^(Today|Tomorrow), /, "")}</button>;
  return <section className="section time-section">
    <h2 className="section-title">When would you like it? 🍵 <span>Step 04</span></h2>
    <p className="section-copy">Ready in at least 30 mins</p>
    <div className="time-grid">{quick.map(button)}</div>
    <button className="text-button choose-time" type="button" onClick={() => setOpen(true)}>Choose another time</button>
    {value && <p className="selected-time"><span>Selected time</span><strong>{formatPreferredDateTime(value)}</strong></p>}
    {open && <div className="modal-backdrop time-backdrop" role="dialog" aria-modal="true" aria-label="Choose another time"><section className="modal time-sheet">
      <button className="modal-close" type="button" aria-label="Close time picker" onClick={() => setOpen(false)}>×</button>
      <h2 className="display">Choose another time</h2>
      <p className="modal-copy">Available during the next 4 hours</p>
      {Object.entries(groups).map(([day, daySlots]) => <div key={day} className="time-group"><h3>{day}</h3><div className="time-grid">{daySlots.map(button)}</div></div>)}
    </section></div>}
  </section>;
}
