/**
 * 完了時サマリーコンポーネント
 *
 * すべての記事をスワイプ完了した時に表示する統計サマリー画面です。
 */

import { Loader2 } from "lucide-react";
import { BarChart, DonutChart, type DonutChartData } from "@/components/charts";
import { FluentEmoji } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useStatistics } from "@/hooks";

interface CompletionSummaryProps {
  /** スコア閾値によって枯渇したかどうか */
  exhaustedByThreshold: boolean;
}

export function CompletionSummary({ exhaustedByThreshold }: CompletionSummaryProps) {
  const { data: stats, isLoading, isError } = useStatistics();

  // ローディング状態
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">統計を読み込み中...</p>
      </div>
    );
  }

  // エラー状態
  if (isError || !stats) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 animate-emoji-bounce">
          <FluentEmoji name="party-popper" size={80} />
        </div>
        <h2 className="text-xl font-semibold mb-2">
          {exhaustedByThreshold
            ? "おすすめの記事を全て確認しました！"
            : "すべての記事を確認しました！"}
        </h2>
        <p className="text-muted-foreground">
          {exhaustedByThreshold
            ? "新しいおすすめ記事が見つかったらお知らせします"
            : "また後で新しい記事をチェックしてください"}
        </p>
      </div>
    );
  }

  // ドーナツチャート用データ
  const donutData: DonutChartData[] = [
    { name: "LIKE", value: stats.actionStats.like, color: "#22c55e" }, // green-500
    { name: "SKIP", value: stats.actionStats.skip, color: "#ef4444" }, // red-500
    { name: "READ", value: stats.actionStats.read, color: "#3b82f6" }, // blue-500
  ];

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
      {/* ヘッダー */}
      <div className="text-center py-4">
        <div className="mb-4 animate-emoji-bounce">
          <FluentEmoji name="party-popper" size={64} />
        </div>
        <h2 className="text-xl font-semibold mb-2">
          {exhaustedByThreshold
            ? "おすすめの記事を全て確認しました！"
            : "すべての記事を確認しました！"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {exhaustedByThreshold
            ? "新しいおすすめ記事が見つかったらお知らせします"
            : "また後で新しい記事をチェックしてください"}
        </p>
      </div>

      {/* アクション統計（ドーナツチャート） */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">アクション統計</CardTitle>
        </CardHeader>
        <CardContent>
          <DonutChart data={donutData} total={stats.actionStats.total} />
          <div className="flex justify-center gap-4 mt-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              LIKE: {stats.actionStats.like}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              SKIP: {stats.actionStats.skip}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              READ: {stats.actionStats.read}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* LIKEカテゴリTOP3 */}
      {stats.topLikedCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-green-500">♥</span>
              よくLIKEするカテゴリ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={stats.topLikedCategories} color="#22c55e" />
          </CardContent>
        </Card>
      )}

      {/* SKIPカテゴリTOP3 */}
      {stats.topSkippedCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-red-500">✕</span>
              よくSKIPするカテゴリ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={stats.topSkippedCategories} color="#ef4444" />
          </CardContent>
        </Card>
      )}

      {/* 下部の余白 */}
      <div className="pb-safe" />
    </div>
  );
}
