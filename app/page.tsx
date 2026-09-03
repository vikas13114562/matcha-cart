import Image from "next/image";
import OrderForm from "@/components/OrderForm";
import CartStorefront from "@/components/CartStorefront";
import { getCartStatus } from "@/lib/cart-settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const status = await getCartStatus().catch(() => null);
  return (
    <CartStorefront initialStatus={status}>
      <main className="page-shell">
        <header className="hero">
          <Image className="logo" src="/logo.png" width={224} height={224} alt="Matcha Cart" priority />
          <p className="eyebrow">The hundred</p>
          <h1 className="display">Matcha Cart</h1>
          <p className="tagline">100 Cups Everyday 🍵</p>
        </header>
        <OrderForm />
      </main>
    </CartStorefront>
  );
}
