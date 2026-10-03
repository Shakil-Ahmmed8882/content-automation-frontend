# Form Module — schema-driven forms with react-hook-form + zod

A self-contained, plug-and-play form system. Drop the `form/` folder into any React app,
edit **one** file (`primitives/host.ts`), and every field works.

> **Live demo:** `/ui-demo` → first section, _"GenericForm — every field, live"_.
> Source: `src/app/[lang]/(protected)/ui-demo/_components/GenericFormDemo.tsx`.

---

## 1. The idea in one paragraph

You write a zod schema. That schema is the **only** place validation lives — it types the form
values, validates them, and produces the error strings. `<GenericForm>` builds the react-hook-form
instance from it and publishes it through context. Every `<XField name="..." />` underneath finds
its own slice by name: no `control` prop, no `onChange` handler, no `error={...}` wiring at the call
site. You get back a fully parsed, correctly typed object in `onSubmit` — dates are real `Date`
objects, numbers are numbers.

```tsx
const Schema = z.object({
	name: z.string().min(2, "At least 2 characters"),
	email: z.email("Enter a valid email"),
});

<GenericForm schema={Schema} initialValues={{ name: "", email: "" }} onSubmit={console.log}>
	<TextField<z.infer<typeof Schema>> name="name" label="Name" required />
	<TextField<z.infer<typeof Schema>> name="email" label="Email" type="email" required />
	<SubmitButton />
</GenericForm>;
```

That is the whole API surface for a simple form. Everything below is detail.

---

## 2. Install

### Dependencies

| Package                   | Version         | Why                                                      |
| ------------------------- | --------------- | -------------------------------------------------------- |
| `react-hook-form`         | `^7.55`         | Form state, validation lifecycle, field subscriptions.   |
| `@hookform/resolvers`     | `^5`            | The zod ↔ RHF bridge (`zodResolver`). v5 supports zod 4. |
| `zod`                     | `^3.25` or `^4` | Schema definition + validation.                          |
| `react`                   | `^19`           | Uses `ref`-as-prop (no `forwardRef`).                    |
| `date-fns`                | `^4`            | Date formatting + locales in the date picker.            |
| `lucide-react`            | any             | Icons.                                                   |
| `radix-ui`                | `^1.4`          | Unified Radix package — `Slot`, `RadioGroup`.            |
| `tailwindcss`             | `^4`            | Styling (v3 works; see §9).                              |
| `clsx` + `tailwind-merge` | any             | Behind the host's `cn()` helper.                         |

```bash
npm install react-hook-form @hookform/resolvers zod date-fns lucide-react radix-ui
```

> **Radix note:** this module imports from the **unified** `radix-ui` package
> (`import { Slot } from "radix-ui"` → `Slot.Root`). If your project uses the older split packages,
> change the two imports in `primitives/form-primitives.tsx` and `primitives/radio-group.tsx` to
> `@radix-ui/react-slot` / `@radix-ui/react-radio-group` and use `Slot` directly instead of
> `Slot.Root`.

### Required shadcn/ui primitives

The module renders through the host's own primitives so it inherits the host's theme. These must
exist:

```bash
npx shadcn@latest add button calendar checkbox input label popover select switch textarea
```

It **ships its own** `radio-group`, `date-time-picker`, `loading-spinner`, and the RHF-bound
`form-primitives` (Form / FormField / FormItem / FormLabel / FormControl / FormDescription /
FormMessage), because the first three are often missing and the last is react-hook-form-specific.

### Porting to another project — one file

`primitives/host.ts` is the **only** file that reaches into the host app. Everything else imports
from `../primitives`. To port:

1. Copy the whole `form/` folder.
2. Open `primitives/host.ts` and repoint each export at that project's primitives and its `cn()`.
3. Done.

If the new host already ships a `radio-group`, delete `primitives/radio-group.tsx` and re-export it
from `host.ts` instead.

---

## 3. Folder map

