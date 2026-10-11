import { type ComponentProps, useId } from "react";

interface FieldProps extends ComponentProps<"input"> {
  label: string;
  name: string;
  error?: string | undefined;
}

export function Field({ label, error, ...inputProps }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="error">
          {error}
        </p>
      )}
    </div>
  );
}
