import { cn, FormLabel } from "../primitives";

/*=========================================================
// FieldLabel — label text plus the required marker.
// One place so the asterisk never drifts between fields.
=========================================================*/

type TFieldLabelProps = {
  label?: string;
  required?: boolean;
  className?: string;
  /** Overrides the asterisk's own classes — for a page that keys "required" to its own brand color instead of `text-destructive`. */
  requiredClassName?: string;
};

export function FieldLabel(props: TFieldLabelProps) {
  const { label, required = false, className, requiredClassName } = props;

  if (!label) return null;

  return (
    <FormLabel className={cn("items-start gap-0.5 leading-5", className)}>
      <span>{label}</span>
      {required ? (
        <span
          aria-hidden
          className={cn("ml-0.5 text-destructive-text", requiredClassName)}
        >
          *
        </span>
      ) : null}
    </FormLabel>
  );
}
