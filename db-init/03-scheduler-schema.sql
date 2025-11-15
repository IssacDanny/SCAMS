-- This script creates the table needed by the Scheduler Service
-- to track which events it has already published.

CREATE SCHEMA IF NOT EXISTS scheduler;

CREATE TABLE scheduler.prepared_events (
    -- Use the booking ID as the primary key. This ensures we can only have
    -- one "prepared" event per booking.
    booking_id UUID PRIMARY KEY,
    
    -- The timestamp when the event was published.
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign key to the booking itself for data integrity.
    -- ON DELETE CASCADE means if a booking is deleted, this event record is also deleted.
    CONSTRAINT fk_booking
      FOREIGN KEY(booking_id) 
	  REFERENCES booking.bookings(id)
	  ON DELETE CASCADE
);

COMMENT ON TABLE scheduler.prepared_events IS 'Tracks which bookings have had a prepare_room_event published.';