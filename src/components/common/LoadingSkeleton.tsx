// 🎨 Loading Skeleton Component - UX Improvement for loading states
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
}

export const Skeleton = ({ className, variant = 'text', width, height }: SkeletonProps) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-muted',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-md',
        variant === 'text' && 'rounded',
        className
      )}
      style={{ width, height }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Card Skeleton for transaction lists
export const TransactionSkeleton = () => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width="40px" height="40px" />
        <div className="space-y-2">
          <Skeleton variant="text" width="120px" height="16px" />
          <Skeleton variant="text" width="80px" height="12px" />
        </div>
      </div>
      <div className="space-y-2 text-right">
        <Skeleton variant="text" width="80px" height="16px" />
        <Skeleton variant="text" width="60px" height="12px" />
      </div>
    </div>
  );
};

// Balance Skeleton for dashboard
export const BalanceSkeleton = () => {
  return (
    <div className="space-y-2">
      <Skeleton variant="text" width="100px" height="14px" />
      <Skeleton variant="text" width="200px" height="32px" />
    </div>
  );
};
