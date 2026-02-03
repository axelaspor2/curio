output "google_secret_manager_secret_ids" {
  description = "The secret ids"
  value       = { for k, v in google_secret_manager_secret.main : k => v.secret_id }
}
