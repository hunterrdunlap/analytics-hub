variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "allowed_origins" {
  description = "CORS allowed origins"
  type        = list(string)
}

variable "lambda_invoke_arns" {
  description = "Map of entity name to Lambda invoke ARN"
  type        = map(string)
}
