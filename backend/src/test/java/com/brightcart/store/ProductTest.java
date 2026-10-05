package com.brightcart.store;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ProductTest {
    @Test
    void stockBadgesFollowTheHotAndSellingFastThresholds() {
        assertEquals("HOT", productWithStock(9).stockLabel());
        assertEquals("SELLING FAST", productWithStock(10).stockLabel());
        assertEquals("SELLING FAST", productWithStock(24).stockLabel());
        assertNull(productWithStock(25).stockLabel());
    }

    private Product productWithStock(int stock) {
        return new Product(1, "Demo", "Home", "Demo product", BigDecimal.ONE, stock, "✨");
    }
}
