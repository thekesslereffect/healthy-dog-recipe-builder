import { Button } from './Button';
import { SegmentControl } from './SegmentControl';
import { stepperReadout, stepperReadoutLabel, stepperReadoutValue } from './tokens';

export interface StepperProps {
  value: number;
  label: string;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  decrementLabel?: string;
  incrementLabel?: string;
  className?: string;
}

export function Stepper({
  value,
  label,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  onChange,
  decrementLabel = 'Decrease',
  incrementLabel = 'Increase',
  className,
}: StepperProps) {
  return (
    <SegmentControl className={className}>
      <Button
        variant="icon"
        className="h-8 w-8 rounded-[10px] active:scale-95"
        aria-label={decrementLabel}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </Button>
      <span className={stepperReadout}>
        <span className={stepperReadoutValue}>{value}</span>
        <span className={stepperReadoutLabel}>{label}</span>
      </span>
      <Button
        variant="icon"
        className="h-8 w-8 rounded-[10px] active:scale-95"
        aria-label={incrementLabel}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </Button>
    </SegmentControl>
  );
}