```text
form/
├── index.ts                      ← public barrel — import from here, nothing deeper
├── README.md                     ← this file
├── core/
│   ├── GenericForm.tsx           ← the form root: schema → RHF instance → context
│   ├── FieldArray.tsx            ← repeating rows
│   └── useGenericForm.ts         ← read the form from any descendant
├── fields/                       ← one file per control, all self-wiring
│   ├── TextField.tsx  TextareaField.tsx  SelectField.tsx
│   ├── CheckboxField.tsx  SwitchField.tsx  RadioGroupField.tsx
│   ├── DateField.tsx  DateTimeField.tsx
│   ├── SubmitButton.tsx  ResetButton.tsx
│   └── FieldLabel.tsx            ← label + required marker (shared)
├── primitives/
│   ├── host.ts                   ← ⭐ THE PORT LAYER — the only host coupling
│   ├── index.ts                  ← what fields import
│   ├── form-primitives.tsx       ← RHF-bound Form/FormField/FormItem/…
│   ├── date-time-picker.tsx      ← calendar + keyboard clock
│   ├── radio-group.tsx           ← vendored shadcn primitive
│   └── loading-spinner.tsx
├── types/form.type.ts            ← TSelectOption, TBaseFieldProps, GenericFormRef…
└── utils/fieldLayout.ts          ← inline label/control positioning
```

**Import rule:** app code imports from `@/components/reusable-ui-blocks/form` only. Fields import
from `../primitives` only. Only `primitives/host.ts` imports from `@/components/ui/*`.

---

## 4. `<GenericForm>` — the root

| Prop            | Type                                                           | Default       | Notes                                                           |
| --------------- | -------------------------------------------------------------- | ------------- | --------------------------------------------------------------- |
| `schema`        | `ZodType<TValues, FieldValues>`                                | —             | **Infers `TValues`.** Never pass the generic by hand.           |
| `initialValues` | `Partial<TValues>`                                             | —             | Read once at mount. Also what `reset()` returns to.             |
| `values`        | `TValues`                                                      | —             | Re-syncs when it changes. **Use this for edit forms** (see §7). |
| `onSubmit`      | `SubmitHandler<TValues>`                                       | —             | Receives parsed, typed values. May be `async`.                  |
| `onInvalid`     | `SubmitErrorHandler<TValues>`                                  | —             | Runs instead of `onSubmit` when validation fails.               |
| `mode`          | `"onSubmit" \| "onBlur" \| "onChange" \| "onTouched" \| "all"` | `"onSubmit"`  | When validation first fires.                                    |
| `resetOnSubmit` | `boolean`                                                      | `false`       | Clears back to `initialValues` after a successful submit.       |
| `className`     | `string`                                                       | `"space-y-4"` | Merged, not replaced.                                           |
| `ref`           | `Ref<GenericFormRef<TValues>>`                                 | —             | Imperative handle (§6).                                         |

Any other `<form>` attribute (`id`, `autoComplete`, `aria-*`) passes straight through.

**`mode` guidance:** `"onSubmit"` (the default) is least noisy — nothing goes red until the user
tries to submit, then each field validates live as they fix it. `"onTouched"` validates a field once
it's been blurred; good for long forms where you want early feedback.

---

## 5. Getting the data out

### The normal way — `onSubmit`

```tsx
const handleSubmit = async (values: TFormValues) => {
	await createStaff(values); // already parsed and typed
};
```

`onSubmit` only runs when the schema passes, so **you never need to re-validate or null-check
inside it**. Values are the schema's _output_ type: `z.date()` gives a `Date`, `z.number()` gives a
number, `z.coerce.number()` gives a number even though the input was a string.

Serialize at the API boundary, not in the form:

```tsx
onSubmit={(values) => mutate({ ...values, dob: values.dob.toISOString() })}
```

### Async submits get the loading state for free

`SubmitButton` reads `isSubmitting` off the form itself. If `onSubmit` returns a promise, the button
disables and swaps its label for the whole duration — no `isPending` prop to thread:

