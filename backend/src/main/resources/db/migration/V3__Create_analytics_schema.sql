-- Analytics and reliability metrics tables

-- Pre-computed reliability metrics by route, stop, hour, and day of week
CREATE TABLE metrics_route_stop_hour (
    id BIGSERIAL PRIMARY KEY,
    route_id VARCHAR(50) NOT NULL,
    stop_id VARCHAR(50) NOT NULL,
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7), -- 1=Monday, 7=Sunday
    samples INTEGER NOT NULL DEFAULT 0,
    median_delay_seconds INTEGER DEFAULT 0,
    p90_delay_seconds INTEGER DEFAULT 0,
    on_time_percentage DECIMAL(5, 4) DEFAULT 0.0, -- 0.0 to 1.0
    headway_std_seconds DECIMAL(8, 2) DEFAULT 0.0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (route_id) REFERENCES routes(id),
    FOREIGN KEY (stop_id) REFERENCES stops(id),
    UNIQUE (route_id, stop_id, hour, day_of_week)
);

CREATE INDEX idx_metrics_route_stop_hour_route ON metrics_route_stop_hour (route_id);
CREATE INDEX idx_metrics_route_stop_hour_stop ON metrics_route_stop_hour (stop_id);
CREATE INDEX idx_metrics_route_stop_hour_time ON metrics_route_stop_hour (hour, day_of_week);
CREATE INDEX idx_metrics_route_stop_hour_updated ON metrics_route_stop_hour (last_updated);

-- Daily aggregated metrics for trending
CREATE TABLE metrics_daily_summary (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    route_id VARCHAR(50) NOT NULL,
    total_trips INTEGER DEFAULT 0,
    on_time_trips INTEGER DEFAULT 0,
    delayed_trips INTEGER DEFAULT 0,
    cancelled_trips INTEGER DEFAULT 0,
    avg_delay_seconds DECIMAL(8, 2) DEFAULT 0.0,
    max_delay_seconds INTEGER DEFAULT 0,
    on_time_percentage DECIMAL(5, 4) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (route_id) REFERENCES routes(id),
    UNIQUE (date, route_id)
);

CREATE INDEX idx_metrics_daily_summary_date ON metrics_daily_summary (date);
CREATE INDEX idx_metrics_daily_summary_route ON metrics_daily_summary (route_id);

-- EWMA (Exponentially Weighted Moving Average) state for real-time predictions
CREATE TABLE ewma_state (
    id BIGSERIAL PRIMARY KEY,
    route_id VARCHAR(50) NOT NULL,
    stop_id VARCHAR(50) NOT NULL,
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
    ewma_delay DECIMAL(8, 2) DEFAULT 0.0, -- Current EWMA value
    alpha DECIMAL(4, 3) DEFAULT 0.3, -- Smoothing factor
    sample_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (route_id) REFERENCES routes(id),
    FOREIGN KEY (stop_id) REFERENCES stops(id),
    UNIQUE (route_id, stop_id, hour, day_of_week)
);

CREATE INDEX idx_ewma_state_route_stop ON ewma_state (route_id, stop_id);
CREATE INDEX idx_ewma_state_time ON ewma_state (hour, day_of_week);

-- Route-stop relationships (derived from stop_times for quick lookups)
CREATE TABLE route_stops (
    id BIGSERIAL PRIMARY KEY,
    route_id VARCHAR(50) NOT NULL,
    stop_id VARCHAR(50) NOT NULL,
    stop_sequence_min INTEGER, -- Minimum sequence number for this stop on this route
    stop_sequence_max INTEGER, -- Maximum sequence number for this stop on this route
    direction_id INTEGER, -- 0 or 1, null if both directions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (route_id) REFERENCES routes(id),
    FOREIGN KEY (stop_id) REFERENCES stops(id),
    UNIQUE (route_id, stop_id, direction_id)
);

CREATE INDEX idx_route_stops_route ON route_stops (route_id);
CREATE INDEX idx_route_stops_stop ON route_stops (stop_id);

-- Data ingestion tracking
CREATE TABLE ingestion_log (
    id BIGSERIAL PRIMARY KEY,
    source_type VARCHAR(20) NOT NULL, -- 'gtfs_static', 'gtfs_rt', 'mbta_v3'
    source_url VARCHAR(500),
    status VARCHAR(20) NOT NULL, -- 'started', 'completed', 'failed'
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ingestion_log_source_type ON ingestion_log (source_type);
CREATE INDEX idx_ingestion_log_started_at ON ingestion_log (started_at);
CREATE INDEX idx_ingestion_log_status ON ingestion_log (status);
