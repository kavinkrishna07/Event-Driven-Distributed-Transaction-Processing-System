package com.brightcart.store;

import org.springframework.stereotype.Component;

import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class FairQueue {
    private final AtomicLong sequence = new AtomicLong();
    private final LinkedBlockingQueue<QueueTicket> tickets = new LinkedBlockingQueue<>(10_000);

    public synchronized QueueTicket join(long productId, String productName) {
        long number = sequence.incrementAndGet();
        QueueTicket ticket = new QueueTicket(number, productId, productName, number, "WAITING");
        if (!tickets.offer(ticket)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.TOO_MANY_REQUESTS,
                    "The demo queue is full. Please try again later.");
        }
        return ticket;
    }

    public int waitingCount() {
        return tickets.size();
    }

    public record QueueTicket(long ticket, long productId, String productName, long position, String status) {}
}
