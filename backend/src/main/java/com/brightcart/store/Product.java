package com.brightcart.store;

import java.math.BigDecimal;

public record Product(
        long id,
        String name,
        String category,
        String description,
        BigDecimal price,
        int stock,
        String emoji
) {
    public String stockLabel() {
        return stock < 10 ? "HOT" : stock < 25 ? "SELLING FAST" : null;
    }
}
