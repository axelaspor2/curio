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
    # 将来追加するシークレットの例:
    # "DATABASE_PASSWORD" = {
    #   accessors = [
    #     google_service_account.api.email,
    #   ]
    # }
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
