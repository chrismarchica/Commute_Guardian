#!/bin/bash

# Commute Guardian Test Script
# Runs tests for both backend and frontend applications

set -e

# Default values
TEST_BACKEND=false
TEST_FRONTEND=false
TEST_INTEGRATION=false
WITH_COVERAGE=false
WATCH_MODE=false
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
Commute Guardian Test Script

USAGE:
    ./scripts/test.sh [OPTIONS]

OPTIONS:
    --backend       Run only backend tests (JUnit + Testcontainers)
    --frontend      Run only frontend tests (Vitest)
    --integration   Run integration tests
    --coverage      Generate test coverage reports
    --watch         Run tests in watch mode (frontend only)
    --help          Show this help message

EXAMPLES:
    ./scripts/test.sh                   # Run all tests
    ./scripts/test.sh --backend         # Run only backend tests
    ./scripts/test.sh --frontend        # Run only frontend tests
    ./scripts/test.sh --coverage        # Run tests with coverage
    ./scripts/test.sh --frontend --watch # Run frontend tests in watch mode

REQUIREMENTS:
    - Java 21+ (for backend tests)
    - Maven 3.8+ (for backend tests)
    - Node.js 18+ (for frontend tests)
    - Docker (for integration tests with Testcontainers)

EOF
}

test_test_prerequisites() {
    local need_java=$1
    local need_node=$2
    local need_docker=$3
    
    print_info "Checking test prerequisites..."
    
    if [ "$need_java" = true ]; then
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
    fi
    
    if [ "$need_node" = true ]; then
        if command -v node &> /dev/null; then
            node_version=$(node --version)
            print_success "Node.js found: $node_version"
        else
            print_error "Node.js 18+ is required but not found."
            return 1
        fi
    fi
    
    if [ "$need_docker" = true ]; then
        if command -v docker &> /dev/null; then
            docker_version=$(docker --version)
            print_success "Docker found: $docker_version"
        else
            print_error "Docker is required for integration tests but not found."
            return 1
        fi
    fi
    
    return 0
}

test_backend() {
    local with_coverage=$1
    local integration_tests=$2
    
    print_info "Running backend tests (JUnit + Testcontainers)..."
    
    cd backend
    
    test_args="test"
    
    if [ "$with_coverage" = true ]; then
        test_args="$test_args jacoco:report"
    fi
    
    if [ "$integration_tests" = true ]; then
        test_args="$test_args failsafe:integration-test failsafe:verify"
    fi
    
    print_info "Executing: mvnw $test_args"
    
    if [ -f "./mvnw" ]; then
        ./mvnw $test_args
    else
        mvn $test_args
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Backend tests passed!"
        
        # Show test results
        if [ -d "target/surefire-reports" ]; then
            test_files=$(find target/surefire-reports -name "TEST-*.xml" | wc -l)
            print_info "Test reports generated: $test_files files"
        fi
        
        # Show coverage report
        if [ "$with_coverage" = true ] && [ -f "target/site/jacoco/index.html" ]; then
            print_info "Coverage report: target/site/jacoco/index.html"
        fi
        
        cd ..
        return 0
    else
        print_error "Backend tests failed"
        cd ..
        return 1
    fi
}

test_frontend() {
    local with_coverage=$1
    local watch_mode=$2
    
    print_info "Running frontend tests (Vitest)..."
    
    cd frontend
    
    # Ensure dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_info "Installing frontend dependencies..."
        npm ci
        
        if [ $? -ne 0 ]; then
            print_error "Failed to install frontend dependencies"
            cd ..
            return 1
        fi
    fi
    
    # Set environment variables for testing
    export NODE_ENV=test
    
    print_info "Running frontend tests..."
    
    if [ "$watch_mode" = true ]; then
        npm run test -- --watch
    elif [ "$with_coverage" = true ]; then
        npm run test -- --coverage
    else
        npm run test
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Frontend tests passed!"
        
        # Show coverage report
        if [ "$with_coverage" = true ] && [ -f "coverage/index.html" ]; then
            print_info "Coverage report: coverage/index.html"
        fi
        
        cd ..
        return 0
    else
        print_error "Frontend tests failed"
        cd ..
        return 1
    fi
}

