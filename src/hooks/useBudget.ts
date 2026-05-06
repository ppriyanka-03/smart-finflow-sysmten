// 💰 Budget Hook - Budget management and alerts
import { useState, useCallback } from 'react';
import { aiService } from '@/services/aiService';
import { Transaction } from '@/contexts/FinanceContext';

interface BudgetAlert {
  type: 'warning' | 'critical';
  message: string;
  percentage: number;
}

interface UseBudgetReturn {
  monthlyBudget: number;
  setMonthlyBudget: (budget: number) => void;
  budgetUsage: number;
  budgetAlerts: BudgetAlert[];
  isBudgetExceeded: boolean;
  isBudgetWarning: boolean;
  checkBudgetAlerts: (transactions: Transaction[]) => void;
}

export const useBudget = (): UseBudgetReturn => {
  const [monthlyBudget, setMonthlyBudgetState] = useState<number>(() => {
    const saved = localStorage.getItem('sf_monthly_budget');
    return saved ? parseInt(saved, 10) : 100000; // Default 1 lakh
  });

  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);

  const setMonthlyBudget = useCallback((budget: number) => {
    setMonthlyBudgetState(budget);
    localStorage.setItem('sf_monthly_budget', budget.toString());
  }, []);

  const checkBudgetAlerts = useCallback((transactions: Transaction[]) => {
    const insights = aiService.generateInsights(transactions, monthlyBudget);
    const alerts: BudgetAlert[] = [];

    insights.forEach(insight => {
      if (insight.type === 'warning' && (insight.title.includes('Budget') || insight.title.includes('Alert'))) {
        alerts.push({
          type: insight.percentage && insight.percentage >= 100 ? 'critical' : 'warning',
          message: insight.message,
          percentage: insight.percentage || 0,
        });
      }
    });

    setBudgetAlerts(alerts);
  }, [monthlyBudget]);

  // Calculate current budget usage
  const budgetUsage = useCallback((transactions: Transaction[]) => {
    const totalExpenses = transactions
      .filter(tx => tx.type === 'payment')
      .reduce((sum, tx) => sum + tx.amount, 0);
    return monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;
  }, [monthlyBudget]);

  return {
    monthlyBudget,
    setMonthlyBudget,
    budgetUsage: 0, // Will be calculated with actual transactions
    budgetAlerts,
    isBudgetExceeded: budgetAlerts.some(alert => alert.type === 'critical'),
    isBudgetWarning: budgetAlerts.some(alert => alert.type === 'warning'),
    checkBudgetAlerts,
  };
};
