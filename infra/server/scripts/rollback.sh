#!/usr/bin/env bash
#
# rollback.sh <image_tag> — redeploy a previous image tag.
# Without an argument, prints the currently deployed tag and exits.
#
set -euo pipefail

APP_DIR=/opt/livraison
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

current="$(cat "${APP_DIR}/.deployed_tag" 2>/dev/null || echo 'unknown')"

if [[ $# -lt 1 ]]; then
  echo "Currently deployed tag: ${current}"
  echo "Usage: rollback.sh <image_tag>"
  exit 0
fi

TARGET_TAG="$1"
echo "[rollback] Rolling back from ${current} to ${TARGET_TAG}"

# Override IMAGE_TAG for the deploy run.
export IMAGE_TAG="${TARGET_TAG}"

# deploy.sh sources .env (which sets IMAGE_TAG); persist the rollback choice
# so a subsequent plain deploy does not silently re-upgrade.
sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=${TARGET_TAG}/" "${APP_DIR}/.env"

bash "${HERE}/deploy.sh"
echo "[rollback] Rollback to ${TARGET_TAG} complete."
