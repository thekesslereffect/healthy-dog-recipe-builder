import { cn } from './cn';
import { emptyIconWrap } from './tokens';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon, title, description, className, children }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 text-center',
        className,
      )}
    >
      <div className={emptyIconWrap}>{icon}</div>
      <h2 className="mt-5 text-xl font-bold tracking-tight text-foreground">{title}</h2>
      {description && (
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{description}</p>
      )}
      {children}
    </div>
  );
}
