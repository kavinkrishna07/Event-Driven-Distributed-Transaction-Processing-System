package com.brightcart.store;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CatalogCacheTest {
    @Test
    void catalogReadsReuseCachedProductsUntilInvalidated() {
        CatalogCache cache = new CatalogCache();
        AtomicInteger loads = new AtomicInteger();
        List<Product> catalog = List.of(new Product(
                1, "Demo", "Home", "Demo product", BigDecimal.ONE, 12));
        CatalogCache.CatalogLoader loader = () -> {
            loads.incrementAndGet();
            return catalog;
        };

        cache.getOrLoad(loader);
        cache.getOrLoad(loader);
        assertEquals(1, loads.get());
        assertEquals(1, cache.stats().hits());

        cache.invalidate();
        cache.getOrLoad(loader);
        assertEquals(2, loads.get());
        assertEquals(2, cache.stats().misses());
    }
}
