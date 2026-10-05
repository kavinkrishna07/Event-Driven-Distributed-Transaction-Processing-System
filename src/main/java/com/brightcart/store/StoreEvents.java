package com.brightcart.store;

import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class StoreEvents {
    private static final Logger logger = LoggerFactory.getLogger(StoreEvents.class);
    private final LinkedBlockingQueue<StoreEvent> topic = new LinkedBlockingQueue<>(10_000);
    private final AtomicLong accepted = new AtomicLong();
    private final AtomicLong processed = new AtomicLong();
    private final AtomicLong dropped = new AtomicLong();

    public StoreEvents() {
        Thread consumer = new Thread(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    topic.take();
                    processed.incrementAndGet();
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                }
            }
        }, "brightcart-demo-kafka-consumer");
        consumer.setDaemon(true);
        consumer.start();
    }

    public void orderPaid(long orderId, List<String> itemNames) {
        publish(new StoreEvent("ORDER_PAID", "Order #" + orderId + " paid · " + String.join(", ", itemNames)));
    }

    public void stockChanged(long productId, String productName, int stock) {
        publish(new StoreEvent("STOCK_CHANGED", productName + " · " + stock + " left"));
    }

    private void publish(StoreEvent event) {
        if (!topic.offer(event)) {
            dropped.incrementAndGet();
            logger.error("Demo event buffer full; dropped event type {}", event.type());
            return;
        }
        accepted.incrementAndGet();
    }

    public EventStats stats() {
        return new EventStats(accepted.get(), processed.get(), dropped.get(), topic.size());
    }

    public record EventStats(long accepted, long processed, long dropped, int pending) {}

    public record StoreEvent(String type, String message, Instant createdAt) {
        public StoreEvent(String type, String message) {
            this(type, message, Instant.now());
        }
    }
}
