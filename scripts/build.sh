#!/bin/bash

# Commute Guardian Build Script
# Builds both backend and frontend applications

set -e

# Default values
BUILD_BACKEND=false
BUILD_FRONTEND=false
BUILD_DOCKER=false
CLEAN_BUILD=false
RUN_TESTS=false
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
Commute Guardian Build Script

USAGE:
    ./scripts/build.sh [OPTIONS]

OPTIONS:
    --backend       Build only the backend (Spring Boot)
    --frontend      Build only the frontend (Next.js)
    --docker        Build Docker images
    --clean         Clean build artifacts before building
    --test          Run tests after building
    --help          Show this help message

EXAMPLES:
    ./scripts/build.sh                 # Build both backend and frontend
    ./scripts/build.sh --backend       # Build only backend
    ./scripts/build.sh --frontend      # Build only frontend
    ./scripts/build.sh --docker        # Build Docker images
    ./scripts/build.sh --clean --test  # Clean build with tests

REQUIREMENTS:
    - Java 21+ (for backend)
    - Maven 3.8+ (for backend)
    - Node.js 18+ (for frontend)
    - Docker (for Docker builds)

EOF
}

test_build_prerequisites() {
    local need_java=$1
    local need_node=$2
    local need_docker=$3
    
    print_info "Checking build prerequisites..."
    
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
        
        if command -v mvn &> /dev/null; then
            mvn_version=$(mvn --version | head -n 1)
            print_success "Maven found: $mvn_version"
        else
            print_warning "Maven not found. Using Maven wrapper."
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
        
        if command -v npm &> /dev/null; then
            npm_version=$(npm --version)
            print_success "npm found: $npm_version"
        else
            print_error "npm is required but not found."
            return 1
        fi
    fi
    
    if [ "$need_docker" = true ]; then
        if command -v docker &> /dev/null; then
            docker_version=$(docker --version)
            print_success "Docker found: $docker_version"
        else
            print_error "Docker is required but not found."
            return 1
        fi
    fi
    
    return 0
}

