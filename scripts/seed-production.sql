-- =============================================
-- Curio Production Seed Data
-- =============================================

-- Categories
INSERT INTO categories (id, slug, name, description, display_order, created_at)
VALUES
  (gen_random_uuid(), 'tech', 'テクノロジー', '一般的なテック情報・ガジェット', 1, NOW()),
  (gen_random_uuid(), 'ai-ml', 'AI・機械学習', '人工知能、機械学習、ディープラーニング', 2, NOW()),
  (gen_random_uuid(), 'web-dev', 'Web開発', 'フロントエンド、バックエンド、フレームワーク', 3, NOW()),
  (gen_random_uuid(), 'mobile', 'モバイル', 'iOS、Android、クロスプラットフォーム開発', 4, NOW()),
  (gen_random_uuid(), 'devops', 'DevOps', 'CI/CD、インフラ、クラウド、コンテナ', 5, NOW()),
  (gen_random_uuid(), 'security', 'セキュリティ', 'サイバーセキュリティ、脆弱性、プライバシー', 6, NOW()),
  (gen_random_uuid(), 'business', 'ビジネス', 'テック業界のビジネスニュース', 7, NOW()),
  (gen_random_uuid(), 'startup', 'スタートアップ', '起業、資金調達、スタートアップ文化', 8, NOW()),
  (gen_random_uuid(), 'design', 'デザイン', 'UI/UX、プロダクトデザイン', 9, NOW()),
  (gen_random_uuid(), 'career', 'キャリア', 'エンジニアのキャリア、転職、働き方', 10, NOW()),
  (gen_random_uuid(), 'lifestyle', 'ライフスタイル', 'エンジニアの生活、趣味、健康', 11, NOW()),
  (gen_random_uuid(), 'news', 'ニュース', '一般ニュース、時事', 12, NOW())
ON CONFLICT (slug) DO NOTHING;

-- Sources
INSERT INTO sources (id, type, name, url, created_at)
VALUES
  (gen_random_uuid(), 'atom', 'Zenn', 'https://zenn.dev/feed', NOW()),
  (gen_random_uuid(), 'rss', 'Qiita', 'https://qiita.com/popular-items/feed', NOW()),
  (gen_random_uuid(), 'rss', 'はてなブックマーク IT', 'https://b.hatena.ne.jp/hotentry/it.rss', NOW()),
  (gen_random_uuid(), 'atom', 'Publickey', 'https://www.publickey1.jp/atom.xml', NOW()),
  (gen_random_uuid(), 'rss', 'GIGAZINE', 'https://gigazine.net/news/rss_2.0/', NOW()),
  (gen_random_uuid(), 'rss', 'Hacker News', 'https://hnrss.org/frontpage', NOW()),
  (gen_random_uuid(), 'rss', 'TechCrunch', 'https://techcrunch.com/feed/', NOW())
ON CONFLICT DO NOTHING;

-- 確認
SELECT 'Categories:' AS info, COUNT(*) AS count FROM categories
UNION ALL
SELECT 'Sources:', COUNT(*) FROM sources;
