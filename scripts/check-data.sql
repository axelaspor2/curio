-- =============================================
-- Curio データ確認クエリ
-- =============================================

-- 1. 記事取得状況（RSS Fetch）
SELECT
  '1. 記事取得' AS check_item,
  COUNT(*) AS total_articles,
  COUNT(CASE WHEN published_at IS NOT NULL THEN 1 END) AS with_published_date
FROM articles;

-- 2. ソース別記事数
SELECT
  s.name AS source_name,
  COUNT(a.id) AS article_count
FROM sources s
LEFT JOIN articles a ON s.id = a.source_id
GROUP BY s.id, s.name
ORDER BY article_count DESC;

-- 3. 記事本文取得状況（Article Fetch）
SELECT
  '3. 本文取得' AS check_item,
  COUNT(*) AS total,
  COUNT(CASE WHEN content IS NOT NULL AND content != '' THEN 1 END) AS with_content,
  ROUND(100.0 * COUNT(CASE WHEN content IS NOT NULL AND content != '' THEN 1 END) / NULLIF(COUNT(*), 0), 1) AS content_rate_pct
FROM articles;

-- 4. エンリッチメント状況（Article Enrichment）
SELECT
  '4. エンリッチメント' AS check_item,
  COUNT(*) AS total,
  COUNT(CASE WHEN summary IS NOT NULL THEN 1 END) AS with_summary,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) AS with_embedding
FROM articles;

-- 5. カテゴリ分類状況
SELECT
  '5. カテゴリ分類' AS check_item,
  COUNT(DISTINCT article_id) AS articles_with_category,
  COUNT(*) AS total_category_assignments
FROM article_categories;

-- 6. カテゴリ別記事数
SELECT
  c.name AS category_name,
  COUNT(ac.article_id) AS article_count
FROM categories c
LEFT JOIN article_categories ac ON c.id = ac.category_id
GROUP BY c.id, c.name
ORDER BY article_count DESC;

-- 7. ユーザーインタレストベクター（Interest Vector）
SELECT
  '7. ユーザーベクター' AS check_item,
  COUNT(*) AS users_with_vector,
  COUNT(CASE WHEN interest_embedding IS NOT NULL THEN 1 END) AS with_embedding
FROM user_interest_vectors;

-- 8. サンプル記事（最新5件）
SELECT
  title,
  CASE WHEN content IS NOT NULL THEN '✓' ELSE '✗' END AS has_content,
  CASE WHEN summary IS NOT NULL THEN '✓' ELSE '✗' END AS has_summary,
  CASE WHEN embedding IS NOT NULL THEN '✓' ELSE '✗' END AS has_embedding,
  created_at
FROM articles
ORDER BY created_at DESC
LIMIT 5;
