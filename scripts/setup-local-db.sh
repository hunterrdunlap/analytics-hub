#!/usr/bin/env bash
# Creates DynamoDB tables in DynamoDB Local for local development.
# Prerequisites: DynamoDB Local running on port 8000, AWS CLI installed.
#
# Usage: ./scripts/setup-local-db.sh

set -euo pipefail

ENDPOINT="http://localhost:8000"
ENV="${ENVIRONMENT:-dev}"
PREFIX="analytics-hub-${ENV}"

create_table() {
  local table=$1
  local gsi_key=${2:-projectId}

  echo "Creating ${PREFIX}-${table}..."
  aws dynamodb create-table \
    --endpoint-url "$ENDPOINT" \
    --table-name "${PREFIX}-${table}" \
    --attribute-definitions \
      AttributeName=id,AttributeType=S \
      AttributeName="${gsi_key}",AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --global-secondary-indexes "[{
      \"IndexName\": \"${gsi_key}-index\",
      \"KeySchema\": [{\"AttributeName\":\"${gsi_key}\",\"KeyType\":\"HASH\"}],
      \"Projection\": {\"ProjectionType\":\"ALL\"}
    }]" \
    --billing-mode PAY_PER_REQUEST \
    --no-cli-pager 2>/dev/null && echo "  OK" || echo "  Already exists (skipped)"
}

create_table projects divisionId
create_table requests
create_table in-progress
create_table reports
create_table documents
create_table dashboard-links
create_table control-items

echo ""
echo "Done! Tables created at ${ENDPOINT}"
