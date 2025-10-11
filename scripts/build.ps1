# Commute Guardian Build Script
# Builds both backend and frontend applications

param(
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$Docker,
    [switch]$Clean,
    [switch]$Test,
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
Commute Guardian Build Script

USAGE:
    .\scripts\build.ps1 [OPTIONS]

OPTIONS:
    -Backend    Build only the backend (Spring Boot)
    -Frontend   Build only the frontend (Next.js)
    -Docker     Build Docker images
    -Clean      Clean build artifacts before building
    -Test       Run tests after building
    -Help       Show this help message

EXAMPLES:
    .\scripts\build.ps1                 # Build both backend and frontend
    .\scripts\build.ps1 -Backend        # Build only backend
    .\scripts\build.ps1 -Frontend       # Build only frontend
    .\scripts\build.ps1 -Docker         # Build Docker images
    .\scripts\build.ps1 -Clean -Test    # Clean build with tests

REQUIREMENTS:
    - Java 21+ (for backend)
    - Maven 3.8+ (for backend)
    - Node.js 18+ (for frontend)
    - Docker (for Docker builds)

"@
}

function Test-BuildPrerequisites {
    param([bool]$NeedJava, [bool]$NeedNode, [bool]$NeedDocker)
    
    Write-Info "Checking build prerequisites..."
    
    if ($NeedJava) {
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
        
        try {
            $mvnVersion = mvn --version 2>$null | Select-Object -First 1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Maven found: $mvnVersion"
            } else {
                Write-Warning "Maven not found. Using Maven wrapper."
            }
        } catch {
            Write-Warning "Maven not found. Using Maven wrapper."
        }
    }
    
    if ($NeedNode) {
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
        
        try {
            $npmVersion = npm --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "npm found: $npmVersion"
            } else {
                throw "npm not found"
            }
        } catch {
            Write-Error "npm is required but not found."
            return $false
        }
    }
    
    if ($NeedDocker) {
        try {
            $dockerVersion = docker --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Docker found: $dockerVersion"
            } else {
                throw "Docker not found"
            }
        } catch {
            Write-Error "Docker is required but not found."
            return $false
        }
    }
    
    return $true
}

function Build-Backend {
    param([bool]$CleanBuild, [bool]$RunTests)
    
    Write-Info "Building backend (Spring Boot)..."
    
    Push-Location "backend"
    try {
        if ($CleanBuild) {
            Write-Info "Cleaning backend..."
            if (Test-Path "mvnw.cmd") {
                & .\mvnw.cmd clean
            } else {
                mvn clean
            }
            
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Backend clean failed"
                return $false
            }
        }
        
        # Build command
        $buildArgs = @("package")
        if (!$RunTests) {
            $buildArgs += "-DskipTests"
        }
        
        Write-Info "Compiling and packaging backend..."
        if (Test-Path "mvnw.cmd") {
            & .\mvnw.cmd @buildArgs
        } else {
            mvn @buildArgs
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backend build completed successfully!"
            
            # Show build artifacts
            $jarFiles = Get-ChildItem -Path "target" -Filter "*.jar" | Where-Object { !$_.Name.Contains("original") }
            foreach ($jar in $jarFiles) {
                Write-Info "Built: $($jar.FullName) ($([math]::Round($jar.Length / 1MB, 2)) MB)"
            }
            
            return $true
        } else {
            Write-Error "Backend build failed"
            return $false
        }
    } finally {
        Pop-Location
    }
}

