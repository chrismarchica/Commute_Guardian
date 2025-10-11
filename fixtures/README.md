# Commute Guardian Fixtures

This directory contains sample data and fixtures for offline development and demonstration of the Commute Guardian system.

## Directory Structure

```
fixtures/
├── gtfs-static/
│   └── mbta.zip          # Sample GTFS static data
├── gtfsrt/
│   ├── trip_updates.pb   # Sample GTFS-RT trip updates
│   └── vehicle_positions.pb # Sample GTFS-RT vehicle positions
└── README.md
```

## Usage

### Offline Demo Mode

To run Commute Guardian in offline demo mode using these fixtures:

1. **Start the application:**
   ```powershell
   .\scripts\dev.ps1 -Docker
   ```

2. **Load static data:**
   ```bash
   curl -X POST "http://localhost:8080/admin/loadStatic?source=file"
   ```

3. **Start fixture replay:**
   ```bash
   curl -X POST "http://localhost:8080/admin/replayFixtures?speed=10"
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - API Documentation: http://localhost:8080/swagger-ui.html

### Fixture Data Description

#### GTFS Static Data (`gtfs-static/mbta.zip`)

Contains sample MBTA route and schedule data including:
- **routes.txt**: Major MBTA lines (Red, Orange, Blue, Green branches)
- **stops.txt**: Key stations and stops
- **trips.txt**: Sample trip patterns
- **stop_times.txt**: Scheduled arrival/departure times
- **calendar.txt**: Service patterns (weekday/weekend)

**Sample Routes:**
- Red Line: Alewife ↔ Braintree/Ashmont
- Orange Line: Oak Grove ↔ Forest Hills
- Blue Line: Wonderland ↔ Bowdoin
- Green Line B: Boston College ↔ Government Center
- Green Line C: Cleveland Circle ↔ Government Center

**Key Stops:**
- Park Street (place-pktrm) - Red/Green interchange
- Downtown Crossing (place-dwnxg) - Red/Orange interchange
- Government Center (place-gover) - Blue/Green interchange
- Harvard (place-harsq) - Red Line terminus
- South Station (place-sstat) - Red Line major station

#### GTFS-RT Data (`gtfsrt/`)

Contains sample real-time data files:

**trip_updates.pb**: Protobuf-encoded trip updates with:
- Delay information for various routes
- Schedule relationship changes
- Stop-level predictions

**vehicle_positions.pb**: Protobuf-encoded vehicle positions with:
- Real-time vehicle locations
- Current status and occupancy
- Trip assignments

### Fixture Replay Behavior

When fixture replay is active:

1. **Speed Control**: Replay speed can be adjusted (1x to 100x real-time)
2. **Data Simulation**: Generates realistic delay patterns and vehicle movements
3. **Reliability Metrics**: Builds historical data for reliability analysis
4. **Leave-Now Advice**: Enables predictive departure recommendations

### Creating Custom Fixtures

To create your own fixture data:

1. **GTFS Static**: 
   - Download real MBTA GTFS data from https://cdn.mbta.com/MBTA_GTFS.zip
   - Filter to desired routes/stops
   - Place in `fixtures/gtfs-static/mbta.zip`

2. **GTFS-RT**:
   - Capture real-time feeds from MBTA
   - Convert to protobuf format
   - Place in `fixtures/gtfsrt/` directory

### Environment Variables

The following environment variables control fixture behavior:

```bash
# Fixture file paths (relative to application root)
FIXTURES_GTFS_STATIC_PATH=fixtures/gtfs-static/mbta.zip
FIXTURES_GTFSRT_PATH=fixtures/gtfsrt/

# Replay settings
FIXTURES_REPLAY_SPEED=10
FIXTURES_REPLAY_LOOP=true
```

### Troubleshooting

**No fixture files found:**
- Ensure fixture files exist in the correct directories
- Check file permissions (readable by application)
- Verify file formats (ZIP for static, protobuf for real-time)

**Replay not working:**
- Check that static data was loaded first
- Verify fixture files contain valid data
- Monitor application logs for errors

**Performance issues:**
- Reduce replay speed for large datasets
- Limit the number of concurrent replay threads
- Monitor memory usage during replay

### Production Considerations

**Important**: These fixtures are for development and demonstration only. In production:

1. Replace with real MBTA API endpoints
2. Implement proper error handling for API failures
3. Add authentication for MBTA API access
4. Set up monitoring for data quality
5. Implement data retention policies

### Data Sources

Sample data is derived from:
- MBTA GTFS Static: https://cdn.mbta.com/MBTA_GTFS.zip
- MBTA GTFS-RT: https://cdn.mbta.com/realtime/
- MBTA v3 API: https://api-v3.mbta.com/

For the most current data, always use the live MBTA feeds in production.
