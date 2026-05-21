// Phase-16 R3 — UI primitive barrel.
//
// Two layers:
//
//   1. Legacy shell (`../ui-shell`) — `ThemeProvider`, `useTheme`,
//      `useToast`, `IconButton`, `UIRoot`. Pre-Phase-16; still in use
//      by App / shared / router. Will be progressively migrated to
//      the new primitives below, then `ui-shell` retired.
//
//   2. Phase-16 primitives — Radix-backed wrappers themed with our
//      OKLCh tokens. Imported via `import { Button, Card } from "../ui"`.
//
// Keep this barrel small: re-export ONLY the public API. Internal
// utilities (utils.ts, focus-trap helpers, etc.) stay private to the
// folder.

// ----- Legacy shell (compat) ---------------------------------------
export * from "../ui-shell";

// ----- Phase-16 primitives -----------------------------------------
export { cn } from "./utils";
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from "./Button";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  type CardProps,
} from "./Card";
export { Input, type InputProps } from "./Input";
export { Label, type LabelProps } from "./Label";
export { Textarea, type TextareaProps } from "./Textarea";
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./Dialog";
export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "./Sheet";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./DropdownMenu";
export {
  Toaster,
  toast,
  ToastProvider,
  type ToastApi,
} from "./Toast";
export { Avatar, AvatarImage, AvatarFallback } from "./Avatar";
export { Badge, type BadgeProps, type BadgeVariant } from "./Badge";
export { Separator } from "./Separator";
export { Skeleton, type SkeletonProps } from "./Skeleton";
export { EmptyState, type EmptyStateProps } from "./EmptyState";
export { ErrorState, type ErrorStateProps } from "./ErrorState";
