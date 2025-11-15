-- This script runs after 01-init.sql from the authentication-service.
-- We are creating the schema and tables for the Booking Service.

-- Create a dedicated schema for the booking service to keep data organized.
CREATE SCHEMA IF NOT EXISTS booking;

-- Create the main 'bookings' table.
-- This table will store the definitive record for all room reservations.
CREATE TABLE booking.bookings (
    -- Use UUID for a unique, non-sequential primary key.
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign key linking to a potential (but not yet created) 'rooms' table.
    -- For now, it's just a text field.
    room_id VARCHAR(100) NOT NULL,

    -- Foreign key to the user who made the booking.
    lecturer_id UUID NOT NULL,

    -- Optional fields for display purposes.
    course_title VARCHAR(255),
    
    -- Using TIMESTAMPTZ to store the timestamp with timezone information.
    -- This is a best practice to avoid ambiguity.
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    
    -- Timestamps for auditing when the record was created.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- --- ACID COMPLIANCE AND DATA INTEGRITY ---
    -- This is the most critical part of the table.
    -- A UNIQUE constraint on both room_id and start_time ensures that it is
    -- physically impossible to have two bookings for the same room at the exact same start time.
    -- This enforces our "no double-booking" business rule at the lowest, most reliable level.
    CONSTRAINT unique_room_start_time UNIQUE (room_id, start_time)
);

-- Add an index on room_id and the time range for faster schedule lookups.
-- This will be crucial for the performance of our "Get Schedule" query.
CREATE INDEX idx_bookings_room_id_start_time ON booking.bookings (room_id, start_time);

-- You can add comments on tables and columns for better documentation.
COMMENT ON TABLE booking.bookings IS 'Stores all room booking information for lectures and events.';
COMMENT ON COLUMN booking.bookings.lecturer_id IS 'References the user ID from the auth.users table.';

-- --- SEED DATA (Optional, but good for testing) ---
-- We can pre-populate the table with a sample booking for testing purposes.
-- Note: You will need to know the lecturer's UUID from the auth.users table.
-- Let's assume we will look it up later or use a known value. For now, this is commented out.
/*
INSERT INTO booking.bookings (room_id, lecturer_id, course_title, start_time, end_time) VALUES
('C101', 'the-uuid-of-lecturer@university.com', 'Advanced Software Engineering', '2025-11-21 10:00:00+07', '2025-11-21 11:00:00+07');
*/