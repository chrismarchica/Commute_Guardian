-- Commute Guardian Database Schema
-- GTFS Static Data Tables

-- Routes table (GTFS routes.txt)
CREATE TABLE routes (
    id VARCHAR(50) PRIMARY KEY,
    short_name VARCHAR(10),
    long_name VARCHAR(100) NOT NULL,
    route_type INTEGER NOT NULL, -- 0=Tram, 1=Subway, 2=Rail, 3=Bus, etc.
    color VARCHAR(6),
    text_color VARCHAR(6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stops table (GTFS stops.txt)
CREATE TABLE stops (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location_type INTEGER DEFAULT 0, -- 0=stop, 1=station, 2=entrance
    parent_station VARCHAR(50),
    platform_code VARCHAR(20),
    wheelchair_boarding INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for location queries
CREATE INDEX idx_stops_location ON stops (latitude, longitude);

-- Calendar table (GTFS calendar.txt)
CREATE TABLE calendar (
    service_id VARCHAR(50) PRIMARY KEY,
    monday BOOLEAN NOT NULL DEFAULT FALSE,
    tuesday BOOLEAN NOT NULL DEFAULT FALSE,
    wednesday BOOLEAN NOT NULL DEFAULT FALSE,
    thursday BOOLEAN NOT NULL DEFAULT FALSE,
    friday BOOLEAN NOT NULL DEFAULT FALSE,
    saturday BOOLEAN NOT NULL DEFAULT FALSE,
    sunday BOOLEAN NOT NULL DEFAULT FALSE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trips table (GTFS trips.txt)
CREATE TABLE trips (
    id VARCHAR(50) PRIMARY KEY,
    route_id VARCHAR(50) NOT NULL REFERENCES routes(id),
    service_id VARCHAR(50) NOT NULL REFERENCES calendar(service_id),
    headsign VARCHAR(100),
    direction_id INTEGER DEFAULT 0, -- 0 or 1
    block_id VARCHAR(50),
    shape_id VARCHAR(50),
    wheelchair_accessible INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trips_route_id ON trips (route_id);
CREATE INDEX idx_trips_service_id ON trips (service_id);

-- Stop Times table (GTFS stop_times.txt)
CREATE TABLE stop_times (
    id BIGSERIAL PRIMARY KEY,
    trip_id VARCHAR(50) NOT NULL REFERENCES trips(id),
    stop_id VARCHAR(50) NOT NULL REFERENCES stops(id),
    arrival_time TIME,
    departure_time TIME,
    stop_sequence INTEGER NOT NULL,
    pickup_type INTEGER DEFAULT 0,
    drop_off_type INTEGER DEFAULT 0,
    timepoint INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stop_times_trip_id ON stop_times (trip_id);
CREATE INDEX idx_stop_times_stop_id ON stop_times (stop_id);
CREATE INDEX idx_stop_times_sequence ON stop_times (trip_id, stop_sequence);

-- Calendar Dates table (GTFS calendar_dates.txt) - for exceptions
CREATE TABLE calendar_dates (
    id BIGSERIAL PRIMARY KEY,
    service_id VARCHAR(50) NOT NULL REFERENCES calendar(service_id),
    date DATE NOT NULL,
    exception_type INTEGER NOT NULL, -- 1=added, 2=removed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calendar_dates_service_date ON calendar_dates (service_id, date);
