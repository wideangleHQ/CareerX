# CareerX
#
# Run `just` with no arguments to see everything.
# Docs: `just docs` then open http://localhost:3081
#
# CareerX needs Redis and a reachable PerformX API. `just doctor` checks both.

# Package manager. Override per invocation: `just pm=npm install`
pm := "bun"

server_port := "3000"
client_port := "3001"

# Required environment variables, checked by `just check-env`
server_env_required := "DATABASE_URL DIRECT_URL REDIS_URL CAREER_JWT_SECRET PERFORMX_API_URL PERFORMX_JWT_SECRET PERFORMX_INTERNAL_API_KEY CORS_ORIGINS RESEND_API_KEY EMAIL_FROM SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY NEXT_PUBLIC_APP_URL"
client_env_required := "NEXT_PUBLIC_API_URL NEXT_PUBLIC_PERFORMX_LOGIN_URL"

# Show all recipes
default:
    @just --list --unsorted

# ---------------------------------------------------------------- getting set up

# Day one: install everything, generate the Prisma client, check env and services
setup: install db-generate
    @just check-env
    @echo ""
    @echo "Setup done. Start Redis with 'just redis', then both processes with 'just dev'."

# Install dependencies in server and client
install:
    cd server && {{pm}} install
    cd client && {{pm}} install

# Warn about missing environment variables before they break something quietly
check-env:
    #!/usr/bin/env bash
    missing=0
    for f in server client; do
        env_file="$f/.env"
        [ "$f" = "client" ] && env_file="client/.env.local"
        if [ ! -f "$env_file" ]; then
            echo "MISSING FILE  $env_file"
            missing=1
            continue
        fi
        required="{{server_env_required}}"
        [ "$f" = "client" ] && required="{{client_env_required}}"
        for key in $required; do
            if ! grep -qE "^\s*${key}=..*" "$env_file"; then
                echo "MISSING VAR   $env_file  $key"
                missing=1
            fi
        done
    done
    if [ "$missing" -eq 0 ]; then
        echo "Environment looks complete."
    else
        echo ""
        echo "See docs/src/p1_setup.md for what each variable is for."
        echo "Two of these fail silently rather than loudly:"
        echo "  CORS_ORIGINS empty       allows every origin"
        echo "  PERFORMX_JWT_SECRET unset  skips local token verification"
        exit 1
    fi

# Check the things CareerX depends on but does not start itself
doctor:
    #!/usr/bin/env bash
    echo -n "Redis:    "
    redis-cli ping 2>/dev/null || echo "not reachable (start it with: just redis)"
    px=$(grep -E '^\s*PERFORMX_API_URL=' server/.env 2>/dev/null | cut -d= -f2- | tr -d '"'"'"' ')
    px=${px:-http://localhost:4000}
    code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "$px/api/v1/auth/check-md" 2>/dev/null)
    if [ -z "$code" ] || [ "$code" = "000" ]; then
        echo "PerformX: not reachable at $px"
    else
        echo "PerformX: HTTP $code at $px"
    fi
    code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:{{server_port}}/api/v1/health" 2>/dev/null)
    if [ -z "$code" ] || [ "$code" = "000" ]; then
        echo "CareerX:  not running on {{server_port}}"
    else
        echo "CareerX:  HTTP $code on {{server_port}}"
    fi

# Start Redis in Docker. Sessions and all four queues need it.
redis:
    docker run -d -p 6379:6379 --name careerx-redis redis:7-alpine || docker start careerx-redis

# Stop the Redis container
redis-stop:
    -docker stop careerx-redis

# ---------------------------------------------------------------- running

# Run the API and the client together. Ctrl-C stops both.
dev:
    #!/usr/bin/env bash
    set -euo pipefail
    trap 'kill 0' EXIT
    just dev-server &
    just dev-client &
    wait

# API only, watch mode, port 3000
dev-server:
    cd server && {{pm}} run start:dev

# Client only, port 3001
dev-client:
    cd client && {{pm}} run dev

