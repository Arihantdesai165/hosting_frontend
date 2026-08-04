import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MarksChartProps {
  data: Array<{
    subjectCode: string;
    percentage: number;
    subjectName: string;
  }>;
}

export const MarksChart: React.FC<MarksChartProps> = ({ data }) => {
  const chartData = data.map((item) => ({
    name: item.subjectCode,
    fullName: item.subjectName,
    score: item.percentage,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
        <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(0,0,0,0.04)" />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#a3a3a3', fontSize: 11, fontWeight: 500 }}
        />
        <YAxis
          domain={[0, 100]}
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#a3a3a3', fontSize: 11, fontWeight: 500 }}
        />
        <Tooltip
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
            borderRadius: '16px', 
            border: 'none',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)' 
          }}
          itemStyle={{ color: '#1A1A1A' }}
          labelStyle={{ color: '#737373', fontWeight: 'bold' }}
          formatter={(value, _name, props) => [`${value}%`, props.payload.fullName]}
        />
        <Bar
          dataKey="score"
          fill="url(#marksGrad)"
          radius={[10, 10, 0, 0]}
          barSize={20}
        >
          <defs>
            <linearGradient id="marksGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MarksChart;
