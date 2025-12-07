variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix for resources"
  type        = string
  default     = "mychatgpt"
}

variable "domain_name" {
  description = "Custom domain name (e.g., chat.collegehive.in)"
  type        = string
  default     = "ai.collegehive.in"
}

variable "hosted_zone_name" {
  description = "Route 53 hosted zone name (e.g., collegehive.in)"
  type        = string
  default     = "collegehive.in"
}
