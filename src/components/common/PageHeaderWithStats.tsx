import { ReactNode } from 'react';
import CompactKPICard from './CompactKPICard';

export interface StatCard {
  icon: ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color: 'yellow' | 'green' | 'blue' | 'red' | 'orange';
  onClick?: () => void;
}

interface PageHeaderWithStatsProps {
  title: string;
  subtitle?: string;
  stats: StatCard[];
}

export default function PageHeaderWithStats({ title, subtitle, stats }: PageHeaderWithStatsProps) {
  return (
    <div className="space-y-4 mb-4 sm:mb-6">
      {/* Title Section */}
      <div className="flex-shrink-0">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{title}</h2>
        {subtitle && (
          <p className="text-sm text-gray-300 mt-1 hidden sm:block">{subtitle}</p>
        )}
      </div>

      {/* Stats Grid - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {stats.map((stat, index) => (
          <CompactKPICard
            key={index}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            subtitle={stat.subtitle}
            color={stat.color}
            delay={index * 100}
            onClick={stat.onClick}
          />
        ))}
      </div>
    </div>
  );
}