test_integration() {
    print_info "Running integration tests..."
    
    # Start services with Docker Compose
    cd infra
    
    print_info "Starting test environment..."
    docker compose up -d --build
    
    if [ $? -ne 0 ]; then
        print_error "Failed to start test environment"
        cd ..
        return 1
    fi
    
    # Wait for services to be ready
    print_info "Waiting for services to be ready..."
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
            print_error "Services failed to start within timeout"
            docker compose down -v --remove-orphans
            cd ..
            return 1
        fi
        
        echo -n "."
    done
    
    echo ""
    
    # Run integration tests
    print_info "Running API integration tests..."
    
    # Test health endpoint
    if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
        health_response=$(curl -s http://localhost:8080/api/health)
        if echo "$health_response" | grep -q '"status":"ok"'; then
            print_success "✅ Health endpoint test passed"
        else
            print_error "❌ Health endpoint test failed"
            docker compose down -v --remove-orphans
            cd ..
            return 1
        fi
    else
        print_error "❌ Health endpoint test failed"
        docker compose down -v --remove-orphans
        cd ..
        return 1
    fi
    
    # Test admin endpoints
    print_info "Testing admin endpoints..."
    if curl -X POST http://localhost:8080/admin/loadStatic?source=file > /dev/null 2>&1; then
        load_response=$(curl -s -X POST http://localhost:8080/admin/loadStatic?source=file)
        if echo "$load_response" | grep -q '"status":"success"'; then
            print_success "✅ Load static data test passed"
        else
            print_warning "⚠️ Load static data test returned unexpected response"
        fi
    else
        print_warning "⚠️ Load static data test failed"
    fi
    
    # Test frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "✅ Frontend accessibility test passed"
    else
        print_error "❌ Frontend accessibility test failed"
        docker compose down -v --remove-orphans
        cd ..
        return 1
    fi
    
    print_success "Integration tests completed successfully!"
    
    # Clean up
    print_info "Cleaning up test environment..."
    docker compose down -v --remove-orphans
    cd ..
    return 0
}

generate_test_report() {
    local backend_success=$1
    local frontend_success=$2
    local integration_success=$3
    
    print_info "Test Report:"
    print_info "============"
    
    if [ "$backend_success" = true ]; then
        print_success "✅ Backend tests: PASSED"
    else
        print_error "❌ Backend tests: FAILED"
    fi
    
    if [ "$frontend_success" = true ]; then
        print_success "✅ Frontend tests: PASSED"
    else
        print_error "❌ Frontend tests: FAILED"
    fi
    
    if [ "$integration_success" = true ]; then
        print_success "✅ Integration tests: PASSED"
    else
        print_error "❌ Integration tests: FAILED"
    fi
    
    if [ "$backend_success" = true ] && [ "$frontend_success" = true ] && ([ "$TEST_INTEGRATION" = false ] || [ "$integration_success" = true ]); then
        print_success "🎉 All tests: PASSED"
        print_info ""
        print_info "Coverage reports (if generated):"
        print_info "  - Backend: backend/target/site/jacoco/index.html"
        print_info "  - Frontend: frontend/coverage/index.html"
        return 0
    else
        print_error "💥 Some tests: FAILED"
        print_info "Check the error messages above and fix any issues."
        return 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --backend)
            TEST_BACKEND=true
            shift
            ;;
        --frontend)
            TEST_FRONTEND=true
            shift
            ;;
        --integration)
            TEST_INTEGRATION=true
            shift
            ;;
        --coverage)
            WITH_COVERAGE=true
            shift
            ;;
        --watch)
            WATCH_MODE=true
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

# Default to running all tests if no specific component specified
if [ "$TEST_BACKEND" = false ] && [ "$TEST_FRONTEND" = false ] && [ "$TEST_INTEGRATION" = false ]; then
    TEST_BACKEND=true
    TEST_FRONTEND=true
fi

# Check prerequisites
need_java=false
need_node=false
need_docker=false

if [ "$TEST_BACKEND" = true ] || [ "$TEST_INTEGRATION" = true ]; then
    need_java=true
fi

if [ "$TEST_FRONTEND" = true ] || [ "$TEST_INTEGRATION" = true ]; then
    need_node=true
fi

if [ "$TEST_INTEGRATION" = true ]; then
    need_docker=true
fi

if ! test_test_prerequisites $need_java $need_node $need_docker; then
    exit 1
fi

# Track test results
backend_success=true
frontend_success=true
integration_success=true

# Run tests
if [ "$TEST_BACKEND" = true ]; then
    if ! test_backend $WITH_COVERAGE $TEST_INTEGRATION; then
        backend_success=false
    fi
fi

if [ "$TEST_FRONTEND" = true ]; then
    if ! test_frontend $WITH_COVERAGE $WATCH_MODE; then
        frontend_success=false
    fi
fi

if [ "$TEST_INTEGRATION" = true ]; then
    if ! test_integration; then
        integration_success=false
    fi
fi

# Generate report (skip if in watch mode)
if [ "$WATCH_MODE" = false ]; then
    if generate_test_report $backend_success $frontend_success $integration_success; then
        exit 0
    else
        exit 1
    fi
fi
