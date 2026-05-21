import type { Meta, StoryObj } from "@storybook/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./DropdownMenu";
import { Button } from "./Button";

const meta: Meta<typeof DropdownMenu> = {
  title: "UI/Dropdown Menu",
  component: DropdownMenu,
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof DropdownMenu>;

const Sample = ({ ltr = false }: { ltr?: boolean }) => (
  <DropdownMenu dir={ltr ? "ltr" : "rtl"}>
    <DropdownMenuTrigger asChild>
      <Button variant="outline">{ltr ? "Course actions" : "اقدامات درس"}</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuLabel>{ltr ? "Manage" : "مدیریت"}</DropdownMenuLabel>
      <DropdownMenuItem>{ltr ? "Edit details" : "ویرایش جزئیات"}</DropdownMenuItem>
      <DropdownMenuItem>{ltr ? "Duplicate" : "تکثیر"}</DropdownMenuItem>
      <DropdownMenuItem>{ltr ? "Export" : "خروجی"}</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem destructive>
        {ltr ? "Delete course" : "حذف درس"}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export const Default: Story = { render: () => <Sample /> };
export const LTR: Story = { parameters: { dir: "ltr" }, render: () => <Sample ltr /> };
export const Dark: Story = {
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "dark" } },
  render: () => <Sample />,
};
