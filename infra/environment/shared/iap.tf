#--------------------------------
# Identity-Aware Proxy (IAP)
#--------------------------------

# IAP サービスエージェントを作成
# これにより service-{PROJECT_NUMBER}@gcp-sa-iap.iam.gserviceaccount.com が作成される
# NOTE: iap.googleapis.com API は既に有効化されている前提
resource "google_project_service_identity" "iap" {
  provider = google-beta
  project  = var.project_id
  service  = "iap.googleapis.com"
}

#--------------------------------
# Cloud Run IAP Settings
#--------------------------------

# NOTE: Cloud Run サービスへの IAM 設定は、サービスのデプロイ後に
# Cloud Build (cloudbuild/admin.cloudbuild.yaml) で自動設定されます。

# IAP-secured Web App User ロールを付与
# Admin パネルへのアクセスを許可するユーザー
resource "google_iap_web_iam_member" "admin_access" {
  for_each = toset(var.iap_admin_users)

  project = var.project_id
  role    = "roles/iap.httpsResourceAccessor"
  member  = each.value
}
