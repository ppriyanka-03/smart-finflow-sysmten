// 🤖 AI Expense Suggestions Service - Rule-based expense analysis
import { Transaction } from '@/contexts/FinanceContext';

export interface ExpenseInsight {
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  percentage?: number;
  category?: string;
}

interface SpendingPattern {
  category: string;
  amount: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

class AIService {
  // Generate expense insights based on transactions
  generateInsights(transactions: Transaction[], monthlyBudget?: number): ExpenseInsight[] {
    const insights: ExpenseInsight[] = [];
    
    if (transactions.length === 0) {
      return [{
        type: 'info',
        title: 'No transactions yet',
        message: 'Start making payments to get personalized insights',
      }];
    }

    // Calculate total expenses
    const totalExpenses = transactions
      .filter(tx => tx.type === 'payment')
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Budget alert
    if (monthlyBudget) {
      const budgetUsage = (totalExpenses / monthlyBudget) * 100;
      
      if (budgetUsage >= 100) {
        insights.push({
          type: 'warning',
          title: 'Budget Exceeded',
          message: `You've spent ${budgetUsage.toFixed(0)}% of your monthly budget. Consider reducing expenses.`,
          percentage: budgetUsage,
        });
      } else if (budgetUsage >= 80) {
        insights.push({
          type: 'warning',
          title: 'Budget Alert',
          message: `You've spent ${budgetUsage.toFixed(0)}% of your monthly budget. Be careful with remaining expenses.`,
          percentage: budgetUsage,
        });
      }
    }

    // Category-wise spending analysis
    const categorySpending = this.analyzeCategorySpending(transactions);
    
    // Find highest spending category
    const topCategory = categorySpending.reduce((max, cat) => 
      cat.amount > max.amount ? cat : max, categorySpending[0]);

    if (topCategory && topCategory.percentage > 30) {
      insights.push({
        type: 'warning',
        title: 'High Spending Alert',
        message: `You're spending ${topCategory.percentage.toFixed(0)}% of your total expenses on ${topCategory.category}. Consider reducing this.`,
        percentage: topCategory.percentage,
        category: topCategory.category,
      });
    }

    // Cashback insights
    const totalCashback = transactions
      .filter(tx => tx.type === 'cashback')
      .reduce((sum, tx) => sum + tx.amount, 0);

    if (totalCashback > 0) {
      const cashbackRate = (totalCashback / totalExpenses) * 100;
      insights.push({
        type: 'success',
        title: 'Great Cashback!',
        message: `You've earned ₹${totalCashback.toLocaleString()} in cashback (${cashbackRate.toFixed(1)}% of expenses). Keep it up!`,
      });
    }

    // Spending trend analysis
    const recentTransactions = transactions.slice(0, 10);
    const avgRecentSpending = recentTransactions
      .filter(tx => tx.type === 'payment')
      .reduce((sum, tx) => sum + tx.amount, 0) / recentTransactions.length;

    const olderTransactions = transactions.slice(10, 20);
    const avgOlderSpending = olderTransactions.length > 0
      ? olderTransactions
          .filter(tx => tx.type === 'payment')
          .reduce((sum, tx) => sum + tx.amount, 0) / olderTransactions.length
      : 0;

    if (avgRecentSpending > avgOlderSpending * 1.2) {
      insights.push({
        type: 'warning',
        title: 'Spending Increasing',
        message: 'Your recent spending is 20% higher than usual. Review your recent transactions.',
      });
    } else if (avgRecentSpending < avgOlderSpending * 0.8) {
      insights.push({
        type: 'success',
        title: 'Great Savings!',
        message: 'Your recent spending is lower than usual. You\'re on track with your savings goals!',
      });
    }

    // Entertainment check
    const entertainmentSpending = categorySpending.find(cat => 
      cat.category.toLowerCase().includes('entertainment') || 
      cat.category.toLowerCase().includes('movie') ||
      cat.category.toLowerCase().includes('subscription')
    );

    if (entertainmentSpending && entertainmentSpending.percentage > 15) {
      insights.push({
        type: 'info',
        title: 'Entertainment Spending',
        message: `You're spending ${entertainmentSpending.percentage.toFixed(0)}% on entertainment. Consider reviewing subscriptions.`,
        category: 'Entertainment',
      });
    }

    return insights;
  }

  // Analyze category-wise spending
  private analyzeCategorySpending(transactions: Transaction[]): SpendingPattern[] {
    const categoryMap = new Map<string, number>();
    
    transactions
      .filter(tx => tx.type === 'payment')
      .forEach(tx => {
        const category = this.categorizeTransaction(tx.description);
        categoryMap.set(category, (categoryMap.get(category) || 0) + tx.amount);
      });

    const total = Array.from(categoryMap.values()).reduce((sum, amount) => sum + amount, 0);

    return Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / total) * 100,
      trend: 'stable', // Can be enhanced with historical data
    }));
  }

  // Categorize transaction based on description
  private categorizeTransaction(description: string): string {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('food') || lowerDesc.includes('grocery') || lowerDesc.includes('restaurant')) {
      return 'Food';
    }
    if (lowerDesc.includes('movie') || lowerDesc.includes('netflix') || lowerDesc.includes('subscription')) {
      return 'Entertainment';
    }
    if (lowerDesc.includes('shopping') || lowerDesc.includes('amazon') || lowerDesc.includes('flipkart')) {
      return 'Shopping';
    }
    if (lowerDesc.includes('transport') || lowerDesc.includes('uber') || lowerDesc.includes('ola')) {
      return 'Transport';
    }
    if (lowerDesc.includes('bill') || lowerDesc.includes('electricity') || lowerDesc.includes('recharge')) {
      return 'Bills';
    }
    if (lowerDesc.includes('medical') || lowerDesc.includes('pharmacy')) {
      return 'Medical';
    }
    
    return 'Others';
  }

  // Get spending trends for charts
  getSpendingTrends(transactions: Transaction[]): { date: string; amount: number }[] {
    const dateMap = new Map<string, number>();
    
    transactions
      .filter(tx => tx.type === 'payment')
      .forEach(tx => {
        const date = new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dateMap.set(date, (dateMap.get(date) || 0) + tx.amount);
      });

    return Array.from(dateMap.entries()).map(([date, amount]) => ({ date, amount }));
  }

  // Get category breakdown for pie chart
  getCategoryBreakdown(transactions: Transaction[]): { category: string; amount: number; percentage: number }[] {
    const patterns = this.analyzeCategorySpending(transactions);
    return patterns.map(p => ({
      category: p.category,
      amount: p.amount,
      percentage: p.percentage,
    }));
  }
}

export const aiService = new AIService();
