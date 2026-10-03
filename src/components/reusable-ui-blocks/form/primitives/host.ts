/*=========================================================
// host.ts — THE PORT LAYER.
//
// This is the ONLY file in the form module that reaches into
// the host application. Everything else in `form/` imports
// from `../primitives`, which re-exports this file.
//
// To move this module into another project, edit this file
// and nothing else: point each export at that project's own
// shadcn primitives / `cn` helper. If a primitive is missing
// there, run `npx shadcn@latest add <name>`.
=========================================================*/

export { Button, buttonVariants } from "@/components/ui/button";
export { Calendar } from "@/components/ui/calendar";
export { Checkbox } from "@/components/ui/checkbox";
export { Input } from "@/components/ui/input";
export { Label } from "@/components/ui/label";
export {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export { Switch } from "@/components/ui/switch";
export { Textarea } from "@/components/ui/textarea";
export { cn } from "@/lib/utils";
