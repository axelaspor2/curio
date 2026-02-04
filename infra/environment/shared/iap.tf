#--------------------------------
# Identity-Aware Proxy (IAP)
#--------------------------------

# IAP サービスエージェントを作成
# これにより service-{PROJECT_NUMBER}@gcp-sa-iap.iam.gserviceaccount.com が作成される
resource "google_project_service_identity" "iap" {
  provider = google-beta
  project  = var.project_id
  service  = "iap.googleapis.com"
}

#--------------------------------
# Cloud Run IAP Settings
#--------------------------------

# IAP サービスアカウントに Cloud Run Invoker 権限を付与
# IAP が Cloud Run サービスを呼び出すために必要
resource "google_cloud_run_service_iam_member" "iap_invoker_admin" {
  project  = var.project_id
  location = var.region
  service  = "curio-admin"
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_project_service_identity.iap.email}"
}

# IAP-secured Web App User ロールを付与
# Admin パネルへのアクセスを許可するユーザー
resource "google_iap_web_iam_member" "admin_access" {
  for_each = toset(var.iap_admin_users)

  project = var.project_id
  role    = "roles/iap.httpsResourceAccessor"
  member  = each.value
}
