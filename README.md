# Commute Guardian (MBTA)

**Real-time MBTA reliability tracking and smart departure advice for Boston commuters**

Commute Guardian is a production-ready monorepo application that ingests MBTA data (GTFS static + GTFS-Realtime), computes reliability metrics by route/stop/time-of-day, and provides intelligent "leave-now" advice to help Boston transit riders make informed commuting decisions.

![Commute Guardian Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)

## Features

### Core Functionality
- **Real-time Reliability Tracking**: Continuous monitoring of MBTA service performance
- **Smart Leave-Now Advice**: AI-powered departure recommendations with risk assessment
- **Historical Analysis**: Route/stop reliability patterns by time-of-day and day-of-week
- **Service Alerts Integration**: Real-time service disruption notifications
- **Offline Demo Mode**: Complete functionality using fixture data (no API keys required)

### Technical Highlights
- **Monorepo Architecture**: Organized codebase with shared types and utilities
- **MBTA Data Ingestion**: Supports both GTFS static/realtime and MBTA v3 REST API
- **EWMA Predictions**: Exponentially Weighted Moving Average for delay forecasting
- **Microservices Ready**: Containerized with Docker and orchestration support
- **Production Monitoring**: Health checks, metrics, and comprehensive logging
- **Windows-First Development**: PowerShell scripts for seamless Windows development

## Architecture

```
commute-guardian/
├─ backend/                 # Spring Boot 3 + Java 21
│  ├─ src/main/java/com/commute/mbta/
│  │  ├─ controller/        # REST API endpoints
│  │  ├─ service/          # Business logic & MBTA integration
│  │  ├─ entity/           # JPA entities
│  │  └─ dto/              # Data transfer objects
│  ├─ src/main/resources/
│  │  ├─ application.yml   # Configuration
│  │  └─ db/migration/     # Flyway database migrations
│  └─ Dockerfile
│
├─ frontend/                # Next.js 14 + TypeScript + Tailwind
│  ├─ src/app/             # App Router pages
│  ├─ src/components/      # React components
│  ├─ src/lib/             # Utilities & API client
│  └─ Dockerfile
│
├─ shared/api-client/       # Shared TypeScript types
├─ infra/                  # Docker Compose & infrastructure
├─ fixtures/               # Sample data for offline demo
├─ scripts/                # PowerShell development scripts
└─ .github/workflows/      # CI/CD pipeline
```

## Quick Start

### Prerequisites
- **Docker Desktop** (recommended) OR
- **Java 21+**, **Node.js 18+**, **PostgreSQL 16+** (for local development)

### Option 1: Docker (Recommended)

**Windows (PowerShell):**
```powershell
# Clone the repository
git clone https://github.com/your-org/commute-guardian.git
cd commute-guardian

# Start the complete stack
.\scripts\dev.ps1 -Docker

# Load sample data for offline demo
curl -X POST "http://localhost:8080/admin/loadStatic?source=file"
curl -X POST "http://localhost:8080/admin/replayFixtures?speed=10"
```

**Linux/WSL2 (Bash):**
```bash
# Clone the repository
git clone https://github.com/your-org/commute-guardian.git
cd commute-guardian

# Start the complete stack
./scripts/dev.sh --docker

# Load sample data for offline demo
curl -X POST "http://localhost:8080/admin/loadStatic?source=file"
curl -X POST "http://localhost:8080/admin/replayFixtures?speed=10"
```

### Option 2: Local Development

**Windows (PowerShell):**
```powershell
# Ensure PostgreSQL is running with database 'commute_guardian'
# Then start both applications
.\scripts\dev.ps1 -Local
```

**Linux/WSL2 (Bash):**
```bash
# Ensure PostgreSQL is running with database 'commute_guardian'
# Then start both applications
./scripts/dev.sh --local
```

### Access Points
- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/swagger-ui.html
- **Database**: localhost:5432 (postgres/postgres)

## API Endpoints

### Core Endpoints
```http
GET  /api/health                                    # Service health check
GET  /api/stops/near?lat={lat}&lon={lon}&radius=500 # Find nearby stops
GET  /api/routes/{routeId}/reliability?dow=MON&hour=7 # Route reliability metrics
GET  /api/eta?stopId={stopId}&routeId={routeId}     # Real-time predictions
GET  /api/leave-now?fromStop={from}&toStop={to}     # Smart departure advice
```

