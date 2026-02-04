# ---------------------------------------------
# General Variables
# ---------------------------------------------
variable "project_id" {
  description = "The project id"
  type        = string
}

variable "project_name" {
  description = "The project name"
  type        = string
}

variable "project_number" {
  description = "The project number"
  type        = string
}

variable "region" {
  description = "The region"
  type        = string
}

variable "zone" {
  description = "The zone"
  type        = string
}

# ---------------------------------------------
# GitHub Variables
# ---------------------------------------------
variable "github_organization" {
  description = "The GitHub organization name"
  type        = string
}

variable "github_repository_name" {
  description = "The GitHub repository name"
  type        = string
}

# ---------------------------------------------
# IAP Variables
# ---------------------------------------------
variable "iap_admin_users" {
  description = "List of users/groups who can access IAP-protected admin panel (e.g., user:admin@example.com, group:admins@example.com)"
  type        = list(string)
  default     = []
}
