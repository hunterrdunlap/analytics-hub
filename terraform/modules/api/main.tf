locals {
  entities = toset([
    "divisions",
    "projects",
    "requests",
    "in-progress",
    "reports",
    "documents",
    "dashboard-links",
    "control-items",
  ])

  # CRUD entities get all 5 routes; divisions only gets GET collection
  crud_entities = toset([for e in local.entities : e if e != "divisions"])

  # Build a flat map of all routes for dynamic creation
  # Divisions: GET /api/divisions only
  # All others: GET collection, GET by id, POST, PUT by id, DELETE by id
  routes = merge(
    { "GET /api/divisions" = "divisions" },
    merge([
      for entity in local.crud_entities : {
        "GET /api/${entity}"          = entity
        "GET /api/${entity}/{id}"     = entity
        "POST /api/${entity}"         = entity
        "PUT /api/${entity}/{id}"     = entity
        "DELETE /api/${entity}/{id}"  = entity
      }
    ]...)
  )
}

# API Gateway HTTP API
resource "aws_apigatewayv2_api" "api" {
  name          = "${var.project_name}-${var.environment}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.allowed_origins
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Default stage with auto deploy
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Lambda integrations - one per entity
resource "aws_apigatewayv2_integration" "integrations" {
  for_each = local.entities

  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.lambda_invoke_arns[each.key]
  payload_format_version = "2.0"
}

# Routes - dynamically created from the routes map
resource "aws_apigatewayv2_route" "routes" {
  for_each = local.routes

  api_id    = aws_apigatewayv2_api.api.id
  route_key = each.key
  target    = "integrations/${aws_apigatewayv2_integration.integrations[each.value].id}"
}
