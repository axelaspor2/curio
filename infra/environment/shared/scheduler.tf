#--------------------------------
# Cloud Scheduler Service Account
#--------------------------------
resource "google_service_account" "scheduler" {
  account_id   = "scheduler"
  display_name = "Cloud Scheduler Service Account"
}

resource "google_project_iam_member" "scheduler_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.scheduler.email}"
}

#--------------------------------
# Cloud Scheduler Jobs
#--------------------------------
locals {
  scheduler_jobs = {
    rss-fetch = {
      description = "RSSフィード取得ジョブを毎時実行"
      schedule    = "0 * * * *"
      job_name    = "curio-rss-fetch"
    }
    article-fetch = {
      description = "記事本文スクレイピングジョブを毎時実行"
      schedule    = "15 * * * *"
      job_name    = "curio-article-fetch"
    }
    article-enrichment = {
      description = "LLM記事エンリッチメントジョブを毎時実行"
      schedule    = "30 * * * *"
      job_name    = "curio-article-enrichment"
    }
    interest-vector = {
      description = "興味ベクトル計算ジョブを6時間ごとに実行"
      schedule    = "0 */6 * * *"
      job_name    = "curio-interest-vector"
    }
  }
}

resource "google_cloud_scheduler_job" "jobs" {
  for_each = local.scheduler_jobs

  name        = "${each.key}-schedule"
  description = each.value.description
  region      = var.region
  schedule    = each.value.schedule
  time_zone   = "Asia/Tokyo"

  retry_config {
    retry_count          = 3
    min_backoff_duration = "5s"
    max_backoff_duration = "300s"
    max_doublings        = 3
  }

  http_target {
    http_method = "POST"
    uri         = "https://${var.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_id}/jobs/${each.value.job_name}:run"

    oauth_token {
      service_account_email = google_service_account.scheduler.email
      scope                 = "https://www.googleapis.com/auth/cloud-platform"
    }
  }

  depends_on = [google_project_service.main["cloudscheduler.googleapis.com"]]
}
