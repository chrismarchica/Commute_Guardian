#!/bin/bash

# Commute Guardian Development Script
# Starts the development environment for Linux/WSL2

set -e

# Default values
USE_DOCKER=false
USE_LOCAL=false
CLEAN_START=false
SHOW_HELP=false

# Color functions for better output
print_info() {
    echo -e "\033[36mℹ️  $1\033[0m"
}

print_success() {
    echo -e "\033[32m✅ $1\033[0m"
}

print_warning() {
    echo -e "\033[33m⚠️  $1\033[0m"
}

print_error() {
    echo -e "\033[31m❌ $1\033[0m"
}

show_help() {
    cat << EOF
Commute Guardian Development Script

USAGE:
    ./scripts/dev.sh [OPTIONS]

OPTIONS:
    --docker        Start using Docker Compose (recommended)
    --local         Start with local services (requires manual setup)
    --clean         Clean up containers and volumes before starting
    --help          Show this help message

EXAMPLES:
    ./scripts/dev.sh --docker           # Start with Docker (default)
    ./scripts/dev.sh --local            # Start locally
    ./scripts/dev.sh --docker --clean   # Clean start with Docker

REQUIREMENTS:
    - Docker & Docker Compose (for --docker mode)
    - Java 21+ (for --local mode)
    - Node.js 18+ (for --local mode)
    - PostgreSQL 16+ (for --local mode)

EOF
}

test_prerequisites() {
    local use_docker=$1
    
    print_info "Checking prerequisites..."
    
    if [ "$use_docker" = true ]; then
        # Check Docker
        if command -v docker &> /dev/null; then
            docker_version=$(docker --version)
            print_success "Docker found: $docker_version"
        else
            print_error "Docker is required but not found. Please install Docker."
            return 1
        fi
        
        # Check Docker Compose
        if docker compose version &> /dev/null; then
            compose_version=$(docker compose version)
            print_success "Docker Compose found: $compose_version"
        else
            print_error "Docker Compose is required but not found."
            return 1
        fi
    else
        # Check Java
        if command -v java &> /dev/null; then
            java_version=$(java -version 2>&1 | head -n 1)
            if echo "$java_version" | grep -q "21\|22\|23"; then
                print_success "Java found: $java_version"
            else
                print_error "Java 21+ is required. Found: $java_version"
                return 1
            fi
        else
            print_error "Java 21+ is required but not found."
            return 1
        fi
        
        # Check Node.js
        if command -v node &> /dev/null; then
            node_version=$(node --version)
            print_success "Node.js found: $node_version"
        else
            print_error "Node.js 18+ is required but not found."
            return 1
        fi
        
        # Check PostgreSQL
        if command -v psql &> /dev/null; then
            pg_version=$(psql --version)
            print_success "PostgreSQL found: $pg_version"
        else
            print_warning "PostgreSQL client not found. Make sure PostgreSQL server is running."
        fi
    fi
    
    return 0
}

start_docker_environment() {
    local clean_start=$1
    
    print_info "Starting Commute Guardian with Docker..."
    
    # Change to infra directory
    cd infra
    
    if [ "$clean_start" = true ]; then
        print_info "Cleaning up existing containers and volumes..."
        docker compose down -v --remove-orphans
        docker system prune -f
    fi
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        print_info "Creating .env file..."
        cat > .env << 'EOL'
# MBTA API Configuration
MBTA_API_BASE=https://api-v3.mbta.com
MBTA_API_KEY=
GTFS_STATIC_URL=https://cdn.mbta.com/MBTA_GTFS.zip
GTFS_RT_TRIP_UPDATES_URL=https://cdn.mbta.com/realtime/TripUpdates.pb
GTFS_RT_VEHICLE_POSITIONS_URL=https://cdn.mbta.com/realtime/VehiclePositions.pb
GTFS_RT_FETCH_INTERVAL=60s
EOL
        print_success "Created .env file. You can edit it to add your MBTA API key."
    fi
    
    # Start services
    print_info "Starting services..."
    docker compose up --build -d
    
    if [ $? -eq 0 ]; then
        print_success "Services started successfully!"
        print_info "Waiting for services to be ready..."
        
        # Wait for backend health check
        max_attempts=30
        attempt=0
        
        while [ $attempt -lt $max_attempts ]; do
            sleep 2
            attempt=$((attempt + 1))
            
            if curl -f http://localhost:8080/api/health &> /dev/null; then
                print_success "Backend is ready!"
                break
            fi
            
            if [ $attempt -eq $max_attempts ]; then
                print_warning "Backend health check timeout. Services may still be starting."
                break
            fi
            
            echo -n "."
        done
        
        echo ""
        print_success "🚀 Commute Guardian is running!"
        print_info "Frontend: http://localhost:3000"
        print_info "Backend API: http://localhost:8080"
        print_info "API Documentation: http://localhost:8080/swagger-ui.html"
        print_info "Database: localhost:5432 (postgres/postgres)"
        print_info ""
        print_info "To load sample data, run:"
        print_info "  curl -X POST http://localhost:8080/admin/loadStatic?source=file"
        print_info "  curl -X POST http://localhost:8080/admin/replayFixtures?speed=10"
        print_info ""
        print_info "To stop services: docker compose down"
        print_info "To view logs: docker compose logs -f"
    else
        print_error "Failed to start services. Check Docker logs for details."
        return 1
    fi
    
    # Return to original directory
    cd ..
}

start_local_environment() {
    print_info "Starting Commute Guardian locally..."
    print_warning "Local development requires manual setup of PostgreSQL database."
    print_info "Make sure PostgreSQL is running on localhost:5432 with database 'commute_guardian'"
    
    # Start backend in background
    print_info "Starting backend..."
    cd backend
    if [ -f "./mvnw" ]; then
        ./mvnw spring-boot:run &
        backend_pid=$!
        print_success "Backend started in background (PID: $backend_pid)"
    else
        print_error "Maven wrapper not found in backend directory"
        return 1
    fi
    cd ..
    
    # Wait a bit for backend to start
    sleep 5
    
    # Start frontend
    print_info "Starting frontend..."
    cd frontend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_info "Installing frontend dependencies..."
        npm install
    fi
    
    print_info "Starting Next.js development server..."
    npm run dev
    
    cd ..
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --docker)
            USE_DOCKER=true
            shift
            ;;
        --local)
            USE_LOCAL=true
            shift
            ;;
        --clean)
            CLEAN_START=true
            shift
            ;;
        --help)
            SHOW_HELP=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main script logic
if [ "$SHOW_HELP" = true ]; then
    show_help
    exit 0
fi

# Default to Docker if no mode specified
if [ "$USE_DOCKER" = false ] && [ "$USE_LOCAL" = false ]; then
    USE_DOCKER=true
fi

# Check prerequisites
if ! test_prerequisites $USE_DOCKER; then
    exit 1
fi

# Start the appropriate environment
if [ "$USE_DOCKER" = true ]; then
    start_docker_environment $CLEAN_START
else
    start_local_environment
fi
