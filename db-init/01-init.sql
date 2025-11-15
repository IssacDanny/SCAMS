-- Create a dedicated schema for our service to keep things organized.
CREATE SCHEMA IF NOT EXISTS auth;

-- Create the users table within the 'auth' schema.
CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert our initial lecturer user.
-- The password hash is for 'password123' and is the exact same as before.
INSERT INTO auth.users (username, password_hash, role) VALUES
('lecturer@university.com', '$2a$10$Z5Ogq.1SzmTG10fhaf8ZiuiwrXh1TX4X7dl6tlSqJpEl/I1jrFdVO', 'lecturer');