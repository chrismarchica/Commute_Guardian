-- Real-time data and analytics tables

-- Real-time trip updates (from GTFS-RT or MBTA v3 API)
CREATE TABLE rt_trip_updates (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    trip_id VARCHAR(50),
    route_id VARCHAR(50) NOT NULL,
    stop_id VARCHAR(50) NOT NULL,
    delay_seconds INTEGER, -- positive = late, negative = early
    vehicle_id VARCHAR(50),
    schedule_relationship VARCHAR(20) DEFAULT 'SCHEDULED', -- SCHEDULED, SKIPPED, NO_DATA
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (route_id) REFERENCES routes(id),
    FOREIGN KEY (stop_id) REFERENCES stops(id)
);

-- Indexes for efficient querying
CREATE INDEX idx_rt_trip_updates_timestamp ON rt_trip_updates (timestamp);
CREATE INDEX idx_rt_trip_updates_route_stop ON rt_trip_updates (route_id, stop_id);
CREATE INDEX idx_rt_trip_updates_trip_id ON rt_trip_updates (trip_id);
CREATE INDEX idx_rt_trip_updates_vehicle_id ON rt_trip_updates (vehicle_id);

-- Partitioning by month for performance (optional, can be added later)
-- CREATE INDEX idx_rt_trip_updates_timestamp_month ON rt_trip_updates (EXTRACT(YEAR FROM timestamp), EXTRACT(MONTH FROM timestamp));

-- Vehicle positions (from GTFS-RT)
CREATE TABLE rt_vehicle_positions (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    vehicle_id VARCHAR(50) NOT NULL,
    trip_id VARCHAR(50),
    route_id VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    bearing DECIMAL(5, 2), -- 0-360 degrees
    speed DECIMAL(5, 2), -- meters per second
    current_stop_sequence INTEGER,
    current_status VARCHAR(20), -- IN_TRANSIT_TO, STOPPED_AT, INCOMING_AT
    occupancy_status VARCHAR(20), -- EMPTY, MANY_SEATS_AVAILABLE, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rt_vehicle_positions_timestamp ON rt_vehicle_positions (timestamp);
CREATE INDEX idx_rt_vehicle_positions_vehicle_id ON rt_vehicle_positions (vehicle_id);
CREATE INDEX idx_rt_vehicle_positions_route_id ON rt_vehicle_positions (route_id);
CREATE INDEX idx_rt_vehicle_positions_location ON rt_vehicle_positions (latitude, longitude);

-- Service alerts
CREATE TABLE service_alerts (
    id VARCHAR(50) PRIMARY KEY,
    cause VARCHAR(50),
    effect VARCHAR(50),
    header_text TEXT,
    description_text TEXT,
    url VARCHAR(500),
    active_period_start TIMESTAMP,
    active_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-many relationship between alerts and routes
CREATE TABLE alert_routes (
    alert_id VARCHAR(50) NOT NULL REFERENCES service_alerts(id),
    route_id VARCHAR(50) NOT NULL REFERENCES routes(id),
    PRIMARY KEY (alert_id, route_id)
);

-- Many-to-many relationship between alerts and stops
CREATE TABLE alert_stops (
    alert_id VARCHAR(50) NOT NULL REFERENCES service_alerts(id),
    stop_id VARCHAR(50) NOT NULL REFERENCES stops(id),
    PRIMARY KEY (alert_id, stop_id)
);
