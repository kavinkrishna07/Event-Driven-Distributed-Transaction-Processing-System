package com.brightcart.store;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.atomic.LongAdder;
import java.util.concurrent.atomic.AtomicReference;

@Component
public class CatalogCache {
    private static final long TTL_SECONDS = 5;
    private final AtomicReference<CachedCatalog> catalog = new AtomicReference<>();
    private final LongAdder hits = new LongAdder();
    private final LongAdder misses = new LongAdder();

    public synchronized List<Product> getOrLoad(CatalogLoader loader) {
        CachedCatalog current = catalog.get();
        if (current != null && current.expiresAt().isAfter(Instant.now())) {
            hits.increment();
            return current.products();
        }
        misses.increment();
        List<Product> fresh = List.copyOf(loader.load());
        catalog.set(new CachedCatalog(fresh, Instant.now().plusSeconds(TTL_SECONDS)));
        return fresh;
    }

    public synchronized void invalidate() {
        catalog.set(null);
    }

    public CacheStats stats() {
        CachedCatalog current = catalog.get();
        return new CacheStats(hits.sum(), misses.sum(),
                current != null && current.expiresAt().isAfter(Instant.now()) ? current.products().size() : 0,
                TTL_SECONDS);
    }

    @FunctionalInterface
    public interface CatalogLoader {
        List<Product> load();
    }

    private record CachedCatalog(List<Product> products, Instant expiresAt) {}

    public record CacheStats(long hits, long misses, int cachedProducts, long ttlSeconds) {}
}