### Admin Endpoints
```http
POST /admin/loadStatic?source=file     # Load GTFS static data
POST /admin/replayFixtures?speed=10    # Start fixture replay
POST /admin/stopReplay                 # Stop fixture replay
```

### Example API Calls
```bash
# Get reliability for Red Line on Monday at 8 AM
curl "http://localhost:8080/api/routes/Red/reliability?dow=MON&hour=8"

# Find stops near Boston Common
curl "http://localhost:8080/api/stops/near?lat=42.3555&lon=-71.0640&radius=800"

# Get leave-now advice from Park Street to Harvard
curl "http://localhost:8080/api/leave-now?fromStop=place-pktrm&toStop=place-harsq"
```

## Database Schema

### Core Tables
- **`routes`**: MBTA route information (Red, Orange, Blue, Green lines)
- **`stops`**: Station and stop locations with coordinates
- **`trips`** & **`stop_times`**: Scheduled service patterns
- **`rt_trip_updates`**: Real-time delay and prediction data
- **`metrics_route_stop_hour`**: Pre-computed reliability statistics
- **`ewma_state`**: EWMA algorithm state for predictions

### Key Relationships
```sql
routes (1:N) trips (1:N) stop_times (N:1) stops
rt_trip_updates (N:1) routes, stops
metrics_route_stop_hour (N:1) routes, stops
```

## Algorithms & Intelligence

### Reliability Metrics
- **On-time Performance**: Percentage of arrivals within ±2 minutes of schedule
- **Delay Distribution**: Median and 90th percentile delay statistics
- **Headway Variance**: Standard deviation of time between consecutive trains
- **Risk Bands**: LOW (>80% on-time), MEDIUM (60-80%), HIGH (<60%)

### Leave-Now Advice Algorithm
1. **EWMA Delay Prediction**: Real-time delay forecasting using exponential smoothing
2. **Historical Fallback**: Use historical patterns when real-time data is sparse
3. **Risk Assessment**: Multi-factor analysis including time-of-day, service alerts, route characteristics
4. **Departure Windows**: Generate 3 optimal departure options with confidence scores

### Sample Risk Factors
- Peak commuting hours (7-9 AM, 5-7 PM)
- Route characteristics (Green Line surface running)
- Transfer stations (Park Street, Downtown Crossing)
- Active service alerts and disruptions

## Development

### Build Commands

**Windows (PowerShell):**
```powershell
# Build everything
.\scripts\build.ps1

# Build specific components
.\scripts\build.ps1 -Backend
.\scripts\build.ps1 -Frontend
.\scripts\build.ps1 -Docker

# Clean build with tests
.\scripts\build.ps1 -Clean -Test
```

**Linux/WSL2 (Bash):**
```bash
# Build everything
./scripts/build.sh

# Build specific components
./scripts/build.sh --backend
./scripts/build.sh --frontend
./scripts/build.sh --docker

# Clean build with tests
./scripts/build.sh --clean --test
```

### Testing

**Windows (PowerShell):**
```powershell
# Run all tests
.\scripts\test.ps1

# Run specific test suites
.\scripts\test.ps1 -Backend      # JUnit + Testcontainers
.\scripts\test.ps1 -Frontend     # Vitest + React Testing Library
.\scripts\test.ps1 -Integration  # End-to-end API tests

# Generate coverage reports
.\scripts\test.ps1 -Coverage
```

**Linux/WSL2 (Bash):**
```bash
# Run all tests
./scripts/test.sh

# Run specific test suites
./scripts/test.sh --backend      # JUnit + Testcontainers
./scripts/test.sh --frontend     # Vitest + React Testing Library
./scripts/test.sh --integration  # End-to-end API tests

# Generate coverage reports
./scripts/test.sh --coverage
```

### Code Quality
- **Backend**: Spotless (Google Java Format) + Checkstyle
- **Frontend**: ESLint + Prettier + TypeScript strict mode
- **Testing**: JUnit 5, Testcontainers, Vitest, React Testing Library
- **CI/CD**: GitHub Actions with automated testing and Docker builds

## Configuration

### Environment Variables

