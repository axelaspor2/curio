#--------------------------------
# Artifact Registry
#--------------------------------
locals {
  # レジストリに書き込みできるサービスアカウント
  registry_writers = [
    google_service_account.cloudbuild.email,
  ]
}

resource "google_artifact_registry_repository" "curio" {
  project       = var.project_id
  location      = var.region
  repository_id = "curio"
  description   = "Docker images for Curio project"
  format        = "DOCKER"
}

#--------------------------------
# Artifact Registry IAM
#--------------------------------
resource "google_artifact_registry_repository_iam_member" "writers" {
  for_each = toset(local.registry_writers)

  project    = google_artifact_registry_repository.curio.project
  location   = google_artifact_registry_repository.curio.location
  repository = google_artifact_registry_repository.curio.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${each.key}"
}