```tsx
<SubmitButton label="Create staff" loadingLabel="Creating..." />
```

Pass `isLoading` explicitly only when something the form can't see is still running (a mutation that
continues after `onSubmit` resolves).

### Reading values live, inside the form

```tsx
function ContractEndSection() {
	const employmentType = useGenericFormValue<TFormValues>("employmentType");
	if (employmentType !== "contract") return null;
	return <DateField<TFormValues> name="contractEndsAt" label="Contract ends at" />;
}
```

Only this subtree re-renders when the watched field changes. Put it in its own component — calling
the hook in the parent would re-render every field on every keystroke.

Also available: `useGenericFormState<T>()` (`isDirty`, `isValid`, `isSubmitting`, `errors`) and
`useGenericForm<T>()` for the full RHF instance.

### Reading values from outside the form — `ref`

```tsx
const formRef = useRef<GenericFormRef<TFormValues>>(null);

formRef.current?.getValues(); // snapshot
formRef.current?.reset(); // back to initialValues
formRef.current?.reset({ name: "Preset" }); // reset to something else
formRef.current?.setValue("email", "a@b.com");
formRef.current?.formState.isDirty;
formRef.current?.form; // full RHF instance, escape hatch
```

Use this for a submit button that lives outside `<GenericForm>` — a modal footer, a wizard toolbar.

---

## 6. Field reference

Every field takes these (`TBaseFieldProps`):

| Prop          | Type      | Notes                                                             |
| ------------- | --------- | ----------------------------------------------------------------- |
| `name`        | `Path<T>` | **Required.** Autocompleted from the schema; typos won't compile. |
| `label`       | `string`  | Omit to render no label.                                          |
| `required`    | `boolean` | Renders `*`. **Visual only** — enforcement lives in the schema.   |
| `disabled`    | `boolean` |                                                                   |
| `description` | `string`  | Helper text, wired to `aria-describedby`.                         |
| `className`   | `string`  | Applied to the field wrapper, not the control.                    |

> **Type the generic once per field:** `<TextField<TFormValues> name="email" />`. Without it, `name`
> falls back to `string` and you lose autocomplete and typo-checking. It's the one bit of ceremony
> the module asks for, and it's what makes renames safe.

| Field             | Schema type                 | Key extra props                                                                                                                                                  |
| ----------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TextField`       | `z.string()` / `z.number()` | `type` (`text`\|`email`\|`password`\|`number`\|`tel`\|`url`\|`search`), `placeholder`, `readOnly`, `autoComplete`, `action`, `icon`, `loading`, `inputClassName` |
| `TextareaField`   | `z.string()`                | `rows`, `autoResize` (default `true`), `resizable`, `action`, `Icon`, `loading`                                                                                  |
| `SelectField`     | `z.string()` / `z.enum()`   | `options: TSelectOption[]`, `placeholder`, `triggerClassName`                                                                                                    |
| `RadioGroupField` | `z.string()` / `z.enum()`   | `options`, `orientation` (`"row"`\|`"column"`), `groupClassName`                                                                                                 |
| `CheckboxField`   | `z.boolean()`               | inline layout props (below)                                                                                                                                      |
| `SwitchField`     | `z.boolean()`               | inline layout props (below)                                                                                                                                      |
| `DateField`       | `z.date()`                  | `minDate`, `maxDate`, `yearRange`, `displayFormat` (date-fns pattern)                                                                                            |
| `DateTimeField`   | `z.date()`                  | `granularity` (`"hour"`\|`"minute"`\|`"second"`), `hourCycle` (`12`\|`24`), `minDate`, `maxDate`                                                                 |
| `SubmitButton`    | —                           | `label`, `loadingLabel`, `isLoading`, `width` (`"full"`\|`"auto"`), + all Button props                                                                           |
| `ResetButton`     | —                           | `label`, `onReset`, `width`, + all Button props                                                                                                                  |

**Options shape** is `{ value: string; text: string; disabled?: boolean }` — note `text`, not
`label`. Values are always strings; for numeric ids, stringify going in and use `z.coerce.number()`
in the schema.

**Inline layout props** (`CheckboxField`, `SwitchField`, `RadioGroupField` rows):
`column` (stack), `longGap` (push apart, for settings rows), `reverse` (label first),
`gap` (`"2"|"4"|"6"|"8"`).

**`TextField type="number"`** coerces to a number on change, so `z.number()` works directly — no
`z.coerce` needed and no `"42"` reaching your API.

**`ResetButton`** calls `form.reset()` from context by default — it needs no `ref` and no handler.
Pass `onReset` only when clearing must do something extra (close a drawer, clear a preview).

### Repeating rows — `FieldArray`

```tsx
<FieldArray<TFormValues> name="teamMembers">
	{({ fields, append, remove }) => (
		<>
			{fields.map((field, index) => (
				<div key={field.id} className="flex gap-3">
					<TextField<TFormValues> name={`teamMembers.${index}.fullName`} label="Name" />
					<SelectField<TFormValues> name={`teamMembers.${index}.role`} options={ROLES} />
					<Button type="button" onClick={() => remove(index)}>
						Remove
					</Button>
				</div>
			))}
			<Button type="button" onClick={() => append({ fullName: "", role: "housekeeper" })}>
				Add
			</Button>
		</>
	)}
