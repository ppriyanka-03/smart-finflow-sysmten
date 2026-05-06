// 💡 Insights Card Component - Display AI expense suggestions
import { ExpenseInsight } from '@/services/aiService';
import { AlertCircle, CheckCircle, Info, TrendingUp, TrendingDown } from 'lucide-react';

interface InsightsCardProps {
  insights: ExpenseInsight[];
}

export const InsightsCard = ({ insights }: InsightsCardProps) => {
  const getIcon = (type: ExpenseInsight['type']) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getBackgroundColor = (type: ExpenseInsight['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-destructive/10 border-destructive/20';
      case 'success':
        return 'bg-green-500/10 border-green-500/20';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/20';
      default:
        return 'bg-muted';
    }
  };

  if (insights.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No insights available yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border ${getBackgroundColor(insight.type)}`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{getIcon(insight.type)}</div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{insight.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
              {insight.percentage && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  {insight.type === 'warning' ? (
                    <TrendingUp className="h-3 w-3 text-destructive" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-green-500" />
                  )}
                  <span className="font-medium">{insight.percentage.toFixed(0)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
