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

  # Map entity names to their table names (divisions has no table)
  entity_table_map = {
    for entity in local.entities : entity => lookup(var.table_names, entity, "") if entity != "divisions"
  }
}

# IAM role for Lambda execution
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-${var.environment}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM policy for DynamoDB access and CloudWatch logs
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-${var.environment}-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
        ]
        Resource = concat(
          var.table_arns,
          [for arn in var.table_arns : "${arn}/index/*"]
        )
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Archive the entire lambda directory as a single deployment package
# All functions share the same zip since they use relative requires to ../shared/
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../lambda"
  output_path = "${path.module}/../../deployment.zip"
  excludes    = ["package.json", "package-lock.json"]
}

# Lambda functions
resource "aws_lambda_function" "functions" {
  for_each = local.entities

  function_name = "${var.project_name}-${var.environment}-${each.key}"
  role          = aws_iam_role.lambda_role.arn
  handler       = "${each.key}/index.handler"
  runtime       = "nodejs20.x"
  timeout       = 10
  memory_size   = 128

  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = merge(
      each.key != "divisions" ? { TABLE_NAME = var.table_names[each.key] } : {},
      { ALLOWED_ORIGINS = join(",", var.allowed_origins) }
    )
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }

  depends_on = [
    aws_iam_role_policy.lambda_policy,
    aws_cloudwatch_log_group.lambda_logs,
  ]
}

# CloudWatch log groups
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = local.entities

  name              = "/aws/lambda/${var.project_name}-${var.environment}-${each.key}"
  retention_in_days = 14

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Lambda permissions for API Gateway invocation
resource "aws_lambda_permission" "api_gateway" {
  for_each = local.entities

  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.functions[each.key].function_name
  principal     = "apigateway.amazonaws.com"
}
