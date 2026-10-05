package com.brightcart.store;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class StoreService implements ApplicationRunner {
    private final JdbcTemplate jdbc;
    private final CatalogCache cache;
    private final StoreEvents events;
    private final TransactionTemplate transactions;

    public StoreService(JdbcTemplate jdbc, CatalogCache cache, StoreEvents events,
                        PlatformTransactionManager transactionManager) {
        this.jdbc = jdbc;
        this.cache = cache;
        this.events = events;
        this.transactions = new TransactionTemplate(transactionManager);
    }

    @Override
    public void run(ApplicationArguments args) {
        Integer productCount = jdbc.queryForObject("SELECT COUNT(*) FROM products", Integer.class);
        if (productCount == null || productCount != 0) {
            return;
        }
        Object[][] products = {
                {"Airwave Headphones", "Audio", "Cushioned sound, all-day comfort.", 2499, 6},
                {"Orbit Smart Watch", "Wearables", "Your day, beautifully in sync.", 4999, 8},
                {"Mini Boom Speaker", "Audio", "Big sound. Take it anywhere.", 1799, 4},
                {"Lumen Desk Lamp", "Home", "Warm light for your best ideas.", 1299, 18},
                {"Cloud Knit Throw", "Home", "A little extra cozy for the sofa.", 1899, 42},
                {"Trailblazer Bottle", "Lifestyle", "Cold sips, wherever the day goes.", 699, 76},
                {"Studio Wireless Mouse", "Tech", "A precise click, minus the clutter.", 1499, 31},
                {"Sunday Coffee Set", "Kitchen", "Your slow morning, sorted.", 1199, 23},
                {"Pocket Instant Camera", "Tech", "Make the good moments tangible.", 5799, 7},
                {"Everyday Canvas Tote", "Lifestyle", "Room for the essentials and then some.", 499, 90},
                {"Citrus Skincare Kit", "Beauty", "A fresh start for your routine.", 999, 13},
                {"Retro Game Controller", "Tech", "One more round? Absolutely.", 2199, 5},
                {"Crisp Cotton Sheets", "Home", "The bedtime upgrade you deserve.", 3299, 27},
                {"Weekend Runner Shoes", "Style", "Light steps. Long weekends.", 3899, 34},
                {"Matcha Starter Kit", "Kitchen", "Whisk up a brighter morning.", 1599, 9},
                {"Sculpted Ceramic Vase", "Home", "A small detail that changes a room.", 1399, 16},
                {"Little Plant Bundle", "Home", "Three leafy roommates, no drama.", 899, 52},
                {"Paperback Reading Light", "Lifestyle", "One more chapter, without waking anyone.", 799, 21},
                {"Soft Serve Phone Case", "Tech", "Drop protection with a softer side.", 599, 63},
                {"Golden Hour Sunglasses", "Style", "A little sunshine, wherever you are.", 1099, 11}
        };
        for (Object[] product : products) {
            jdbc.update("INSERT INTO products (name, category, description, price, stock, emoji) VALUES (?, ?, ?, ?, ?, '')",
                    product[0], product[1], product[2], product[3], product[4]);
        }
    }

    public List<Product> products() {
        return cache.getOrLoad(this::loadProducts);
    }

    public Product requireProduct(long id) {
        return jdbc.query("SELECT id, name, category, description, price, stock FROM products WHERE id = ?",
                result -> result.next() ? mapProduct(result) : null, id);
    }

    public CheckoutResult checkout(CheckoutRequest request) {
        if (request.pin() == null || !request.pin().matches("\\d{4}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a 4-digit demo payment PIN.");
        }
        if (request.items() == null || request.items().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add an item to your cart before paying.");
        }
        if (request.items().size() > 20) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A checkout can include at most 20 cart lines.");
        }

        Map<Long, Integer> quantities = new LinkedHashMap<>();
        for (CheckoutItem item : request.items()) {
            if (item.productId() < 1 || item.quantity() < 1 || item.quantity() > 20) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each cart quantity must be between 1 and 20.");
            }
            quantities.merge(item.productId(), item.quantity(), Integer::sum);
            if (quantities.get(item.productId()) > 20) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A product quantity cannot exceed 20.");
            }
        }

        CheckoutResult result = transactions.execute(status -> reserveAndCreateOrder(quantities));
        if (result == null) {
            throw new IllegalStateException("Checkout completed without an order result.");
        }
        cache.invalidate();
        events.orderPaid(result.orderId(), result.items().stream().map(ReceiptItem::name).toList());
        for (ReceiptItem item : result.items()) {
            events.stockChanged(item.productId(), item.name(), item.stockRemaining());
        }
        return result;
    }

    private CheckoutResult reserveAndCreateOrder(Map<Long, Integer> quantities) {
        List<ReceiptItem> receipt = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (Map.Entry<Long, Integer> entry : quantities.entrySet()) {
            Product product = requireProduct(entry.getKey());
            if (product == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "A cart item is no longer available.");
            }
            int quantity = entry.getValue();
            int updated = jdbc.update("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
                    quantity, product.id(), quantity);
            if (updated != 1) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        product.name() + " just sold out. Your payment was not taken.");
            }
            receipt.add(new ReceiptItem(product.id(), product.name(), quantity, product.price(),
                    product.price().multiply(BigDecimal.valueOf(quantity)), product.stock() - quantity));
            total = total.add(product.price().multiply(BigDecimal.valueOf(quantity)));
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        BigDecimal orderTotal = total;
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO orders (total, status) VALUES (?, 'PAID')", Statement.RETURN_GENERATED_KEYS);
            statement.setBigDecimal(1, orderTotal);
            return statement;
        }, keyHolder);
        Number generatedId = keyHolder.getKey();
        if (generatedId == null) {
            throw new IllegalStateException("MySQL did not return an order id.");
        }
        long orderId = generatedId.longValue();
        for (ReceiptItem item : receipt) {
            jdbc.update("INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)",
                    orderId, item.productId(), item.name(), item.quantity(), item.unitPrice());
        }
        return new CheckoutResult(orderId, orderTotal, "PAID", receipt);
    }

    private List<Product> loadProducts() {
        return jdbc.query("SELECT id, name, category, description, price, stock FROM products ORDER BY id",
                (result, row) -> mapProduct(result));
    }

    private Product mapProduct(java.sql.ResultSet result) throws java.sql.SQLException {
        return new Product(result.getLong("id"), result.getString("name"), result.getString("category"),
                result.getString("description"), result.getBigDecimal("price"), result.getInt("stock"));
    }

    public record CheckoutRequest(String pin, List<CheckoutItem> items) {}
    public record CheckoutItem(long productId, int quantity) {}
    public record ReceiptItem(long productId, String name, int quantity, BigDecimal unitPrice,
                              BigDecimal lineTotal, int stockRemaining) {}
    public record CheckoutResult(long orderId, BigDecimal total, String status, List<ReceiptItem> items) {}
}
