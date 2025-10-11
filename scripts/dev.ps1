# Commute Guardian Development Script
# Starts the development environment for Windows

param(
    [switch]$Docker,
    [switch]$Local,
    [switch]$Clean,
    [switch]$Help
)

# Color functions for better output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    } else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Info($message) {
    Write-ColorOutput Cyan "ℹ️  $message"
}

function Write-Success($message) {
    Write-ColorOutput Green "✅ $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "⚠️  $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "❌ $message"
}

function Show-Help {
    Write-Host @"
Commute Guardian Development Script

USAGE:
    .\scripts\dev.ps1 [OPTIONS]

OPTIONS:
    -Docker     Start using Docker Compose (recommended)
    -Local      Start with local services (requires manual setup)
    -Clean      Clean up containers and volumes before starting
    -Help       Show this help message

EXAMPLES:
    .\scripts\dev.ps1 -Docker           # Start with Docker (default)
    .\scripts\dev.ps1 -Local            # Start locally
    .\scripts\dev.ps1 -Docker -Clean    # Clean start with Docker

REQUIREMENTS:
    - Docker Desktop (for -Docker mode)
    - Java 21+ (for -Local mode)
    - Node.js 18+ (for -Local mode)
    - PostgreSQL 16+ (for -Local mode)

"@
}

function Test-Prerequisites {
    param([bool]$UseDocker)
    
    Write-Info "Checking prerequisites..."
    
    if ($UseDocker) {
        # Check Docker
        try {
            $dockerVersion = docker --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Docker found: $dockerVersion"
            } else {
                throw "Docker not found"
            }
        } catch {
            Write-Error "Docker is required but not found. Please install Docker Desktop."
            return $false
        }
        
        # Check Docker Compose
        try {
            $composeVersion = docker compose version 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Docker Compose found: $composeVersion"
            } else {
                throw "Docker Compose not found"
            }
        } catch {
            Write-Error "Docker Compose is required but not found."
            return $false
        }
    } else {
        # Check Java
        try {
            $javaVersion = java -version 2>&1 | Select-String "version"
            if ($javaVersion -match '"(\d+)') {
                $majorVersion = [int]$matches[1]
                if ($majorVersion -ge 21) {
                    Write-Success "Java found: $javaVersion"
                } else {
                    Write-Error "Java 21+ is required. Found version $majorVersion"
                    return $false
                }
            }
        } catch {
            Write-Error "Java 21+ is required but not found."
            return $false
        }
        
        # Check Node.js
        try {
            $nodeVersion = node --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Node.js found: $nodeVersion"
            } else {
                throw "Node.js not found"
            }
        } catch {
            Write-Error "Node.js 18+ is required but not found."
            return $false
        }
        
        # Check PostgreSQL
        try {
            $pgVersion = psql --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "PostgreSQL found: $pgVersion"
            } else {
                Write-Warning "PostgreSQL client not found. Make sure PostgreSQL server is running."
            }
        } catch {
            Write-Warning "PostgreSQL client not found. Make sure PostgreSQL server is running."
        }
    }
    
    return $true
}

function Start-DockerEnvironment {
    param([bool]$CleanStart)
    
    Write-Info "Starting Commute Guardian with Docker..."
    
    # Change to infra directory
    Push-Location "infra"
    
    try {
        if ($CleanStart) {
            Write-Info "Cleaning up existing containers and volumes..."
            docker compose down -v --remove-orphans
            docker system prune -f
        }
        
        # Create .env file if it doesn't exist
        if (!(Test-Path ".env")) {
            Write-Info "Creating .env file..."
            @"
# MBTA API Configuration
MBTA_API_BASE=https://api-v3.mbta.com
MBTA_API_KEY=
GTFS_STATIC_URL=https://cdn.mbta.com/MBTA_GTFS.zip
GTFS_RT_TRIP_UPDATES_URL=https://cdn.mbta.com/realtime/TripUpdates.pb
GTFS_RT_VEHICLE_POSITIONS_URL=https://cdn.mbta.com/realtime/VehiclePositions.pb
GTFS_RT_FETCH_INTERVAL=60s
"@ | Out-File -FilePath ".env" -Encoding UTF8
            Write-Success "Created .env file. You can edit it to add your MBTA API key."
        }
        
        # Start services
        Write-Info "Starting services..."
        docker compose up --build -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Services started successfully!"
            Write-Info "Waiting for services to be ready..."
            
            # Wait for backend health check
            $maxAttempts = 30
            $attempt = 0
            do {
                Start-Sleep -Seconds 2
                $attempt++
                try {
                    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
                    if ($response.StatusCode -eq 200) {
                        Write-Success "Backend is ready!"
                        break
                    }
                } catch {
                    # Continue waiting
                }
                
                if ($attempt -eq $maxAttempts) {
                    Write-Warning "Backend health check timeout. Services may still be starting."
                    break
                }
                
                Write-Host "." -NoNewline
            } while ($attempt -lt $maxAttempts)
            
            Write-Host ""
            Write-Success "🚀 Commute Guardian is running!"
            Write-Info "Frontend: http://localhost:3000"
            Write-Info "Backend API: http://localhost:8080"
            Write-Info "API Documentation: http://localhost:8080/swagger-ui.html"
            Write-Info "Database: localhost:5432 (postgres/postgres)"
            Write-Info ""
            Write-Info "To load sample data, run:"
            Write-Info "  curl -X POST http://localhost:8080/admin/loadStatic?source=file"
            Write-Info "  curl -X POST http://localhost:8080/admin/replayFixtures?speed=10"
            Write-Info ""
            Write-Info "To stop services: docker compose down"
            Write-Info "To view logs: docker compose logs -f"
        } else {
            Write-Error "Failed to start services. Check Docker logs for details."
        }
    } finally {
        Pop-Location
    }
}

function Start-LocalEnvironment {
    Write-Info "Starting Commute Guardian locally..."
    Write-Warning "Local development requires manual setup of PostgreSQL database."
    Write-Info "Make sure PostgreSQL is running on localhost:5432 with database 'commute_guardian'"
    
    # Start backend in background
    Write-Info "Starting backend..."
    Push-Location "backend"
    try {
        Start-Process -FilePath "cmd" -ArgumentList "/c", "mvnw.cmd spring-boot:run" -WindowStyle Minimized
        Write-Success "Backend started in background"
    } finally {
        Pop-Location
    }
    
    # Wait a bit for backend to start
    Start-Sleep -Seconds 5
    
    # Start frontend
    Write-Info "Starting frontend..."
    Push-Location "frontend"
    try {
        # Install dependencies if needed
        if (!(Test-Path "node_modules")) {
            Write-Info "Installing frontend dependencies..."
            npm install
        }
        
        Write-Info "Starting Next.js development server..."
        npm run dev
    } finally {
        Pop-Location
    }
}

# Main script logic
if ($Help) {
    Show-Help
    exit 0
}

# Default to Docker if no mode specified
if (!$Docker -and !$Local) {
    $Docker = $true
}

# Check prerequisites
if (!(Test-Prerequisites -UseDocker $Docker)) {
    exit 1
}

# Start the appropriate environment
if ($Docker) {
    Start-DockerEnvironment -CleanStart $Clean
} else {
    Start-LocalEnvironment
}
