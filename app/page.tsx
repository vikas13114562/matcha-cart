import Image from "next/image";
import OrderForm from "@/components/OrderForm";
import { connectToDatabase } from "@/lib/mongodb";
import { Setting } from "@/models/Setting";

export const dynamic = "force-dynamic";

async function ordersAreEnabled() {
  try {
    await connectToDatabase();
    const setting = await Setting.findOne({ key: "ordersEnabled" }).lean<{ value: boolean }>();
    return setting?.value ?? true;
  } catch {
    return true;
  }
}

export default async function Home() {
  const enabled = await ordersAreEnabled();
  if (!enabled) {
    return <main className="page-shell closed"><div><div className="cup">🍵</div><h1 className="display">Matcha Cart</h1><p><strong>Thank you for visiting Matcha Cart!</strong><br />We&apos;re currently not accepting orders.<br />Please check back again soon. 💚</p></div></main>;
  }
  return (
    <main className="page-shell">
      <header className="hero">
        <Image className="logo" src="/logo.png" width={224} height={224} alt="Matcha Cart" priority />
        <p className="eyebrow">The hundred</p>
        <h1 className="display">Matcha Cart</h1>
        <p className="tagline">100 Cups Everyday 🍵</p>
      </header>
      <OrderForm />
    </main>
  );
}
