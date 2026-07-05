import { cn } from './cn';
import { Card } from './Card';
import { sectionTitle } from './tokens';

export interface SectionProps {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function Section({ title, description, className, children }: SectionProps) {
  return (
    <Card className={className}>
      <h2 className={sectionTitle}>{title}</h2>
      {description ? (
        <p className="mt-1 mb-4 text-sm text-muted">{description}</p>
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </Card>
  );
}

export function SectionHeading({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={cn(sectionTitle, className)}>{children}</h2>;
}
