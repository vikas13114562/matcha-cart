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
- Add delivery societies in `lib/addresses.ts`, using the `society`, `Towers`, `Area`, `city`, `state`, and `pincode` fields. A single society is selected by default; with multiple societies, customers choose one. Tower and flat number are required. Changing society clears the tower and flat number. The server validates the selected location and builds the full address for the saved order, admin dashboard, and WhatsApp message.
- Edit the tagline in `app/page.tsx`.
- Edit `MIN_QUANTITY` and `MAX_QUANTITY` in `lib/pricing.ts`.
- Change the WhatsApp destination through `WHATSAPP_ORDER_NUMBER` (country code + number, digits only).

## Admin and order flow

Visit `/admin` and sign in with the environment credentials. The signed session is stored in an HttpOnly, SameSite cookie (and is Secure in production). The dashboard can pause/resume orders and shows the latest 20 orders. All admin endpoints verify the signed session server-side.

- **Turn orders OFF / ON** closes the storefront or opens it immediately. Manually opening clears any scheduled reopening.
- **Reopening date and time (IST)** closes the cart now and schedules an automatic reopening. Enter the time in India Standard Time, regardless of your device's timezone. You can change or cancel the schedule while closed.
- Closed visitors see a thank-you, an apology, and the saved reopening date/time. The storefront refreshes availability every 15 seconds, on window focus, and at the scheduled reopening time.
- The order API uses the same persisted status and schedule, so an already-open order form cannot submit while the cart is closed. Database failures show temporary unavailability rather than implying the cart is open.
- Use **Refresh dashboard** to load the latest 20 orders, newest first, including customer contact details and order times.

The optional `reopensAt` date is stored atomically alongside the existing `ordersEnabled` value in the same settings document. Older settings remain compatible. Automatic opening is determined on each server request; no background scheduler is needed.

If `/api/admin/settings` returns an HTML **404** in local development despite the route file being present, stop `npm run dev`, move the generated `.next/dev` directory to a backup, and restart `npm run dev` to rebuild it. A JSON **503** instead indicates the database could not be reached; check `MONGODB_URI` and Atlas access.

Customers enter their details, choose a size, flavour, quantity, and preferred time, and see a live total. After server validation and MongoDB storage, a payment QR confirmation appears. **The website does not automatically send the WhatsApp message. It opens WhatsApp with the saved order details pre-filled, and the customer presses Send.**

Customers select a preferred time in India Standard Time, at least 30 minutes ahead of the current time. The form and server validate the preparation window, and the server saves the selected time with its delivery date. The saved date handles deliveries crossing midnight, and the admin dashboard, confirmation, and WhatsApp message show the delivery estimate.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Deploy to Vercel

Push the project to GitHub, import it in Vercel, and add all five environment variables under **Project Settings → Environment Variables**. Deploy, then verify the customer order flow and `/admin` against the production MongoDB database. Ensure the real QR image is committed before deployment.

### Admin login on a deployed site

`.env.local` is ignored by Git, so its values are not uploaded with the project. Configure `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and a random `SESSION_SECRET` of at least 32 characters in the hosting dashboard. For Vercel, select **Production** for the live site and **Preview** if you also need preview deployments, then redeploy after saving changes. Enter the raw values in the dashboard, without surrounding `.env` quotes or accidental whitespace. Do not prefix secrets with `NEXT_PUBLIC_`.

Use HTTPS: production sessions use Secure cookies. Sign in with the credentials configured for that deployment. Missing credentials or an invalid session secret return a configuration error (503); incorrect credentials return 401. If login succeeds but the dashboard fails to load, check `MONGODB_URI` and database network access separately—MongoDB is not used to authenticate the admin.
