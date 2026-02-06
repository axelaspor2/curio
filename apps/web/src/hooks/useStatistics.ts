/**
 * 統計取得Hook
 *
 * ユーザーの累計統計情報を取得するためのReact Hookです。
 */

import { useQuery } from "@tanstack/react-query";
import { honoClient } from "@/lib/hono";
import type { StatisticsResponse } from "@/types/statistics";

async function fetchStatistics(): Promise<StatisticsResponse> {
  const response = await honoClient.api.statistics.$get();

  if (!response.ok) {
    throw new Error("Failed to fetch statistics");
  }

  return response.json();
}

/**
 * 統計情報を取得するHook
 *
 * @returns 統計情報とローディング状態
 */
export function useStatistics() {
  return useQuery({
    queryKey: ["statistics"],
    queryFn: fetchStatistics,
    // サマリー画面表示時に最新のデータを取得するため、staleTimeは短めに設定
    staleTime: 30 * 1000, // 30秒
  });
}