function Build-Frontend {
    param([bool]$CleanBuild, [bool]$RunTests)
    
    Write-Info "Building frontend (Next.js)..."
    
    Push-Location "frontend"
    try {
        if ($CleanBuild) {
            Write-Info "Cleaning frontend..."
            if (Test-Path ".next") {
                Remove-Item -Recurse -Force ".next"
            }
            if (Test-Path "node_modules") {
                Write-Info "Removing node_modules (this may take a while)..."
                Remove-Item -Recurse -Force "node_modules"
            }
        }
        
        # Install dependencies
        if (!(Test-Path "node_modules") -or $CleanBuild) {
            Write-Info "Installing frontend dependencies..."
            npm ci
            
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Frontend dependency installation failed"
                return $false
            }
        }
        
        # Run tests if requested
        if ($RunTests) {
            Write-Info "Running frontend tests..."
            npm run test
            
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Frontend tests failed, but continuing with build..."
            }
        }
        
        # Type check
        Write-Info "Running TypeScript type check..."
        npm run type-check
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "TypeScript type check failed"
            return $false
        }
        
        # Build
        Write-Info "Building Next.js application..."
        npm run build
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Frontend build completed successfully!"
            
            # Show build info
            if (Test-Path ".next") {
                $buildSize = (Get-ChildItem -Path ".next" -Recurse | Measure-Object -Property Length -Sum).Sum
                Write-Info "Build size: $([math]::Round($buildSize / 1MB, 2)) MB"
            }
            
            return $true
        } else {
            Write-Error "Frontend build failed"
            return $false
        }
    } finally {
        Pop-Location
    }
}

function Build-DockerImages {
    Write-Info "Building Docker images..."
    
    Push-Location "infra"
    try {
        Write-Info "Building all Docker images..."
        docker compose build --no-cache
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Docker images built successfully!"
            
            # Show image sizes
            Write-Info "Docker images:"
            docker images | Select-String "commute-guardian"
            
            return $true
        } else {
            Write-Error "Docker image build failed"
            return $false
        }
    } finally {
        Pop-Location
    }
}

function Generate-BuildReport {
    param([bool]$BackendSuccess, [bool]$FrontendSuccess, [bool]$DockerSuccess)
    
    Write-Info "Build Report:"
    Write-Info "============="
    
    if ($BackendSuccess) {
        Write-Success "✅ Backend build: SUCCESS"
    } else {
        Write-Error "❌ Backend build: FAILED"
    }
    
    if ($FrontendSuccess) {
        Write-Success "✅ Frontend build: SUCCESS"
    } else {
        Write-Error "❌ Frontend build: FAILED"
    }
    
    if ($DockerSuccess) {
        Write-Success "✅ Docker build: SUCCESS"
    } else {
        Write-Error "❌ Docker build: FAILED"
    }
    
    $overallSuccess = $BackendSuccess -and $FrontendSuccess -and (!$Docker -or $DockerSuccess)
    
    if ($overallSuccess) {
        Write-Success "🎉 Overall build: SUCCESS"
        Write-Info ""
        Write-Info "Next steps:"
        Write-Info "  - Run tests: .\scripts\test.ps1"
        Write-Info "  - Start development: .\scripts\dev.ps1"
        Write-Info "  - Deploy: docker compose -f infra/docker-compose.yml up"
    } else {
        Write-Error "💥 Overall build: FAILED"
        Write-Info "Check the error messages above and fix any issues."
    }
    
    return $overallSuccess
}

# Main script logic
if ($Help) {
    Show-Help
    exit 0
}

# Default to building both if no specific component specified
$buildBackend = $Backend -or (!$Backend -and !$Frontend -and !$Docker)
$buildFrontend = $Frontend -or (!$Backend -and !$Frontend -and !$Docker)
$buildDocker = $Docker

# Check prerequisites
$needJava = $buildBackend -or $buildDocker
$needNode = $buildFrontend -or $buildDocker
$needDocker = $buildDocker

if (!(Test-BuildPrerequisites -NeedJava $needJava -NeedNode $needNode -NeedDocker $needDocker)) {
    exit 1
}

# Track build results
$backendSuccess = $true
$frontendSuccess = $true
$dockerSuccess = $true

# Build components
if ($buildBackend) {
    $backendSuccess = Build-Backend -CleanBuild $Clean -RunTests $Test
}

if ($buildFrontend) {
    $frontendSuccess = Build-Frontend -CleanBuild $Clean -RunTests $Test
}

if ($buildDocker) {
    $dockerSuccess = Build-DockerImages
}

# Generate report
$overallSuccess = Generate-BuildReport -BackendSuccess $backendSuccess -FrontendSuccess $frontendSuccess -DockerSuccess $dockerSuccess

# Exit with appropriate code
if ($overallSuccess) {
    exit 0
} else {
    exit 1
}
