"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { type FieldValues, type Path, useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  TextField,
} from "@/components/reusable-ui-blocks/form";
import { Input } from "@/components/ui/input";

export function PasswordField({
  name = "password",
  label = "Password",
  newPassword = false,
  description,
}: {
  name?: string;
  label?: string;
  newPassword?: boolean;
  description?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      name={name}
      label={label}
      type={visible ? "text" : "password"}
      autoComplete={newPassword ? "new-password" : "current-password"}
      required
      description={description}
      action={() => setVisible((value) => !value)}
      actionLabel={visible ? "Hide password" : "Show password"}
      actionPressed={visible}
      icon={visible ? <EyeOff /> : <Eye />}
    />
  );
}

export function OtpField({ description }: { description?: string }) {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name="otp"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Verification code</FormLabel>
          <FormControl>
            <Input
              {...field}
              value={field.value ?? ""}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="h-12 text-center font-mono text-xl tracking-[0.4em]"
              placeholder="000000"
              autoFocus
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage role="alert" />
        </FormItem>
      )}
    />
  );
}

export function applyServerFieldErrors<T extends FieldValues>(
  form: ReturnType<typeof useFormContext<T>> | undefined,
  errors: Record<string, string>,
  fields: readonly Path<T>[],
) {
  if (!form) return;
  for (const field of fields) {
    if (errors[field]) {
      form.setError(field, { type: "server", message: errors[field] });
    }
  }
}