# Free both ports when a previous run left something behind
kill-ports:
    -npx kill-port {{server_port}} {{client_port}}

# ---------------------------------------------------------------- building

# Build both for production
build: build-server build-client

# Build the API (runs prisma generate first)
build-server:
    cd server && {{pm}} run build

# Build the client
build-client:
    cd client && {{pm}} run build

# Run the built API
start-server:
    cd server && {{pm}} run start

# Run the built client
start-client:
    cd client && {{pm}} run start

# middleware.ts is a no-op outside production, so domain routing only works here
# Build and serve the client the way production does
prod-preview: build-client
    cd client && NODE_ENV=production {{pm}} run start

# Delete build output and generated files
clean:
    cd server && {{pm}} run clean || true
    rm -rf client/.next docs/book

# ---------------------------------------------------------------- database

# Regenerate the Prisma client. Run this after every schema edit.
db-generate:
    cd server && bunx prisma generate

# migration_lock.toml exists but there are no migrations, see docs/src/p2_data_model.md
# Push schema changes to the database
db-push:
    cd server && bunx prisma db push

# Browse the data
db-studio:
    cd server && bunx prisma studio

# Print the schema models and enums
db-models:
    @grep -nE "^model |^enum " server/prisma/schema.prisma

# ---------------------------------------------------------------- operations

# Overall health: database, Redis, queues, workers, email, scheduler
health:
    @curl -sS http://localhost:{{server_port}}/api/v1/health | head -c 2000; echo ""

# Readiness probe target
ready:
    @curl -sS -o /dev/null -w "ready: HTTP %{http_code}\n" http://localhost:{{server_port}}/api/v1/health/ready

# Queue depth and failure counts (needs a valid session cookie)
queues:
    @curl -sS http://localhost:{{server_port}}/api/v1/monitoring/queues | head -c 2000; echo ""

# ---------------------------------------------------------------- docs

# Serve the engineering handbook at http://localhost:3081 with live reload
docs:
    cd docs && mdbook serve --port 3081 --open

# Build the handbook to docs/book
docs-build:
    cd docs && mdbook build

# ---------------------------------------------------------------- checking

# Lint the client. The server has no linter configured.
lint:
    cd client && {{pm}} run lint

# Type check both without emitting
typecheck:
    cd server && npx tsc --noEmit -p tsconfig.json
    cd client && npx tsc --noEmit -p tsconfig.json

# A controller method with no @UseGuards is public, check new ones here
# Every route the API exposes, grouped by controller
routes:
    #!/usr/bin/env bash
    cd server/src
    for f in $(find . -name "*.controller.ts" | sort); do
        echo "### $f"
        grep -nE "@(Controller|Get|Post|Patch|Put|Delete|Permissions|UseGuards)\(" "$f" | sed 's/^ *//'
    done

# Runs from the pre-commit hook. Run it yourself before a push, the hook is local only.
# Fail if AI attribution is in a tracked file or in the recent history
no-ai-trails:
    #!/usr/bin/env bash
    set -uo pipefail
    pat='Co-Authored-By: *Claude|Generated with \[Claude Code\]|claude\.ai/code|Claude Code|Claude Opus|🤖'
    files=$(git grep -nIE "$pat" -- . ':!justfile' ':!CLAUDE.md' ':!docs/src/decisions.md')
    msgs=$(git log -50 --format='%h %s%n%b' | grep -E "$pat")
    if [ -n "$files" ] || [ -n "$msgs" ]; then
        echo "AI attribution found. Strip it before this goes anywhere."
        [ -n "$files" ] && echo "$files"
        [ -n "$msgs" ] && printf 'in commit messages:\n%s\n' "$msgs"
        exit 1
    fi
    echo "No AI trails."

# List endpoints that have no guard on the method or the class
public-routes:
    @echo "Controllers with no @UseGuards line at all:"
    @grep -L "UseGuards" server/src/modules/*/*.controller.ts || true
