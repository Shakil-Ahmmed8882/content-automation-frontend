import type {
  Control,
  FieldValues,
  FormState,
  Path,
  UseFormReturn,
} from "react-hook-form";

/*=========================================================
// form.type — shared vocabulary for every field component.
=========================================================*/

/** An option in a Select or RadioGroup. `text` is what the user reads. */
export type TSelectOption = {
  value: string;
  text: string;
  disabled?: boolean;
};

/** Gap presets. Kept as a closed union so Tailwind can see every class. */
export type TFieldGap = "2" | "4" | "6" | "8";

/** Props every field accepts. */
export type TBaseFieldProps<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  /** Helper text under the control. Also wired to aria-describedby. */
  description?: string;
  /** Class on the field wrapper (<FormItem>), not the control. */
  className?: string;
};

/**
 * Layout knobs for the controls that sit inline with their label
 * (Checkbox, Switch, and each RadioGroup row).
 */
export type TInlineFieldLayout = {
  /** Stack control above label instead of side by side. */
  column?: boolean;
  /** Push label and control to opposite ends. */
  longGap?: boolean;
  /** Render the label before the control. */
  reverse?: boolean;
  gap?: TFieldGap;
};

/**
 * The imperative handle exposed by <GenericForm ref={...} />.
 * Use it to read, reset, or patch the form from outside the tree
 * (a toolbar button, a modal footer, a parent wizard step).
 */
export type GenericFormRef<T extends FieldValues> = {
  getValues: () => T;
  reset: (values?: Partial<T>) => void;
  setValue: (name: keyof T, value: T[keyof T]) => void;
  formState: FormState<T>;
  control: Control<T>;
  form: UseFormReturn<T>;
};
