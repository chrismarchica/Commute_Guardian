# Commute Guardian Test Script
# Runs tests for both backend and frontend applications

param(
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$Integration,
    [switch]$Coverage,
    [switch]$Watch,
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
Commute Guardian Test Script

USAGE:
    .\scripts\test.ps1 [OPTIONS]

OPTIONS:
    -Backend        Run only backend tests (JUnit + Testcontainers)
    -Frontend       Run only frontend tests (Vitest)
    -Integration    Run integration tests
    -Coverage       Generate test coverage reports
    -Watch          Run tests in watch mode (frontend only)
    -Help           Show this help message

EXAMPLES:
    .\scripts\test.ps1                  # Run all tests
    .\scripts\test.ps1 -Backend         # Run only backend tests
    .\scripts\test.ps1 -Frontend        # Run only frontend tests
    .\scripts\test.ps1 -Coverage        # Run tests with coverage
    .\scripts\test.ps1 -Frontend -Watch # Run frontend tests in watch mode

REQUIREMENTS:
    - Java 21+ (for backend tests)
    - Maven 3.8+ (for backend tests)
    - Node.js 18+ (for frontend tests)
    - Docker (for integration tests with Testcontainers)

"@
}

function Test-TestPrerequisites {
    param([bool]$NeedJava, [bool]$NeedNode, [bool]$NeedDocker)
    
    Write-Info "Checking test prerequisites..."
    
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
            Write-Error "Docker is required for integration tests but not found."
            return $false
        }
    }
    
    return $true
}

function Test-Backend {
    param([bool]$WithCoverage, [bool]$IntegrationTests)
    
    Write-Info "Running backend tests (JUnit + Testcontainers)..."
    
    Push-Location "backend"
    try {
        $testArgs = @("test")
        
        if ($WithCoverage) {
            $testArgs += "jacoco:report"
        }
        
        if ($IntegrationTests) {
            $testArgs += "failsafe:integration-test"
            $testArgs += "failsafe:verify"
        }
        
        Write-Info "Executing: mvnw $($testArgs -join ' ')"
        
        if (Test-Path "mvnw.cmd") {
            & .\mvnw.cmd @testArgs
        } else {
            mvn @testArgs
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backend tests passed!"
            
            # Show test results
            if (Test-Path "target/surefire-reports") {
                $testFiles = Get-ChildItem -Path "target/surefire-reports" -Filter "TEST-*.xml"
                Write-Info "Test reports generated: $($testFiles.Count) files"
            }
            
            # Show coverage report
            if ($WithCoverage -and (Test-Path "target/site/jacoco/index.html")) {
                Write-Info "Coverage report: target/site/jacoco/index.html"
            }
            
            return $true
        } else {
            Write-Error "Backend tests failed"
            return $false
        }
    } finally {
        Pop-Location
    }
}

function Test-Frontend {
    param([bool]$WithCoverage, [bool]$WatchMode)
    
    Write-Info "Running frontend tests (Vitest)..."
    
    Push-Location "frontend"
    try {
        # Ensure dependencies are installed
        if (!(Test-Path "node_modules")) {
            Write-Info "Installing frontend dependencies..."
            npm ci
            
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Failed to install frontend dependencies"
                return $false
            }
        }
        
        # Build test command
        $testCommand = "test"
        if ($WatchMode) {
            $testCommand = "test:watch"
        }
        
        # Set environment variables for testing
        $env:NODE_ENV = "test"
        
        Write-Info "Running frontend tests..."
        if ($WithCoverage) {
            npm run $testCommand -- --coverage
        } else {
            npm run $testCommand
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Frontend tests passed!"
            
            # Show coverage report
            if ($WithCoverage -and (Test-Path "coverage/index.html")) {
                Write-Info "Coverage report: coverage/index.html"
            }
            
            return $true
        } else {
            Write-Error "Frontend tests failed"
            return $false
        }
    } finally {
        Pop-Location
    }
}

