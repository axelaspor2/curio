# ----------------
# backend configuration
# ----------------
terraform {
  backend "gcs" {
    bucket = "curio-terraform-state"
    prefix = "curio/dev/terraform.tfstate"
  }
}
