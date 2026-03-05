locals {
  tables = {
    projects        = { hash_key = "id", gsi_key = "divisionId", gsi_name = "divisionId-index" }
    requests        = { hash_key = "id", gsi_key = "projectId", gsi_name = "projectId-index" }
    in-progress     = { hash_key = "id", gsi_key = "projectId", gsi_name = "projectId-index" }
    reports         = { hash_key = "id", gsi_key = "projectId", gsi_name = "projectId-index" }
    documents       = { hash_key = "id", gsi_key = "projectId", gsi_name = "projectId-index" }
    dashboard-links = { hash_key = "id", gsi_key = "projectId", gsi_name = "projectId-index" }
    control-items   = { hash_key = "id", gsi_key = "projectId", gsi_name = "projectId-index" }
  }
}

resource "aws_dynamodb_table" "tables" {
  for_each = local.tables

  name         = "${var.project_name}-${var.environment}-${each.key}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = each.value.hash_key

  attribute {
    name = each.value.hash_key
    type = "S"
  }

  attribute {
    name = each.value.gsi_key
    type = "S"
  }

  global_secondary_index {
    name            = each.value.gsi_name
    hash_key        = each.value.gsi_key
    projection_type = "ALL"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}
