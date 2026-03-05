variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "analytics-hub"
}

variable "allowed_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = ["*"]
}
