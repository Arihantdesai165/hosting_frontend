import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceDot
} from 'recharts';

interface ChartDataPoint {
  day: string;
  theory: number;
  practice: number;
  lexicon: number;
}

const mockData: ChartDataPoint[] = [
  { day: 'Sun', theory: 40, practice: 30, lexicon: 35 },
  { day: 'Mon', theory: 55, practice: 45, lexicon: 48 },
  { day: 'Tue', theory: 70, practice: 65, lexicon: 62 },
  { day: 'Wed', theory: 65, practice: 72, lexicon: 68 },
  { day: 'Thu', theory: 88, practice: 82, lexicon: 80 }, // peak with tooltip
  { day: 'Fri', theory: 75, practice: 68, lexicon: 72 },
  { day: 'Sat', theory: 92, practice: 85, lexicon: 88 }
];

export const TrendChart: React.FC = () => {
  return (
    <div className="relative w-full h-[240px]">
      {/* Exact Match Floating Dark Tooltip Pill */}
      <div 
        className="absolute top-[20px] left-[58%] -translate-x-1/2 z-20 flex flex-col items-center animate-bounce"
        style={{ animationDuration: '3s' }}
      >
        <div className="custom-chart-tooltip px-4 py-2.5 rounded-[18px] shadow-lg flex flex-col items-center min-w-[110px] text-center border border-neutral-800">
          <div className="flex items-center space-x-1">
            <span className="text-[14px] font-bold">↑ +12</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-semibold tracking-wide">More practice</span>
        </div>
        {/* Triangle pointer */}
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#1A1A1A]"></div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={mockData}
          margin={{ top: 25, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorTheory" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPractice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorLexicon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="0" 
            vertical={false} 
            stroke="rgba(0,0,0,0.04)" 
          />
          <XAxis 
            dataKey="day" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#a3a3a3', fontSize: 12, fontWeight: 500 }}
          />
          <YAxis 
            domain={[0, 100]} 
            axisLine={false} 
            tickLine={false} 
            ticks={[0, 40, 80, 100]}
            tickFormatter={(val) => `${val}%`}
            tick={{ fill: '#a3a3a3', fontSize: 12, fontWeight: 500 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)', 
              borderRadius: '16px', 
              border: 'none',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)' 
            }} 
          />
          
          <Area 
            type="monotone" 
            dataKey="theory" 
            stroke="#3b82f6" 
            strokeWidth={3} 
            fillOpacity={1} 
            fill="url(#colorTheory)" 
          />
          <Area 
            type="monotone" 
            dataKey="practice" 
            stroke="#8b5cf6" 
            strokeWidth={3} 
            fillOpacity={1} 
            fill="url(#colorPractice)" 
          />
          <Area 
            type="monotone" 
            dataKey="lexicon" 
            stroke="#ec4899" 
            strokeWidth={3} 
            fillOpacity={1} 
            fill="url(#colorLexicon)" 
          />

          {/* Reference Dot highlighting Thursday target point */}
          <ReferenceDot 
            x="Thu" 
            y={82} 
            r={5} 
            fill="#8b5cf6" 
            stroke="#ffffff" 
            strokeWidth={2.5} 
            isFront={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;
