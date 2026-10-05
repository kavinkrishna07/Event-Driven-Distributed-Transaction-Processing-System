import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronDown, Clock3,
  Flame, Heart, Minus, Plus, Radio, Search, ShieldCheck, ShoppingBag,
  Sparkles, Ticket, X, Zap,
} from "lucide-react";
import "./style.css";

const money = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const DEMO_PRODUCTS = [
  { id: 1, name: "Airwave Headphones", category: "Audio", description: "Cushioned sound, all-day comfort.", price: 2499, stock: 6, emoji: "🎧" },
  { id: 2, name: "Orbit Smart Watch", category: "Wearables", description: "Your day, beautifully in sync.", price: 4999, stock: 8, emoji: "⌚" },
  { id: 3, name: "Mini Boom Speaker", category: "Audio", description: "Big sound. Take it anywhere.", price: 1799, stock: 4, emoji: "🔊" },
  { id: 4, name: "Lumen Desk Lamp", category: "Home", description: "Warm light for your best ideas.", price: 1299, stock: 18, emoji: "💡" },
  { id: 5, name: "Cloud Knit Throw", category: "Home", description: "A little extra cozy for the sofa.", price: 1899, stock: 42, emoji: "🧶" },
  { id: 6, name: "Trailblazer Bottle", category: "Lifestyle", description: "Cold sips, wherever the day goes.", price: 699, stock: 76, emoji: "🧴" },
  { id: 7, name: "Studio Wireless Mouse", category: "Tech", description: "A precise click, minus the clutter.", price: 1499, stock: 31, emoji: "🖱️" },
  { id: 8, name: "Sunday Coffee Set", category: "Kitchen", description: "Your slow morning, sorted.", price: 1199, stock: 23, emoji: "☕" },
  { id: 9, name: "Pocket Instant Camera", category: "Tech", description: "Make the good moments tangible.", price: 5799, stock: 7, emoji: "📸" },
  { id: 10, name: "Everyday Canvas Tote", category: "Lifestyle", description: "Room for the essentials and then some.", price: 499, stock: 90, emoji: "👜" },
  { id: 11, name: "Citrus Skincare Kit", category: "Beauty", description: "A fresh start for your routine.", price: 999, stock: 13, emoji: "🍊" },
  { id: 12, name: "Retro Game Controller", category: "Tech", description: "One more round? Absolutely.", price: 2199, stock: 5, emoji: "🎮" },
  { id: 13, name: "Crisp Cotton Sheets", category: "Home", description: "The bedtime upgrade you deserve.", price: 3299, stock: 27, emoji: "🛏️" },
  { id: 14, name: "Weekend Runner Shoes", category: "Style", description: "Light steps. Long weekends.", price: 3899, stock: 34, emoji: "👟" },
  { id: 15, name: "Matcha Starter Kit", category: "Kitchen", description: "Whisk up a brighter morning.", price: 1599, stock: 9, emoji: "🍵" },
  { id: 16, name: "Sculpted Ceramic Vase", category: "Home", description: "A small detail that changes a room.", price: 1399, stock: 16, emoji: "🏺" },
  { id: 17, name: "Little Plant Bundle", category: "Home", description: "Three leafy roommates, no drama.", price: 899, stock: 52, emoji: "🪴" },
  { id: 18, name: "Paperback Reading Light", category: "Lifestyle", description: "One more chapter, without waking anyone.", price: 799, stock: 21, emoji: "📚" },
  { id: 19, name: "Soft Serve Phone Case", category: "Tech", description: "Drop protection with a softer side.", price: 599, stock: 63, emoji: "📱" },
  { id: 20, name: "Golden Hour Sunglasses", category: "Style", description: "A little sunshine, wherever you are.", price: 1099, stock: 11, emoji: "🕶️" },
];

class ApiUnavailableError extends Error {}

async function request(path, options) {
  let response;
  try {
    response = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiUnavailableError("The Java API could not be reached.");
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiUnavailableError("The Java API returned an unreadable response.");
  }
  if ([502, 503, 504].includes(response.status)) {
    throw new ApiUnavailableError("The Java API is not available.");
  }
  if (!response.ok) throw new Error(data.message || "Something went wrong. Please try again.");
  return data;
}

