/*=========================================================
// @/components/reusable-ui-blocks/form
//
// Schema-driven form module: react-hook-form + zod, one
// <GenericForm> root, self-wiring <XField name="..." />
// children. See ./README.md for the full guide.
=========================================================*/

export { FieldArray } from "./core/FieldArray";
export { GenericForm } from "./core/GenericForm";
export {
  useGenericForm,
  useGenericFormState,
  useGenericFormValue,
} from "./core/useGenericForm";

export { CheckboxField } from "./fields/CheckboxField";
export { DateField } from "./fields/DateField";
export { DateTimeField } from "./fields/DateTimeField";
export { FieldLabel } from "./fields/FieldLabel";
export { RadioGroupField } from "./fields/RadioGroupField";
export { ResetButton } from "./fields/ResetButton";
export { SelectField } from "./fields/SelectField";
export { SubmitButton } from "./fields/SubmitButton";
export { SwitchField } from "./fields/SwitchField";
export { TextareaField } from "./fields/TextareaField";
export { TextField } from "./fields/TextField";
export type { TDateTimePickerProps, TGranularity } from "./primitives";
/*
// Escape hatches — build a custom control that still gets
// the label/error/aria plumbing of a first-class field.
*/
export {
  DateTimePicker,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  TimePicker,
  useFormField,
} from "./primitives";
export type {
  GenericFormRef,
  TBaseFieldProps,
  TFieldGap,
  TInlineFieldLayout,
  TSelectOption,
} from "./types/form.type";
