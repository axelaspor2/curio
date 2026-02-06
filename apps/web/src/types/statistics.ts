/**
 * 統計関連の型定義
 */

/**
 * アクション統計
 */
export interface ActionStats {
  like: number;
  skip: number;
  read: number;
  total: number;
}

/**
 * カテゴリ別統計
 */
export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  count: number;
}

/**
 * 統計レスポンス
 */
export interface StatisticsResponse {
  actionStats: ActionStats;
  topLikedCategories: CategoryStat[];
  topSkippedCategories: CategoryStat[];
}