</FieldArray>
```

> ⚠️ **Key on `field.id`, never on `index`.** The index shifts when a row is removed and React will
> reuse the wrong input's state — the classic "I deleted row 2 and row 3's text moved up" bug.

Index the child names into the array (`teamMembers.0.fullName`) and zod validates each row through
the same object schema. `append` / `remove` / `move` / `insert` / `swap` all come from
react-hook-form's `useFieldArray`.

---

## 7. Recipes

### Edit form — data arrives after mount

`initialValues` is read **once**. If your data comes from a query, it will still be empty when the
form mounts. Use `values`, which re-syncs:

```tsx
const { data: staff } = useGetStaff(staffId);

<GenericForm schema={StaffSchema} values={staff} onSubmit={handleSave}>
```

### Submit button outside the form

```tsx
const formRef = useRef<GenericFormRef<TFormValues>>(null);

<GenericForm id="staff-form" ref={formRef} schema={...} onSubmit={...}>...</GenericForm>

// in a modal footer, anywhere in the tree:
<Button type="submit" form="staff-form">Save</Button>
```

The `form` attribute + a matching `id` submits across DOM boundaries — no ref needed for this case.

### Cross-field validation

Do it in the schema, not in the components:

```tsx
const Schema = z
	.object({ startsAt: z.date(), endsAt: z.date() })
	.refine((v) => v.endsAt > v.startsAt, {
		message: "End must be after start",
		path: ["endsAt"], // ← attaches the error to the endsAt field
	});
```

Without `path`, the error lands on the form root and no field renders it.

### Server-side errors

```tsx
const handleSubmit = async (values, event) => {
	try {
		await createStaff(values);
	} catch (error) {
		formRef.current?.form.setError("email", { message: "Already taken" });
	}
};
```

### A custom control that still gets label + error plumbing

Build it out of the exported primitives rather than reinventing the wrapper:

```tsx
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/reusable-ui-blocks/form";

<FormField
	control={control}
	name="color"
	render={({ field }) => (
		<FormItem>
			<FormLabel>Brand colour</FormLabel>
			<FormControl>
				<MyColorPicker value={field.value} onChange={field.onChange} />
			</FormControl>
			<FormMessage />
		</FormItem>
	)}
