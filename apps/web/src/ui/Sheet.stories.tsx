import type { Meta, StoryObj } from "@storybook/react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "./Sheet";
import { Button } from "./Button";

const meta: Meta<typeof Sheet> = {
  title: "UI/Sheet",
  component: Sheet,
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof Sheet>;

const Body = ({ children }: { children: React.ReactNode }) => (
  <>
    <SheetHeader>
      <SheetTitle>گروه‌های breakout</SheetTitle>
      <SheetDescription>
        به یکی از این ۴ گروه بپیوندید؛ هر گروه ۴-۵ نفر است.
      </SheetDescription>
    </SheetHeader>
    {children}
    <SheetFooter>
      <SheetClose asChild>
        <Button variant="ghost">بستن</Button>
      </SheetClose>
    </SheetFooter>
  </>
);

const Groups = () => (
  <div style={{ display: "grid", gap: 8 }}>
    {["گروه ۱ — نظری", "گروه ۲ — کاربردی", "گروه ۳ — کد", "گروه ۴ — مقاله"].map(
      (g) => (
        <SheetClose key={g} asChild>
          <Button variant="outline">{g}</Button>
        </SheetClose>
      ),
    )}
  </div>
);

export const BottomSheet: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>باز کردن از پایین</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <Body>
          <Groups />
        </Body>
      </SheetContent>
    </Sheet>
  ),
};

export const StartSheet: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>باز کردن از شروع (RTL: راست)</Button>
      </SheetTrigger>
      <SheetContent side="start">
        <Body>
          <Groups />
        </Body>
      </SheetContent>
    </Sheet>
  ),
};

export const EndSheet: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>باز کردن از پایان (RTL: چپ)</Button>
      </SheetTrigger>
      <SheetContent side="end">
        <Body>
          <Groups />
        </Body>
      </SheetContent>
    </Sheet>
  ),
};

export const LTR: Story = {
  parameters: { dir: "ltr" },
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open bottom sheet</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Breakout groups</SheetTitle>
          <SheetDescription>
            Pick a group — 4 to 5 people each.
          </SheetDescription>
        </SheetHeader>
        <Groups />
      </SheetContent>
    </Sheet>
  ),
};

export const Dark: Story = {
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>باز کردن (تیره)</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <Body>
          <Groups />
        </Body>
      </SheetContent>
    </Sheet>
  ),
};
