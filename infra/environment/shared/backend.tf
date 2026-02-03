# ----------------
# backend configuration
# ----------------
terraform {
  backend "gcs" {
    bucket = "curio-terraform-state"
    prefix = "curio/shared/terraform.tfstate"
  }
}
