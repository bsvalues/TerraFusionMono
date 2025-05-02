import React from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

interface ChartData {
  name: string;
  value: number;
}

interface PreviewChartProps {
  data: ChartData[];
}

// Custom colors for the chart
const COLORS = ['#2563eb', '#ef4444', '#f59e0b', '#10b981'];

// Custom formatter for the tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-md shadow-sm p-2 text-sm">
        <p className="font-semibold">{label}</p>
        <p className="text-muted-foreground">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(payload[0].value)}
        </p>
      </div>
    );
  }

  return null;
};

export const PreviewChart: React.FC<PreviewChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 5,
          left: 5,
          bottom: 30,
        }}
      >
        <XAxis 
          dataKey="name" 
          axisLine={false}
          tickLine={false}
          tickMargin={10}
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
        <Bar 
          dataKey="value" 
          fill="#8884d8" 
          radius={[4, 4, 0, 0]}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PreviewChart;