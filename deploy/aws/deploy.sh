#!/usr/bin/env bash
# Run on the EC2 host (manually or via GitHub Actions) to sync main and rebuild containers.
set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/sentinel}"
COMPOSE_DIR="${COMPOSE_DIR:-$REPO_DIR/deploy/aws}"

cd "$REPO_DIR"

# Optional: EC2_GIT_PAT from GitHub Actions enables non-interactive pull for private repos.
if [[ -n "${GITHUB_PAT:-}" ]]; then
  origin_url="$(git remote get-url origin)"
  case "$origin_url" in
    https://github.com/*)
      repo_path="${origin_url#https://github.com/}"
      repo_path="${repo_path%.git}"
      git remote set-url origin "https://x-access-token:${GITHUB_PAT}@github.com/${repo_path}.git"
      ;;
    https://x-access-token:*@github.com/*)
      repo_path="${origin_url#https://x-access-token:*@github.com/}"
      repo_path="${repo_path%.git}"
      git remote set-url origin "https://x-access-token:${GITHUB_PAT}@github.com/${repo_path}.git"
      ;;
  esac
fi

git fetch origin main
git reset --hard origin/main

cd "$COMPOSE_DIR"
docker-compose up -d --build

echo "Waiting for API health..."
for _ in $(seq 1 36); do
  if curl -sf http://localhost:8080/health/ready >/dev/null; then
    echo "Deploy complete — API is ready."
    exit 0
  fi
  sleep 5
done

echo "Deploy finished but /health/ready did not respond in time. Check: docker-compose logs api" >&2
exit 1
