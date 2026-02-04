locals {
  apis = [
    "aiplatform.googleapis.com",           # Vertex AI
    "artifactregistry.googleapis.com",     # Artifact Registry
    "cloudbuild.googleapis.com",           # Cloud Build
    "cloudresourcemanager.googleapis.com", # Cloud Resource Manager
    "cloudscheduler.googleapis.com",       # Cloud Scheduler
    "compute.googleapis.com",              # Compute Engine
    "iam.googleapis.com",                  # IAM
    "iap.googleapis.com",                  # Identity-Aware Proxy
    "logging.googleapis.com",              # Cloud Logging
    "monitoring.googleapis.com",           # Cloud Monitoring
    "run.googleapis.com",                  # Cloud Run
    "secretmanager.googleapis.com",        # Secret Manager
    "servicenetworking.googleapis.com",    # Service Networking
    "sqladmin.googleapis.com",             # Cloud SQL Admin
  ]
}

resource "google_project_service" "main" {
  for_each = toset(local.apis)
  service  = each.key

  disable_dependent_services = false
  disable_on_destroy         = false
}
