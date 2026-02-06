/**
 * 棒グラフコンポーネント
 *
 * カテゴリ別のインタラクション数を表示する水平棒グラフです。
 */

import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

interface BarChartData {
  categoryName: string;
  count: number;
}

interface BarChartProps {
  data: BarChartData[];
  color: string;
}

export function BarChart({ data, color }: BarChartProps) {
  // データがない場合のフォールバック
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">データがありません</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={data.length * 32 + 8}>
      <RechartsBarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="categoryName"
          width={80}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Bar dataKey="count" fill={color} radius={[0, 4, 4, 0]} barSize={20} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
