# Matcha Cart

A compact, mobile-first Next.js ordering app with trusted server-side pricing, MongoDB storage, QR payment, WhatsApp Click-to-Chat, and a protected admin switch.

## Local setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The private admin page is at `http://localhost:3000/admin`.

Fill `.env.local`:

```env
MONGODB_URI=mongodb+srv://...
ADMIN_USERNAME=your-admin-name
ADMIN_PASSWORD=a-strong-password
SESSION_SECRET=a-random-secret-at-least-32-characters-long
WHATSAPP_ORDER_NUMBER=917734015723
```

Never prefix these variables with `NEXT_PUBLIC_`.

## MongoDB Atlas

1. Create a free Atlas project and cluster.
2. Under **Database Access**, create a database user with read/write access.
3. Under **Network Access**, allow your development IP. For Vercel, use the network policy appropriate for your deployment (commonly `0.0.0.0/0`) and rely on a long, unique database password.
4. Select **Connect → Drivers**, copy the connection string, replace its password/database placeholders, and set it as `MONGODB_URI`.

The app creates only `orders` and `settings`. The `ordersEnabled` setting is created the first time the admin changes the switch; absent means orders are enabled. Orders are validated, repriced, assigned an ID, and then saved by the server.

## Assets and customization

- The supplied PhonePe payment QR is stored at `public/payment-qr.png`. Replace that file while keeping the same filename whenever the payment account changes.
- Replace `public/logo.png` to change the logo.
- Edit flavours and all prices in `lib/pricing.ts`.
- Edit the tagline in `app/page.tsx`.
- Edit `MIN_QUANTITY` and `MAX_QUANTITY` in `lib/pricing.ts`.
- Change the WhatsApp destination through `WHATSAPP_ORDER_NUMBER` (country code + number, digits only).

## Admin and order flow

Visit `/admin` and sign in with the environment credentials. The signed session is stored in an HttpOnly, SameSite cookie (and is Secure in production). The dashboard can pause/resume orders and shows the latest 20 orders. All admin endpoints verify the signed session server-side.

Customers enter their details, choose a size, flavour, quantity, and preferred time, and see a live total. After server validation and MongoDB storage, a payment QR confirmation appears. **The website does not automatically send the WhatsApp message. It opens WhatsApp with the saved order details pre-filled, and the customer presses Send.**

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Deploy to Vercel

Push the project to GitHub, import it in Vercel, and add all five environment variables under **Project Settings → Environment Variables**. Deploy, then verify the customer order flow and `/admin` against the production MongoDB database. Ensure the real QR image is committed before deployment.
