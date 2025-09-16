'use client';

import React, { memo, useMemo, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/loading/skeleton-loader';
import dynamic from 'next/dynamic';

// Dynamically import Recharts components for better performance
const BarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.BarChart })),
  { ssr: false }
);

const LineChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.LineChart })),
  { ssr: false }
);

const PieChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PieChart })),
  { ssr: false }
);

const RadarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.RadarChart })),
  { ssr: false }
);

// Import other chart components dynamically
const { Bar, Line, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } = {
  Bar: dynamic(() => import('recharts').then(mod => ({ default: mod.Bar })), { ssr: false }),
  Line: dynamic(() => import('recharts').then(mod => ({ default: mod.Line })), { ssr: false }),
  Pie: dynamic(() => import('recharts').then(mod => ({ default: mod.Pie })), { ssr: false }),
  Cell: dynamic(() => import('recharts').then(mod => ({ default: mod.Cell })), { ssr: false }),
  XAxis: dynamic(() => import('recharts').then(mod => ({ default: mod.XAxis })), { ssr: false }),
  YAxis: dynamic(() => import('recharts').then(mod => ({ default: mod.YAxis })), { ssr: false }),
  CartesianGrid: dynamic(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })), { ssr: false }),
  Tooltip: dynamic(() => import('recharts').then(mod => ({ default: mod.Tooltip })), { ssr: false }),
  Legend: dynamic(() => import('recharts').then(mod => ({ default: mod.Legend })), { ssr: false }),
  ResponsiveContainer: dynamic(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })), { ssr: false }),
  Radar: dynamic(() => import('recharts').then(mod => ({ default: mod.Radar })), { ssr: false }),
  PolarGrid: dynamic(() => import('recharts').then(mod => ({ default: mod.PolarGrid })), { ssr: false }),
  PolarAngleAxis: dynamic(() => import('recharts').then(mod => ({ default: mod.PolarAngleAxis })), { ssr: false }),
  PolarRadiusAxis: dynamic(() => import('recharts').then(mod => ({ default: mod.PolarRadiusAxis })), { ssr: false }),
};

interface BaseChartProps {
  title: string;
  data: any[];
  className?: string;
  height?: number;
  loading?: boolean;
}

interface BarChartProps extends BaseChartProps {
  type: 'bar';
  xDataKey: string;
  yDataKey: string;
  color?: string;
}

interface LineChartProps extends BaseChartProps {
  type: 'line';
  xDataKey: string;
  lines: { dataKey: string; stroke: string; name?: string }[];
}

interface PieChartProps extends BaseChartProps {
  type: 'pie';
  dataKey: string;
  nameKey: string;
  colors?: string[];
}

interface RadarChartProps extends BaseChartProps {
  type: 'radar';
  dataKey: string;
  color?: string;
}

type ChartProps = BarChartProps | LineChartProps | PieChartProps | RadarChartProps;

const ChartSkeleton = memo(function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className={`w-full`} style={{ height }} />
    </div>
  );
});

const OptimizedBarChart = memo(function OptimizedBarChart({
  data,
  xDataKey,
  yDataKey,
  color = '#3B82F6',
  height = 300
}: Omit<BarChartProps, 'type' | 'title' | 'className' | 'loading'> & { height: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis dataKey={xDataKey} className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px'
          }} 
        />
        <Bar dataKey={yDataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
});

const OptimizedLineChart = memo(function OptimizedLineChart({
  data,
  xDataKey,
  lines,
  height = 300
}: Omit<LineChartProps, 'type' | 'title' | 'className' | 'loading'> & { height: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis dataKey={xDataKey} className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px'
          }} 
        />
        <Legend />
        {lines.map((line, index) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.stroke}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name={line.name}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
});

const OptimizedPieChart = memo(function OptimizedPieChart({
  data,
  dataKey,
  nameKey,
  colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'],
  height = 300
}: Omit<PieChartProps, 'type' | 'title' | 'className' | 'loading'> & { height: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey={dataKey}
          nameKey={nameKey}
          label
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px'
          }} 
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
});

const OptimizedRadarChart = memo(function OptimizedRadarChart({
  data,
  dataKey,
  color = '#3B82F6',
  height = 300
}: Omit<RadarChartProps, 'type' | 'title' | 'className' | 'loading'> & { height: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data}>
        <PolarGrid className="opacity-30" />
        <PolarAngleAxis dataKey="skill" className="text-xs" />
        <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-xs" />
        <Radar
          name="Score"
          dataKey={dataKey}
          stroke={color}
          fill={color}
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px'
          }} 
        />
      </RadarChart>
    </ResponsiveContainer>
  );
});

const ChartWrapper = memo(function ChartWrapper({
  title,
  data,
  className,
  height = 300,
  loading = false,
  ...props
}: ChartProps) {
  const memoizedData = useMemo(() => data, [data]);
  
  const renderChart = useMemo(() => {
    if (loading) {
      return <ChartSkeleton height={height} />;
    }

    switch (props.type) {
      case 'bar':
        return (
          <OptimizedBarChart
            data={memoizedData}
            xDataKey={props.xDataKey}
            yDataKey={props.yDataKey}
            color={props.color}
            height={height}
          />
        );
      
      case 'line':
        return (
          <OptimizedLineChart
            data={memoizedData}
            xDataKey={props.xDataKey}
            lines={props.lines}
            height={height}
          />
        );
      
      case 'pie':
        return (
          <OptimizedPieChart
            data={memoizedData}
            dataKey={props.dataKey}
            nameKey={props.nameKey}
            colors={props.colors}
            height={height}
          />
        );
      
      case 'radar':
        return (
          <OptimizedRadarChart
            data={memoizedData}
            dataKey={props.dataKey}
            color={props.color}
            height={height}
          />
        );
      
      default:
        return <ChartSkeleton height={height} />;
    }
  }, [memoizedData, props, height, loading]);

  return (
    <Card className={`optimize-rendering ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<ChartSkeleton height={height} />}>
          <div className="gpu-accelerated">
            {renderChart}
          </div>
        </Suspense>
      </CardContent>
    </Card>
  );
});

ChartWrapper.displayName = 'ChartWrapper';

export default ChartWrapper;
export type { ChartProps, BarChartProps, LineChartProps, PieChartProps, RadarChartProps };