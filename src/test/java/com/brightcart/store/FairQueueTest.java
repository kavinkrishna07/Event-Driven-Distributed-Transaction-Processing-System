package com.brightcart.store;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FairQueueTest {
    @Test
    void ticketsReceiveIncreasingFifoPositions() {
        FairQueue queue = new FairQueue();

        FairQueue.QueueTicket first = queue.join(1, "Headphones");
        FairQueue.QueueTicket second = queue.join(1, "Headphones");

        assertEquals(1, first.position());
        assertEquals(2, second.position());
        assertEquals("WAITING", second.status());
        assertEquals(2, queue.waitingCount());
    }
}
