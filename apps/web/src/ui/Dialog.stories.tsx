import type { Meta, StoryObj } from "@storybook/react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./Dialog";
import { Button } from "./Button";

const meta: Meta<typeof Dialog> = {
  title: "UI/Dialog",
  component: Dialog,
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof Dialog>;

const Body = () => (
  <DialogContent>
    <DialogHeader>
      <DialogTitle>حذف این تکلیف؟</DialogTitle>
      <DialogDescription>
        این عمل غیرقابل بازگشت است. تکلیف و همه‌ی پاسخ‌های دانشجویان حذف
        خواهد شد.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="ghost">انصراف</Button>
      </DialogClose>
      <DialogClose asChild>
        <Button variant="danger">حذف</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
);

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>باز کردن دیالوگ</Button>
      </DialogTrigger>
      <Body />
    </Dialog>
  ),
};

export const LTR: Story = {
  parameters: { dir: "ltr" },
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Delete assignment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this assignment?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. The assignment and all student
            submissions will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="danger">Delete</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const Dark: Story = {
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>باز کردن دیالوگ (تیره)</Button>
      </DialogTrigger>
      <Body />
    </Dialog>
  ),
};
