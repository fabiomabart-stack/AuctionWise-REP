
import React from 'react';
import { formatCurrency } from '../utils/calculations';

interface FinancialCardProps {
  label: string;
  value: number;
  isCurrency?: boolean;
  isPercent?: boolean;
  variant?: 'neutral' | 'positive' | 'negative' | 'primary';
  subValue?: string;
}

export const FinancialCard: React.FC<FinancialCardProps> = ({ 
  label, 
  value, 
  isCurrency = true, 
  isPercent = false, 
  variant = 'neutral',
  subValue
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'positive': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'negative': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'primary': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-slate-700 bg-white border-slate-200';
    }
  };

  return (
    <div className={`p-4 rounded-xl border shadow-sm transition-all hover:shadow-md ${getStyles()}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-xl font-bold">
          {isPercent ? `${value.toFixed(2)}%` : isCurrency ? formatCurrency(value) : value}
        </p>
        {subValue && (
          <span className="text-[10px] font-medium opacity-70">
            ({subValue})
          </span>
        )}
      </div>
    </div>
  );
};
