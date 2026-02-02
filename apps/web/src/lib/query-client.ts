import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // フィード記事は頻繁に更新されないため、5分間は再取得を抑制
      staleTime: 1000 * 60 * 5,
      // メモリ使用量を抑えつつ、戻る操作での再利用を可能にする
      gcTime: 1000 * 60 * 30,
      // ネットワークエラー時は1回だけリトライ（過度なリトライはUXを損なう）
      retry: 1,
      // タブ切り替えでの自動再取得は不要（ユーザーが明示的に更新する）
      refetchOnWindowFocus: false,
    },
  },
});
