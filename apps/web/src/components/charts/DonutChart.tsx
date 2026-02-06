/**
 * ドーナツチャートコンポーネント
 *
 * LIKE/SKIP/READの割合を視覚化するドーナツチャートです。
 */

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export interface DonutChartData {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  total: number;
}

export function DonutChart({ data, total }: DonutChartProps) {
  // データがない場合のフォールバック
  if (total === 0) {
    return (
      <div className="relative w-full h-[180px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">データがありません</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {/* 中央の合計表示 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">合計</p>
        </div>
      </div>
    </div>
  );
}