function Header({ count, onCart }) {
  return (
    <header className="topbar">
      <a className="brand" href="#" aria-label="BrightCart home">
        <span className="brand-mark"><ShoppingBag size={20} strokeWidth={2.6} /></span>
        <span>brightcart<span className="brand-dot">.</span></span>
      </a>
      <nav className="nav-links" aria-label="Main navigation">
        <a href="#discover">Discover</a>
        <a href="#how-it-works">How it works</a>
      </nav>
      <button className="cart-trigger" onClick={onCart} aria-label={`Open cart, ${count} items`}>
        <ShoppingBag size={18} /> <span>Bag</span>
        <span className="cart-count">{count}</span>
      </button>
    </header>
  );
}

function ProductCard({ product, onAdd, onJoin, queued }) {
  const hot = product.stock < 10;
  const warm = !hot && product.stock < 25;
  const soldOut = product.stock < 1;
  return (
    <article className={`product-card${hot ? " product-card-hot" : ""}`}>
      <div className="product-art">
        <span className="art-orbit" />
        <span className="product-emoji" aria-hidden="true">{product.emoji}</span>
        <button className="favorite-button" aria-label={`Save ${product.name}`}><Heart size={16} /></button>
        {hot && <span className="stock-badge badge-hot"><Flame size={12} fill="currentColor" /> HOT</span>}
        {warm && <span className="stock-badge badge-warm"><Zap size={11} fill="currentColor" /> Selling fast</span>}
      </div>
      <div className="product-content">
        <div className="product-category">{product.category}</div>
        <h3>{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-footer">
          <div>
            <div className="product-price">{money(product.price)}</div>
            <div className={`stock-copy${hot ? " stock-copy-hot" : ""}`}>
              {soldOut ? "Just sold out" : hot ? `Only ${product.stock} left` : `${product.stock} in stock`}
            </div>
          </div>
          <button
            className={`add-button${soldOut ? " add-button-disabled" : ""}`}
            onClick={() => onAdd(product)}
            disabled={soldOut}
            aria-label={`Add ${product.name} to bag`}
          >
            <Plus size={17} />
          </button>
        </div>
        {hot && !soldOut && (
          <button className="queue-link" onClick={() => onJoin(product.id)} disabled={queued?.productId === product.id}>
            <Ticket size={13} />
            {queued?.productId === product.id ? `You're #${queued.position} in line` : "Join the fair queue"}
            {!queued && <ArrowRight size={13} />}
          </button>
        )}
      </div>
    </article>
  );
}

function Store() {
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [metrics, setMetrics] = useState(null);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All finds");
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [queued, setQueued] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);

  async function loadStore() {
    const [catalogResult, metricsResult] = await Promise.allSettled([
      request("/api/products"),
      request("/api/metrics"),
    ]);
    if (catalogResult.status === "fulfilled") {
      setProducts(catalogResult.value.products);
      setApiAvailable(true);
      setLoadError("");
    } else {
      setApiAvailable(false);
      setLoadError("Showing 20 sample products. For live MySQL stock and database-backed checkout, start the Java API and check your DB_USERNAME and DB_PASSWORD.");
    }
    if (metricsResult.status === "fulfilled") {
      setMetrics(metricsResult.value);
    }
  }

  useEffect(() => {
    loadStore();
    const interval = window.setInterval(async () => {
      const [catalogResult, metricsResult] = await Promise.allSettled([
        request("/api/products"),
        request("/api/metrics"),
      ]);
      if (catalogResult.status === "fulfilled") {
        setProducts(catalogResult.value.products);
        setApiAvailable(true);
        setLoadError("");
      } else {
        setApiAvailable(false);
        setLoadError("Showing 20 sample products. For live MySQL stock and database-backed checkout, start the Java API and check your DB_USERNAME and DB_PASSWORD.");
      }
      if (metricsResult.status === "fulfilled") {
        setMetrics(metricsResult.value);
      }
    }, 3000);
    return () => window.clearInterval(interval);
  }, []);

  const categories = useMemo(
    () => ["All finds", ...new Set(products.map((product) => product.category))],
    [products],
  );
  const shownProducts = products.filter((product) => {
    const inCategory = activeCategory === "All finds" || product.category === activeCategory;
    const term = search.trim().toLowerCase();
    return inCategory && (!term || `${product.name} ${product.category}`.toLowerCase().includes(term));
  });
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

  function addToCart(product) {
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id);
      if (existing) return items.map((item) => item.id === product.id
        ? { ...item, quantity: Math.min(product.stock, item.quantity + 1) } : item);
      return [...items, { ...product, quantity: 1 }];
    });
    setMessage("");
  }

  function adjustQuantity(productId, change) {
    setCart((items) => items
      .map((item) => item.id === productId
        ? { ...item, quantity: item.quantity + change }
        : item)
      .filter((item) => item.quantity > 0));
  }

  async function joinQueue(productId) {
    if (!apiAvailable) {
      const position = offlineQueueCount + 1;
      setOfflineQueueCount(position);
      setQueued({ productId, position, status: "WAITING" });
      return;
    }
    try {
      setQueued(await request(`/api/queue/${productId}`, { method: "POST" }));
      setMessage("");
      await loadStore();
    } catch (error) {
      if (error instanceof ApiUnavailableError) {
        const position = offlineQueueCount + 1;
        setApiAvailable(false);
        setOfflineQueueCount(position);
        setQueued({ productId, position, status: "WAITING" });
        setLoadError("The API disconnected. This is a browser-only sample queue; verify DB_USERNAME and DB_PASSWORD for live services.");
      } else {
        setMessage(error.message);
      }
    }
  }

  function completeOfflineDemoPayment() {
    const unavailableItem = cart.find((item) => {
      const liveProduct = products.find((product) => product.id === item.id);
      return !liveProduct || liveProduct.stock < item.quantity;
    });
    if (unavailableItem) {
      setMessage(`${unavailableItem.name} no longer has enough demo stock. Update your quantity and try again.`);
      return;
    }
    const purchasedItems = cart.map((item) => ({
      productId: item.id,
      name: item.name,
      quantity: item.quantity,
      lineTotal: item.price * item.quantity,
    }));
    setProducts((current) => current.map((product) => {
      const purchased = cart.find((item) => item.id === product.id);
      return purchased ? { ...product, stock: product.stock - purchased.quantity } : product;
    }));
    setReceipt({
      orderId: `LOCAL-${Date.now().toString().slice(-6)}`,
      total: cartTotal,
      status: "DEMO ONLY · saved in this browser only",
      items: purchasedItems,
      offline: true,
    });
    setCart([]);
    setPin("");
  }

  async function pay(event) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    if (!apiAvailable) {
      completeOfflineDemoPayment();
      setBusy(false);
      return;
    }
    try {
      const result = await request("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ pin, items: cart.map(({ id, quantity }) => ({ productId: id, quantity })) }),
      });
      setReceipt(result);
      setCart([]);
      setPin("");
      await loadStore();
    } catch (error) {
      if (error instanceof ApiUnavailableError) {
        setApiAvailable(false);
        completeOfflineDemoPayment();
        setLoadError("Java API unavailable. Showing browser-only demo stock; verify DB_USERNAME and DB_PASSWORD for live MySQL checkout.");
      } else {
        setMessage(error.message);
        await loadStore();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header count={cartCount} onCart={() => { setCartOpen(true); setMessage(""); setReceipt(null); }} />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={14} /> GOOD FINDS, FAIR QUEUES</div>
            <h1>A little joy.<br />A <span>lot more</span> fair.</h1>
            <p>Lovely things, lovely prices. Even when everyone wants the same one.</p>
            <a className="hero-cta" href="#discover">Find your thing <ArrowRight size={16} /></a>
            <div className="hero-note"><span className="tiny-online" /> Low stock? Take a breath. Find your place in line.</div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-sun" />
            <div className="hero-sparkle hero-sparkle-a">✳</div>
            <div className="hero-sparkle hero-sparkle-b">✦</div>
            <div className="hero-product hero-product-main">🎧</div>
            <div className="hero-product hero-product-small">🍊</div>
            <div className="hero-product hero-product-tiny">🪴</div>
            <div className="hero-sticker"><span>GOOD<br />STUFF</span><span className="sticker-star">✳</span></div>
            <div className="floating-note"><span className="note-icon"><Clock3 size={15} /></span><span><b>Queue ticket</b><small>Your place, no frantic taps</small></span></div>
          </div>
          <div className="hero-bottom">
            <span>THE LITTLE THINGS, BIG ON FEELING</span>
            <span className="hero-bottom-right">A kinder kind of cart ↓</span>
          </div>
        </section>

        <section className="trust-strip" aria-label="Store features">
          <div><ShieldCheck size={17} /><span>Secure checkout</span></div>
          <i />
          <div><Zap size={17} /><span>Real stock, right now</span></div>
          <i />
          <div><Heart size={17} /><span>Fair queues for everyone</span></div>
        </section>

        <section id="discover" className="discover-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow section-eyebrow">A GOOD PLACE TO START</div>
              <h2>Little things to <span>love.</span></h2>
              <p>Twenty finds, handpicked for your everyday.</p>
            </div>
            <label className="search-box">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find something lovely" />
              <span>/</span>
            </label>
          </div>
          <div className="category-bar" role="tablist" aria-label="Product categories">
            {categories.map((category) => (
              <button
                role="tab"
                aria-selected={activeCategory === category}
                className={activeCategory === category ? "category-pill category-active" : "category-pill"}
                key={category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
            <span className="result-count">{shownProducts.length} little finds</span>
          </div>
          {loadError && <div className={`error-banner${apiAvailable ? "" : " connection-notice"}`} role="status">{loadError} <button onClick={loadStore}>Retry connection</button></div>}
          <div className="product-grid">
            {shownProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} onJoin={joinQueue} queued={queued} />
            ))}
            {!loadError && products.length === 0 && (
              <div className="empty-state"><Sparkles size={22} /> Picking out your finds…</div>
            )}
            {shownProducts.length === 0 && products.length > 0 && (
              <div className="empty-state">No little finds match that search. Try another?</div>
            )}
          </div>
        </section>

        <section id="how-it-works" className="fair-section">
          <div className="fair-intro">
            <div className="eyebrow section-eyebrow">BEHIND THE LITTLE SHOP</div>
            <h2>Big rush.<br /><span>Fair chances.</span></h2>
            <p>What happens when 10 million people love the same 100 things? A little thoughtful engineering.</p>
            <div className="fair-micro"><span className="tiny-online" /> Live demo · updates every 3 seconds</div>
          </div>
          <div className="fair-dashboard">
            <div className="rush-card">
              <div className="rush-card-top"><span><Radio size={14} /> THE BIG RUSH</span><span className="live-dot">LIVE DEMO</span></div>
              <div className="rush-numbers">
                <div><strong>{(metrics?.demoCrowd ?? 10000000).toLocaleString("en-IN")}<small>+</small></strong><span>people looking</span></div>
                <ArrowRight size={20} />
                <div className="rush-stock"><strong>{metrics?.demoStock ?? 100}</strong><span>little treasures</span></div>
              </div>
              <div className="rush-progress"><span /></div>
              <div className="rush-caption">A thought experiment. This demo keeps the shop cozy, not ten million live shoppers.</div>
            </div>
            <div className="concept-list">
              <Concept icon={<span className="concept-icon redis">R</span>} title="Redis-style cache" detail="Repeat catalog reads come from a quick 5-second in-memory cache." stat={metrics ? `${metrics.cache.hits} cache hits` : "Warming up"} />
              <Concept icon={<span className="concept-icon kafka">K</span>} title="Kafka-style event queue" detail="Paid orders and stock changes enter an asynchronous event buffer." stat={metrics ? `${metrics.events.processed} events handled` : "Listening"} />
              <Concept icon={<span className="concept-icon mysql">⌁</span>} title="MySQL keeps score" detail="Inventory decrements inside a transaction; the last item cannot sell twice." stat={metrics ? `${metrics.paidOrders} paid orders` : "Stock protected"} />
            </div>
          </div>
        </section>
        <section className="last-note"><span>GOOD THINGS COME TO THOSE WHO WAIT.</span><span>Keep it lovely. Keep it fair. <span className="last-heart">♥</span></span></section>
      </main>
      <footer className="footer"><a className="brand footer-brand" href="#"><span className="brand-mark"><ShoppingBag size={18} /></span><span>brightcart<span className="brand-dot">.</span></span></a><span>A cheerful little systems-design demo.</span><a href="#discover">Back to the good stuff ↑</a></footer>

      {cartOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}>
          <section className="cart-modal" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <div className="modal-heading">
              <div><div className="eyebrow section-eyebrow">{receipt ? "THAT WAS LOVELY" : "YOUR LITTLE FINDS"}</div><h2 id="cart-title">{receipt ? "All yours. ✨" : "Your bag."}</h2></div>
              <button className="close-button" onClick={() => setCartOpen(false)} aria-label="Close bag"><X size={19} /></button>
            </div>
            {receipt ? (
              <div className="receipt">
                <div className="success-mark"><Check size={28} /></div>
                <h3>{receipt.offline ? "Demo checkout complete!" : "Payment successful!"}</h3>
                <p>{receipt.offline ? <>Browser-only demo order <b>#{receipt.orderId}</b>. No real payment or MySQL order was created.</> : <>Demo order <b>#{receipt.orderId}</b> is confirmed. Your MySQL stock was updated safely.</>}</p>
                <div className="receipt-lines">{receipt.items.map((item) => <div key={item.productId}><span>{item.quantity} × {item.name}</span><b>{money(item.lineTotal)}</b></div>)}</div>
                <div className="cart-total"><span>Paid with demo PIN</span><strong>{money(receipt.total)}</strong></div>
                <button className="pay-button" onClick={() => setCartOpen(false)}>Back to the good stuff <ArrowRight size={16} /></button>
              </div>
            ) : cart.length === 0 ? (
              <div className="empty-cart"><span>🛍️</span><h3>Your bag is taking a little break.</h3><p>Find something lovely and it’ll be waiting right here.</p><button className="pay-button" onClick={() => setCartOpen(false)}>Have a look around <ArrowRight size={16} /></button></div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <span className="cart-item-emoji">{item.emoji}</span>
                      <div className="cart-item-info"><b>{item.name}</b><span>{money(item.price)} each</span></div>
                      <div className="quantity-control">
                        <button onClick={() => adjustQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}><Minus size={13} /></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => adjustQuantity(item.id, 1)} disabled={item.quantity >= item.stock} aria-label={`Add one ${item.name}`}><Plus size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-total"><span>Little things, big joy</span><strong>{money(cartTotal)}</strong></div>
                <form className="payment-form" onSubmit={pay}>
                  <label htmlFor="pin">Four-digit demo payment PIN</label>
                  <input id="pin" inputMode="numeric" autoComplete="off" maxLength={4} pattern="[0-9]{4}" placeholder="· · · ·" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))} required />
                  <span className="pin-note">{apiAvailable ? "Any four digits work — this is a pretend payment." : "Browser-only preview: no real payment or database order."}</span>
                  {message && <div className="error-message" role="alert">{message}</div>}
                  <button className="pay-button" type="submit" disabled={busy || pin.length !== 4}>{busy ? "Saving your finds…" : <>Pay {money(cartTotal)} <ArrowRight size={16} /></>}</button>
                  <div className="safe-note"><ShieldCheck size={14} /> {apiAvailable ? "MySQL checks stock again before confirming" : "Preview stock updates stay in this browser only"}</div>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function Concept({ icon, title, detail, stat }) {
  return (
    <div className="concept-row">
      <div className="concept-brand-icon">{icon}</div>
      <div className="concept-copy"><b>{title}</b><span>{detail}</span></div>
      <div className="concept-stat">{stat}<ChevronDown size={13} /></div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Store />);