function Test-Integration {
    Write-Info "Running integration tests..."
    
    # Start services with Docker Compose
    Push-Location "infra"
    try {
        Write-Info "Starting test environment..."
        docker compose -f docker-compose.yml -f docker-compose.test.yml up -d --build
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to start test environment"
            return $false
        }
        
        # Wait for services to be ready
        Write-Info "Waiting for services to be ready..."
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
                Write-Error "Services failed to start within timeout"
                return $false
            }
            
            Write-Host "." -NoNewline
        } while ($attempt -lt $maxAttempts)
        
        Write-Host ""
        
        # Run integration tests
        Write-Info "Running API integration tests..."
        
        # Test health endpoint
        try {
            $healthResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/health" -Method GET
            if ($healthResponse.status -eq "ok") {
                Write-Success "✅ Health endpoint test passed"
            } else {
                Write-Error "❌ Health endpoint test failed"
                return $false
            }
        } catch {
            Write-Error "❌ Health endpoint test failed: $($_.Exception.Message)"
            return $false
        }
        
        # Test admin endpoints
        try {
            Write-Info "Testing admin endpoints..."
            $loadResponse = Invoke-RestMethod -Uri "http://localhost:8080/admin/loadStatic?source=file" -Method POST
            if ($loadResponse.status -eq "success") {
                Write-Success "✅ Load static data test passed"
            } else {
                Write-Warning "⚠️ Load static data test returned: $($loadResponse.status)"
            }
        } catch {
            Write-Warning "⚠️ Load static data test failed: $($_.Exception.Message)"
        }
        
        # Test frontend
        try {
            $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10
            if ($frontendResponse.StatusCode -eq 200) {
                Write-Success "✅ Frontend accessibility test passed"
            } else {
                Write-Error "❌ Frontend accessibility test failed"
                return $false
            }
        } catch {
            Write-Error "❌ Frontend accessibility test failed: $($_.Exception.Message)"
            return $false
        }
        
        Write-Success "Integration tests completed successfully!"
        return $true
        
    } finally {
        # Clean up
        Write-Info "Cleaning up test environment..."
        docker compose down -v --remove-orphans
        Pop-Location
    }
}

function Generate-TestReport {
    param([bool]$BackendSuccess, [bool]$FrontendSuccess, [bool]$IntegrationSuccess)
    
    Write-Info "Test Report:"
    Write-Info "============"
    
    if ($BackendSuccess) {
        Write-Success "✅ Backend tests: PASSED"
    } else {
        Write-Error "❌ Backend tests: FAILED"
    }
    
    if ($FrontendSuccess) {
        Write-Success "✅ Frontend tests: PASSED"
    } else {
        Write-Error "❌ Frontend tests: FAILED"
    }
    
    if ($IntegrationSuccess) {
        Write-Success "✅ Integration tests: PASSED"
    } else {
        Write-Error "❌ Integration tests: FAILED"
    }
    
    $overallSuccess = $BackendSuccess -and $FrontendSuccess -and (!$Integration -or $IntegrationSuccess)
    
    if ($overallSuccess) {
        Write-Success "🎉 All tests: PASSED"
        Write-Info ""
        Write-Info "Coverage reports (if generated):"
        Write-Info "  - Backend: backend/target/site/jacoco/index.html"
        Write-Info "  - Frontend: frontend/coverage/index.html"
    } else {
        Write-Error "💥 Some tests: FAILED"
        Write-Info "Check the error messages above and fix any issues."
    }
    
    return $overallSuccess
}

# Main script logic
if ($Help) {
    Show-Help
    exit 0
}

# Default to running all tests if no specific component specified
$runBackend = $Backend -or (!$Backend -and !$Frontend -and !$Integration)
$runFrontend = $Frontend -or (!$Backend -and !$Frontend -and !$Integration)
$runIntegration = $Integration

# Check prerequisites
$needJava = $runBackend -or $runIntegration
$needNode = $runFrontend -or $runIntegration
$needDocker = $runIntegration

if (!(Test-TestPrerequisites -NeedJava $needJava -NeedNode $needNode -NeedDocker $needDocker)) {
    exit 1
}

# Track test results
$backendSuccess = $true
$frontendSuccess = $true
$integrationSuccess = $true

# Run tests
if ($runBackend) {
    $backendSuccess = Test-Backend -WithCoverage $Coverage -IntegrationTests $runIntegration
}

if ($runFrontend) {
    $frontendSuccess = Test-Frontend -WithCoverage $Coverage -WatchMode $Watch
}

if ($runIntegration) {
    $integrationSuccess = Test-Integration
}

# Generate report (skip if in watch mode)
if (!$Watch) {
    $overallSuccess = Generate-TestReport -BackendSuccess $backendSuccess -FrontendSuccess $frontendSuccess -IntegrationSuccess $integrationSuccess
    
    # Exit with appropriate code
    if ($overallSuccess) {
        exit 0
    } else {
        exit 1
    }
}
