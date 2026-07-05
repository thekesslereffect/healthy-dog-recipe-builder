import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';
import { segmentBtn, segmentTrack } from './tokens';

export function SegmentControl({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn(segmentTrack, className)}>{children}</div>;
}

export interface SegmentProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
}

export function Segment({ active, className, type = 'button', ...props }: SegmentProps) {
  return (
    <button type={type} className={cn(segmentBtn(active), className)} {...props} />
  );
}
