import { cn } from './cn';
import { fieldLabel } from './tokens';

export interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, hint, className, children }: FieldProps) {
  const LabelTag = htmlFor ? 'label' : 'span';
  return (
    <div className={className}>
      <LabelTag className={fieldLabel} {...(htmlFor ? { htmlFor } : {})}>
        {label}
      </LabelTag>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** Read-only value display matching input height. */
export function ReadonlyField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <Field label={label} className={className}>
      <div className="w-full rounded-xl bg-surface-muted px-3.5 py-2.5 text-sm font-semibold text-muted">
        {value}
      </div>
    </Field>
  );
}
