variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "table_names" {
  description = "Map of entity name to DynamoDB table name"
  type        = map(string)
}

variable "table_arns" {
  description = "List of all DynamoDB table ARNs"
  type        = list(string)
}

variable "allowed_origins" {
  description = "CORS allowed origins"
  type        = list(string)
}
