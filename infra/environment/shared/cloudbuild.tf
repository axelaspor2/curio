#--------------------------------
# Cloud Build Service Account
#--------------------------------
resource "google_service_account" "cloudbuild" {
  account_id   = "cloudbuild"
  display_name = "Cloud Build Service Account"
}

resource "google_project_iam_member" "cloudbuild" {
  for_each = toset([
    "roles/cloudbuild.builds.builder",
    "roles/cloudbuild.connectionAdmin",
    "roles/run.admin",
    "roles/artifactregistry.admin",
    "roles/serviceusage.serviceUsageViewer",
    "roles/iam.serviceAccountViewer",
    "roles/iam.serviceAccountUser",
    "roles/resourcemanager.projectIamAdmin",
    "roles/secretmanager.admin",
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.cloudbuild.email}"
}

#--------------------------------
# Cloud Build v2 Connection
#--------------------------------
data "google_secret_manager_secret_version" "github_token" {
  secret = google_secret_manager_secret.main["GITHUB_CLOUDBUILD_V2REPO_OAUTH_TOKEN"].id
}

data "google_secret_manager_secret_version" "github_app_installation_id" {
  secret = google_secret_manager_secret.main["GITHUB_APP_INSTALLATION_ID"].id
}

resource "google_cloudbuildv2_connection" "main" {
  location = var.region
  name     = "${var.project_name}-github"

  github_config {
    app_installation_id = tonumber(data.google_secret_manager_secret_version.github_app_installation_id.secret_data)
    authorizer_credential {
      oauth_token_secret_version = data.google_secret_manager_secret_version.github_token.id
    }
  }

  depends_on = [google_secret_manager_secret_iam_member.accessors]
}

resource "google_cloudbuildv2_repository" "main" {
  location          = var.region
  name              = var.github_repository_name
  parent_connection = google_cloudbuildv2_connection.main.name
  remote_uri        = "https://github.com/${var.github_organization}/${var.github_repository_name}.git"
}

#--------------------------------
# Cloud Build Triggers
#--------------------------------
locals {
  environments = {
    shared = "infra/environment/shared"
    dev    = "infra/environment/dev"
  }
}

# Plan Triggers (PR)
resource "google_cloudbuild_trigger" "terraform_plan" {
  for_each = local.environments

  name     = "terraform-plan-${each.key}"
  location = var.region

  repository_event_config {
    repository = google_cloudbuildv2_repository.main.id
    pull_request {
      branch = "^main$"
    }
  }

  filename        = "infra/cloudbuild/terraform-plan.yaml"
  service_account = google_service_account.cloudbuild.id

  substitutions = {
    "_TF_DIR" = each.value
  }
}

# Apply Triggers (Push to Main)
resource "google_cloudbuild_trigger" "terraform_apply" {
  for_each = local.environments

  name     = "terraform-apply-${each.key}"
  location = var.region

  repository_event_config {
    repository = google_cloudbuildv2_repository.main.id
    push {
      branch = "^main$"
    }
  }

  filename        = "infra/cloudbuild/terraform-apply.yaml"
  service_account = google_service_account.cloudbuild.id

  substitutions = {
    "_TF_DIR" = each.value
  }
}