build_backend() {
    local clean_build=$1
    local run_tests=$2
    
    print_info "Building backend (Spring Boot)..."
    
    cd backend
    
    if [ "$clean_build" = true ]; then
        print_info "Cleaning backend..."
        if [ -f "./mvnw" ]; then
            ./mvnw clean
        else
            mvn clean
        fi
        
        if [ $? -ne 0 ]; then
            print_error "Backend clean failed"
            cd ..
            return 1
        fi
    fi
    
    # Build command
    build_args="package"
    if [ "$run_tests" = false ]; then
        build_args="$build_args -DskipTests"
    fi
    
    print_info "Compiling and packaging backend..."
    if [ -f "./mvnw" ]; then
        ./mvnw $build_args
    else
        mvn $build_args
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Backend build completed successfully!"
        
        # Show build artifacts
        for jar_file in target/*.jar; do
            if [[ $jar_file != *"original"* ]] && [ -f "$jar_file" ]; then
                size=$(du -h "$jar_file" | cut -f1)
                print_info "Built: $jar_file ($size)"
            fi
        done
        
        cd ..
        return 0
    else
        print_error "Backend build failed"
        cd ..
        return 1
    fi
}

build_frontend() {
    local clean_build=$1
    local run_tests=$2
    
    print_info "Building frontend (Next.js)..."
    
    cd frontend
    
    if [ "$clean_build" = true ]; then
        print_info "Cleaning frontend..."
        if [ -d ".next" ]; then
            rm -rf .next
        fi
        if [ -d "node_modules" ]; then
            print_info "Removing node_modules (this may take a while)..."
            rm -rf node_modules
        fi
    fi
    
    # Install dependencies
    if [ ! -d "node_modules" ] || [ "$clean_build" = true ]; then
        print_info "Installing frontend dependencies..."
        npm ci
        
        if [ $? -ne 0 ]; then
            print_error "Frontend dependency installation failed"
            cd ..
            return 1
        fi
    fi
    
    # Run tests if requested
    if [ "$run_tests" = true ]; then
        print_info "Running frontend tests..."
        npm run test
        
        if [ $? -ne 0 ]; then
            print_warning "Frontend tests failed, but continuing with build..."
        fi
    fi
    
    # Type check
    print_info "Running TypeScript type check..."
    npm run type-check
    
    if [ $? -ne 0 ]; then
        print_error "TypeScript type check failed"
        cd ..
        return 1
    fi
    
    # Build
    print_info "Building Next.js application..."
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Frontend build completed successfully!"
        
        # Show build info
        if [ -d ".next" ]; then
            build_size=$(du -sh .next | cut -f1)
            print_info "Build size: $build_size"
        fi
        
        cd ..
        return 0
    else
        print_error "Frontend build failed"
        cd ..
        return 1
    fi
}

build_docker_images() {
    print_info "Building Docker images..."
    
    cd infra
    
    print_info "Building all Docker images..."
    docker compose build --no-cache
    
    if [ $? -eq 0 ]; then
        print_success "Docker images built successfully!"
        
        # Show image sizes
        print_info "Docker images:"
        docker images | grep "commute-guardian"
        
        cd ..
        return 0
    else
        print_error "Docker image build failed"
        cd ..
        return 1
    fi
}

generate_build_report() {
    local backend_success=$1
    local frontend_success=$2
    local docker_success=$3
    
    print_info "Build Report:"
    print_info "============="
    
    if [ "$backend_success" = true ]; then
        print_success "✅ Backend build: SUCCESS"
    else
        print_error "❌ Backend build: FAILED"
    fi
    
    if [ "$frontend_success" = true ]; then
        print_success "✅ Frontend build: SUCCESS"
    else
        print_error "❌ Frontend build: FAILED"
    fi
    
    if [ "$docker_success" = true ]; then
        print_success "✅ Docker build: SUCCESS"
    else
        print_error "❌ Docker build: FAILED"
    fi
    
    if [ "$backend_success" = true ] && [ "$frontend_success" = true ] && ([ "$BUILD_DOCKER" = false ] || [ "$docker_success" = true ]); then
        print_success "🎉 Overall build: SUCCESS"
        print_info ""
        print_info "Next steps:"
        print_info "  - Run tests: ./scripts/test.sh"
        print_info "  - Start development: ./scripts/dev.sh"
        print_info "  - Deploy: docker compose -f infra/docker-compose.yml up"
        return 0
    else
        print_error "💥 Overall build: FAILED"
        print_info "Check the error messages above and fix any issues."
        return 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --backend)
            BUILD_BACKEND=true
            shift
            ;;
        --frontend)
            BUILD_FRONTEND=true
            shift
            ;;
        --docker)
            BUILD_DOCKER=true
            shift
            ;;
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        --test)
            RUN_TESTS=true
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

# Default to building both if no specific component specified
if [ "$BUILD_BACKEND" = false ] && [ "$BUILD_FRONTEND" = false ] && [ "$BUILD_DOCKER" = false ]; then
    BUILD_BACKEND=true
    BUILD_FRONTEND=true
fi

# Check prerequisites
need_java=false
need_node=false
need_docker=false

if [ "$BUILD_BACKEND" = true ] || [ "$BUILD_DOCKER" = true ]; then
    need_java=true
fi

if [ "$BUILD_FRONTEND" = true ] || [ "$BUILD_DOCKER" = true ]; then
    need_node=true
fi

if [ "$BUILD_DOCKER" = true ]; then
    need_docker=true
fi

if ! test_build_prerequisites $need_java $need_node $need_docker; then
    exit 1
fi

# Track build results
backend_success=true
frontend_success=true
docker_success=true

# Build components
if [ "$BUILD_BACKEND" = true ]; then
    if ! build_backend $CLEAN_BUILD $RUN_TESTS; then
        backend_success=false
    fi
fi

if [ "$BUILD_FRONTEND" = true ]; then
    if ! build_frontend $CLEAN_BUILD $RUN_TESTS; then
        frontend_success=false
    fi
fi

if [ "$BUILD_DOCKER" = true ]; then
    if ! build_docker_images; then
        docker_success=false
    fi
fi

# Generate report and exit with appropriate code
if generate_build_report $backend_success $frontend_success $docker_success; then
    exit 0
else
    exit 1
fi