#### Backend Configuration
```yaml
# Database
DB_URL=jdbc:postgresql://localhost:5432/commute_guardian
DB_USER=postgres
DB_PASS=postgres

# MBTA API (optional for fixtures-only mode)
MBTA_API_BASE=https://api-v3.mbta.com
MBTA_API_KEY=your-api-key-here
GTFS_STATIC_URL=https://cdn.mbta.com/MBTA_GTFS.zip
GTFS_RT_TRIP_UPDATES_URL=https://cdn.mbta.com/realtime/TripUpdates.pb
GTFS_RT_VEHICLE_POSITIONS_URL=https://cdn.mbta.com/realtime/VehiclePositions.pb

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

#### Frontend Configuration
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NODE_ENV=development
```

### Sample MBTA Routes & Stops
```javascript
// Major Routes
const routes = {
  'Red': 'Alewife ↔ Braintree/Ashmont',
  'Orange': 'Oak Grove ↔ Forest Hills', 
  'Blue': 'Wonderland ↔ Bowdoin',
  'Green-B': 'Boston College ↔ Government Center',
  'Green-C': 'Cleveland Circle ↔ Government Center'
}

// Key Interchange Stations
const interchanges = {
  'place-pktrm': 'Park Street (Red/Green)',
  'place-dwnxg': 'Downtown Crossing (Red/Orange)',
  'place-gover': 'Government Center (Blue/Green)',
  'place-state': 'State (Blue/Orange)'
}
```

## Deployment

### Docker Compose (Production)
```bash
# Production deployment
docker compose -f infra/docker-compose.yml up -d --build

# With nginx reverse proxy
docker compose -f infra/docker-compose.yml --profile with-nginx up -d

# With Redis caching
docker compose -f infra/docker-compose.yml --profile with-redis up -d
```

### Kubernetes (Example)
```yaml
# See infra/k8s/ for complete Kubernetes manifests
apiVersion: apps/v1
kind: Deployment
metadata:
  name: commute-guardian-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: commute-guardian-backend
  template:
    spec:
      containers:
      - name: backend
        image: ghcr.io/your-org/commute-guardian-backend:latest
        ports:
        - containerPort: 8080
```

## Monitoring & Observability

### Health Checks
- **Application**: `/api/health` endpoint with service status
- **Database**: Connection pool monitoring
- **External APIs**: MBTA API connectivity status
- **Docker**: Built-in health check commands

### Metrics & Logging
- **Spring Boot Actuator**: `/actuator/metrics`, `/actuator/prometheus`
- **Structured Logging**: JSON format with correlation IDs
- **Performance Monitoring**: Request timing, database query performance
- **Business Metrics**: Reliability calculation performance, prediction accuracy

## Offline Demo

Perfect for development, demos, and testing without MBTA API access:

```bash
# 1. Start the application
docker compose -f infra/docker-compose.yml up -d

# 2. Load sample GTFS data
curl -X POST "http://localhost:8080/admin/loadStatic?source=file"

# 3. Start real-time simulation (10x speed)
curl -X POST "http://localhost:8080/admin/replayFixtures?speed=10"

# 4. Open dashboard
open http://localhost:3000
```

The offline demo includes:
- Complete MBTA route network (Red, Orange, Blue, Green lines)
- Realistic delay patterns and service disruptions
- Historical reliability data generation
- Full leave-now advice functionality
- Interactive reliability heatmaps

## Contributing

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `.\scripts\test.ps1`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines
- Follow existing code style (enforced by Spotless/ESLint)
- Add tests for new functionality
- Update documentation for API changes
- Use conventional commit messages
- Ensure all CI checks pass

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **MBTA**: For providing open transit data through GTFS and real-time APIs
- **Spring Boot**: For the robust backend framework
- **Next.js**: For the excellent React framework
- **PostgreSQL**: For reliable data storage
- **Docker**: For containerization and deployment simplicity

## Support

- **Documentation**: Check this README and inline code comments
- **Issues**: [GitHub Issues](https://github.com/your-org/commute-guardian/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/commute-guardian/discussions)
- **API Reference**: http://localhost:8080/swagger-ui.html (when running)

---

**Built for Boston commuters**

*Helping you navigate the T with confidence, one prediction at a time.*
