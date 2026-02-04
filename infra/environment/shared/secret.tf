#--------------------------------
# Secret Manager
#--------------------------------
locals {
  # シークレットごとにアクセス可能なサービスアカウントを定義
  secrets = {
    "GITHUB_CLOUDBUILD_V2REPO_OAUTH_TOKEN" = {
      accessors = [
        google_service_account.cloudbuild.email,
        "service-${var.project_number}@gcp-sa-cloudbuild.iam.gserviceaccount.com",
      ]
    }
    "GITHUB_APP_INSTALLATION_ID" = {
      accessors = [
        google_service_account.cloudbuild.email,
        "service-${var.project_number}@gcp-sa-cloudbuild.iam.gserviceaccount.com",
      ]
    }

    # Dev
    "CURIO_AUTH_SECRET_DEV" = {
      accessors = []
    }
    "CURIO_DATABASE_URL_DEV" = {
      accessors = []
    }

    # Admin
    "CURIO_ADMIN_SESSION_SECRET" = {
      accessors = []
    }
  }

  # シークレット×アクセサーの組み合わせをフラット化
  secret_iam_bindings = flatten([
    for secret_name, config in local.secrets : [
      for accessor in config.accessors : {
        secret_name = secret_name
        accessor    = accessor
      }
    ]
  ])
}

resource "google_secret_manager_secret" "main" {
  for_each = local.secrets

  secret_id = each.key

  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
}

#--------------------------------
# Secret Manager IAM
#--------------------------------
resource "google_secret_manager_secret_iam_member" "accessors" {
  for_each = {
    for binding in local.secret_iam_bindings :
    "${binding.secret_name}:${binding.accessor}" => binding
  }

  secret_id = google_secret_manager_secret.main[each.value.secret_name].id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${each.value.accessor}"
}
