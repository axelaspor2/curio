# ----------------
# terraform configuration
# ----------------
terraform {
  required_version = "~> 1.14"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.16.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 7.16.0"
    }
  }
}

# ----------------
# provider configuration
# ----------------
provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone

  terraform_attribution_label_addition_strategy = "PROACTIVE"

}

provider "google-beta" {
  project = var.project_id
  region  = var.region
  zone    = var.zone

  terraform_attribution_label_addition_strategy = "PROACTIVE"

}
