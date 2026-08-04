import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AttendanceChartProps {
  data: Array<{
    subjectCode: string;
    percentage: string;
  }>;
}

const AttendanceChart: React.FC<AttendanceChartProps> = ({ data }) => {
  const chartData = data.map((subject) => ({
    name: subject.subjectCode,
    percentage: parseFloat(subject.percentage),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 100]} />
        <Tooltip formatter={(value) => `${value}%`} />
        <Bar dataKey="percentage" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AttendanceChart;