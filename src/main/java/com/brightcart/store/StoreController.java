package com.brightcart.store;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class StoreController {
    private final StoreService store;
    private final CatalogCache cache;
    private final StoreEvents events;
    private final FairQueue queue;
    private final JdbcTemplate jdbc;

    public StoreController(StoreService store, CatalogCache cache, StoreEvents events,
                           FairQueue queue, JdbcTemplate jdbc) {
        this.store = store;
        this.cache = cache;
        this.events = events;
        this.queue = queue;
        this.jdbc = jdbc;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "database", "connected");
    }

    @GetMapping("/products")
    public Map<String, Object> products() {
        return Map.of("products", store.products(), "cache", cache.stats());
    }

    @GetMapping("/metrics")
    public Map<String, Object> metrics() {
        Integer paidOrders = jdbc.queryForObject("SELECT COUNT(*) FROM orders WHERE status = 'PAID'", Integer.class);
        return Map.of("cache", cache.stats(), "events", events.stats(), "queueWaiting", queue.waitingCount(),
                "paidOrders", paidOrders == null ? 0 : paidOrders,
                "demoCrowd", 10_000_000, "demoStock", 100);
    }

    @PostMapping("/checkout")
    public StoreService.CheckoutResult checkout(@RequestBody StoreService.CheckoutRequest request) {
        return store.checkout(request);
    }

    @PostMapping("/queue/{productId}")
    public FairQueue.QueueTicket joinQueue(@PathVariable long productId) {
        Product product = store.requireProduct(productId);
        if (product == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "Product not found.");
        }
        if (product.stock() >= 10) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT, "The fair queue opens when stock drops below 10.");
        }
        return queue.join(product.id(), product.name());
    }
}