/>;
```

`FormControl` must wrap the **control itself**, not a layout `<div>` — it forwards `id`,
`aria-invalid` and `aria-describedby` onto its single child via Radix `Slot`. Wrapping a div puts
the accessibility attributes on the div and the label stops pointing at the input.

---

## 8. Restyling for one page without forking

Three levels, cheapest first:

**1. `className` per field.** Applied to the wrapper (`FormItem`), merged through `cn()` so it beats
the defaults:

```tsx
<TextField<T> name="name" className="md:col-span-2" inputClassName="h-12 rounded-full" />
```

**2. Layout at the form root.** `<GenericForm className="...">` is merged with `space-y-4`, and
fields inherit typography from it:

```tsx
<GenericForm className="grid grid-cols-2 gap-4 font-proxima-nova" ...>
```

This is also **how you apply a project font** — set it once on the root and every field inherits.
The module deliberately hardcodes no font so it stays portable.

**3. A themed wrapper component.** For a whole section that needs a consistent different look, wrap
rather than fork:

```tsx
export function CompactTextField<T extends FieldValues>(
	props: React.ComponentProps<typeof TextField<T>>,
) {
	return (
		<TextField {...props} className={cn("gap-1", props.className)} inputClassName="h-8 text-xs" />
	);
}
```

**Do not** copy a field file to change styling. If a variant is needed app-wide, add a prop to the
existing field instead — that keeps every call site consistent, which is the whole point of the
module.

---

## 9. Theming & conventions

- **Tokens only.** Every colour is a shadcn CSS variable — `border-input`, `text-destructive`,
  `text-muted-foreground`, `bg-primary`, `ring-ring`. There is not one raw hex in the module, so it
  picks up the host's light/dark theme and any tenant brand override automatically.
- **Tailwind v4** is assumed (`field-sizing-content`, `size-*`). On v3, replace `field-sizing-*` in
  `TextareaField` with a JS auto-grow or drop `autoResize`.
- **No i18n coupling.** Every user-facing string is a prop. Call `t()` at the call site:
  `<TextField label={t("staff.name", "Name")} />`. Error text comes from the schema, so translate
  there: `z.string().min(2, t("errors.min2", "At least 2 characters"))`.
- **`"use client"`** sits on every field and on `GenericForm` — they all use hooks. Route files and
  server components can import and render them without adding the directive themselves.

---

## 10. Gotchas

| Symptom                                      | Cause                                                                                                                                        |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `name` accepts any string, no autocomplete   | Missing generic: write `<TextField<TFormValues> name="..." />`.                                                                              |
| Field renders but never validates            | Not inside `<GenericForm>`. Fields read RHF context; there is no fallback.                                                                   |
| Edit form always shows empty values          | Used `initialValues` with async data — use `values` (§7).                                                                                    |
| Removing a `FieldArray` row scrambles inputs | Keyed on `index` instead of `field.id`.                                                                                                      |
| `refine` error never appears                 | Missing `path: ["fieldName"]` — it landed on the form root.                                                                                  |
| Spacing prop (`gap`) does nothing            | Only `"2" \| "4" \| "6" \| "8"` exist; they're literal classes so Tailwind can see them. A new value needs adding to `utils/fieldLayout.ts`. |
| Label doesn't focus the input                | `FormControl` wrapping a `<div>` instead of the control itself (§7).                                                                         |
| Date arrives at the API as `{}`              | A `Date` was `JSON.stringify`'d — call `.toISOString()` in `onSubmit`.                                                                       |
| `z.number()` fails with "expected number"    | Field isn't `type="number"`; plain text inputs return strings. Either set the type or use `z.coerce.number()`.                               |

---

## 11. Why this over raw react-hook-form

Every field would otherwise repeat the same twelve lines — `Controller`, `render`, `FormItem`,
`FormLabel`, the required asterisk, `FormControl`, the control, `FormDescription`, `FormMessage`,
plus the aria wiring. Multiply by ten fields per form and thirty forms per app and the drift is
guaranteed: one form's errors are red, another's are grey; one has `aria-invalid`, another doesn't.
Centralising it means a fix to `FormMessage` or a change to the required marker lands everywhere at
once, and a new form is a schema plus a list of `name`s.
