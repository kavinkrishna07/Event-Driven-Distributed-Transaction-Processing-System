# BrightCart

A Java 17-compatible Spring Boot + React flash-sale storefront that teaches fair queuing, caching, asynchronous events, and safe inventory updates. It uses your local MySQL server for real demo products and paid orders; **it does not need Kafka or Redis installed**.

## Run the frontend and backend separately

The repository is organized into two independent projects: `backend/` (Spring Boot API) and `frontend/` (React/Vite app).

### Backend

Requires JDK 17 or newer and MySQL. Start the **MySQL80** Windows service; the app connects as `root` to `127.0.0.1` and creates a `brightcart` database if needed. From `backend/`, run `.\mvnw.ps1 spring-boot:run` in PowerShell. Set `DB_PASSWORD` in the environment first, and change `DB_USERNAME` or `DB_URL` if your local MySQL setup differs. The Maven wrapper downloads Maven into your user `.m2` cache on first use.

### Frontend

Requires Node.js and npm. From `frontend/`, run `npm install`, then `npm run dev`. Open **http://127.0.0.1:5173**. Vite forwards `/api` requests to the backend at `http://127.0.0.1:8080`.

## What the demo does

- Seeds 20 products on first launch. Products under 10 units get a red glow, a **HOT** badge, and a fair-queue button; products under 25 get a “Selling fast” label.
- “Pay” accepts any four-digit **demo-only** PIN. Checkout uses a MySQL transaction and an atomic `UPDATE ... WHERE stock >= quantity` guard. If stock runs out while an item is in a cart, checkout is rejected and inventory is not over-sold.
- Catalog reads use a small, five-second, process-local **Redis-style cache** that is invalidated after checkout.
- Paid orders and inventory changes are sent to a bounded, asynchronous, process-local **Kafka-style event queue** with a background consumer.
- The launch-queue button assigns a FIFO demo ticket to a shopper trying to buy a product with fewer than 10 units. The ticket illustrates queue position; it does not reserve inventory or block checkout.
- The “10 million shoppers / 100 items” panel is a design illustration, not a traffic generator.
- If MySQL is unavailable or rejects the credentials, the storefront still shows all 20 sample products. Cart, queue tickets, and checkout then run in clearly labeled browser-only preview mode; they do not create a real payment or MySQL order.

## Real-world scaling notes

The in-memory Redis/Kafka stand-ins are for learning: their queues, metrics, and caches reset on restart and are not shared by several Java servers. In production, Redis (or a managed equivalent) can absorb cached catalog reads and keep distributed queue/rate-limit state; Kafka can replicate ordered events across durable partitions and worker groups. A real fair-sale system would also add authenticated users, idempotency keys, expiring inventory reservations, payment-provider webhooks, bot/fraud controls, queue admission limits, and observability. The relational inventory check remains the final source-of-truth guard even when the queue and cache are distributed.

## Useful endpoints

- `GET /api/health`
- `GET /api/products`
- `GET /api/metrics`
- `POST /api/checkout` — `{"pin":"1234","items":[{"productId":1,"quantity":1}]}`
- `POST /api/queue/{productId}`
