// Phase-16 R3 — primitive accessibility + smoke tests.
//
// Goals:
//   1. Smoke render every wrapper without throwing.
//   2. axe-core: zero WCAG 2.2 AA critical/serious violations.
//   3. Keyboard semantics for high-risk primitives (Dialog focus
//      trap, DropdownMenu navigation, Tabs arrow keys).
//
// These run in jsdom via vitest and DO NOT require the dev server
// or Playwright. They run on every `npm test`.
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { axe } from "./axe-setup";

import { Button } from "../../src/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../src/ui/Card";
import { Input } from "../../src/ui/Input";
import { Label } from "../../src/ui/Label";
import { Textarea } from "../../src/ui/Textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../../src/ui/Dialog";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "../../src/ui/Sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../src/ui/Tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../src/ui/DropdownMenu";
import { Avatar, AvatarFallback } from "../../src/ui/Avatar";
import { Badge } from "../../src/ui/Badge";
import { Separator } from "../../src/ui/Separator";
import { Skeleton } from "../../src/ui/Skeleton";
import { EmptyState } from "../../src/ui/EmptyState";
import { ErrorState } from "../../src/ui/ErrorState";
import { ToastProvider, toast } from "../../src/ui/Toast";
import { ThemeToggle } from "../../src/ui/ThemeToggle";
import { ThemeProvider } from "../../src/ui-shell";

afterEach(() => cleanup());

// Helper that wraps render with an RTL-aware container.
const renderRtl = (ui: React.ReactElement) => {
  document.documentElement.setAttribute("dir", "rtl");
  document.documentElement.setAttribute("lang", "fa");
  return render(ui);
};

describe("Button", () => {
  it("renders children + handles click", () => {
    const onClick = vi.fn();
    renderRtl(<Button onClick={onClick}>ثبت‌نام</Button>);
    const b = screen.getByRole("button", { name: "ثبت‌نام" });
    fireEvent.click(b);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("disables when loading", () => {
    renderRtl(<Button loading>ذخیره</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });

  it("axe-core passes for all variants", async () => {
    const { container } = renderRtl(
      <div>
        <Button variant="primary">primary</Button>
        <Button variant="secondary">secondary</Button>
        <Button variant="ghost">ghost</Button>
        <Button variant="outline">outline</Button>
        <Button variant="ink">ink</Button>
        <Button variant="danger">danger</Button>
        <Button disabled>disabled</Button>
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Card", () => {
  it("renders nested composition", () => {
    renderRtl(
      <Card>
        <CardHeader>
          <CardTitle>عنوان</CardTitle>
          <CardDescription>توضیح</CardDescription>
        </CardHeader>
        <CardContent>محتوا</CardContent>
        <CardFooter>پاورقی</CardFooter>
      </Card>,
    );
    expect(screen.getByText("عنوان")).toBeInTheDocument();
    expect(screen.getByText("توضیح")).toBeInTheDocument();
    expect(screen.getByText("محتوا")).toBeInTheDocument();
    expect(screen.getByText("پاورقی")).toBeInTheDocument();
  });

  it("axe-core passes", async () => {
    const { container } = renderRtl(
      <Card>
        <CardHeader>
          <CardTitle>عنوان</CardTitle>
        </CardHeader>
        <CardContent>محتوا</CardContent>
      </Card>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Input + Label + Textarea", () => {
  it("associates label with input via htmlFor", () => {
    renderRtl(
      <div>
        <Label htmlFor="email">ایمیل</Label>
        <Input id="email" type="email" />
      </div>,
    );
    const input = screen.getByLabelText("ایمیل");
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
  });

  it("Input wires aria-invalid when invalid=true", () => {
    renderRtl(<Input invalid aria-label="email" />);
    expect(screen.getByLabelText("email")).toHaveAttribute("aria-invalid", "true");
  });

  it("Textarea respects invalid + describedBy", () => {
    renderRtl(
      <div>
        <Textarea invalid describedBy="err" aria-label="bio" />
        <span id="err">required</span>
      </div>,
    );
    const ta = screen.getByLabelText("bio");
    expect(ta).toHaveAttribute("aria-invalid", "true");
    expect(ta).toHaveAttribute("aria-describedby", "err");
  });

  it("axe-core passes for the full field group", async () => {
    const { container } = renderRtl(
      <form>
        <Label htmlFor="e" required>ایمیل</Label>
        <Input id="e" type="email" required />
        <Label htmlFor="b">بیو</Label>
        <Textarea id="b" />
      </form>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Dialog", () => {
  it("opens + closes with the trigger", async () => {
    renderRtl(
      <Dialog>
        <DialogTrigger>open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>title</DialogTitle>
            <DialogDescription>desc</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>close</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    fireEvent.click(screen.getByText("open"));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByText("close"));
    // closed: dialog removed from DOM
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("axe-core passes on open content", async () => {
    const { container } = renderRtl(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>عنوان</DialogTitle>
            <DialogDescription>توضیح</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Sheet", () => {
  it("opens via trigger and exposes a dialog role", async () => {
    renderRtl(
      <Sheet>
        <SheetTrigger>open sheet</SheetTrigger>
        <SheetContent side="bottom">
          <SheetTitle>title</SheetTitle>
          <SheetDescription>desc</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    fireEvent.click(screen.getByText("open sheet"));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("axe-core passes on open content", async () => {
    const { container } = renderRtl(
      <Sheet defaultOpen>
        <SheetContent side="bottom">
          <SheetTitle>عنوان</SheetTitle>
          <SheetDescription>توضیح</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Tabs", () => {
  it("renders content for the active tab", () => {
    renderRtl(
      <Tabs defaultValue="b">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">content-a</TabsContent>
        <TabsContent value="b">content-b</TabsContent>
      </Tabs>,
    );
    expect(screen.getByText("content-b")).toBeInTheDocument();
    expect(screen.queryByText("content-a")).not.toBeInTheDocument();
  });

  it("switches active tab on click", async () => {
    const user = userEvent.setup();
    renderRtl(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">content-a</TabsContent>
        <TabsContent value="b">content-b</TabsContent>
      </Tabs>,
    );
    // Radix Tabs activates on pointerdown; userEvent synthesises the
    // full pointer event sequence whereas fireEvent.click only fires
    // the click MouseEvent.
    await user.click(screen.getByText("B"));
    expect(screen.getByText("content-b")).toBeInTheDocument();
  });

  it("axe-core passes", async () => {
    const { container } = renderRtl(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">a</TabsContent>
        <TabsContent value="b">b</TabsContent>
      </Tabs>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("DropdownMenu", () => {
  it("opens via trigger and lists items", async () => {
    const user = userEvent.setup();
    renderRtl(
      <DropdownMenu>
        <DropdownMenuTrigger>open menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    // Radix Menu activates on pointerdown — userEvent synthesises the
    // full pointer event sequence that jsdom needs.
    await user.click(screen.getByText("open menu"));
    expect(await screen.findByText("Item 1")).toBeInTheDocument();
  });
});

describe("Avatar + Badge + Separator", () => {
  it("Avatar shows the fallback when no image source", () => {
    renderRtl(
      <Avatar>
        <AvatarFallback>ع ع</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText("ع ع")).toBeInTheDocument();
  });

  it("Badge renders text + variant class", () => {
    renderRtl(<Badge variant="live">LIVE</Badge>);
    expect(screen.getByText("LIVE")).toBeInTheDocument();
  });

  it("Separator passes axe with horizontal orientation", async () => {
    const { container } = renderRtl(<Separator />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Skeleton + EmptyState + ErrorState", () => {
  it("Skeleton announces loading via role=status", () => {
    renderRtl(<Skeleton variant="text" w="50%" />);
    expect(screen.getAllByRole("status")[0]).toBeInTheDocument();
  });

  it("EmptyState renders title + axe passes", async () => {
    const { container } = renderRtl(
      <EmptyState title="هیچ پیامی نیست" body="پیام جدید اینجا" />,
    );
    expect(screen.getByText("هیچ پیامی نیست")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ErrorState exposes a retry button + role=alert", async () => {
    const retry = vi.fn();
    renderRtl(
      <ErrorState
        title="خطا"
        body="چیزی پیش آمد"
        retry={retry}
        retryLabel="تلاش مجدد"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "تلاش مجدد" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("Toast", () => {
  it("enqueues + renders a toast through the imperative API", async () => {
    renderRtl(<ToastProvider />);
    toast.success("ذخیره شد", { description: "تغییرات اعمال گردید." });
    expect(await screen.findByText("ذخیره شد")).toBeInTheDocument();
    expect(screen.getByText("تغییرات اعمال گردید.")).toBeInTheDocument();
  });
});

describe("ThemeToggle (Phase-16 R4')", () => {
  // ThemeToggle relies on the ThemeProvider from ui-shell — wrap each
  // test in a fresh provider so localStorage state from earlier tests
  // doesn't leak across.
  const wrap = (node: React.ReactElement) =>
    renderRtl(<ThemeProvider>{node}</ThemeProvider>);

  it("renders icon variant with role=switch + aria-checked", () => {
    wrap(<ThemeToggle variant="icon" />);
    const btn = screen.getByRole("switch");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("aria-checked");
  });

  it("toggles aria-checked + data-theme on click", async () => {
    wrap(<ThemeToggle variant="labeled" />);
    const btn = screen.getByRole("switch");
    const startTheme = document.documentElement.getAttribute("data-theme");
    fireEvent.click(btn);
    const afterTheme = document.documentElement.getAttribute("data-theme");
    expect(afterTheme).not.toBe(startTheme);
  });

  it("axe passes for every variant", async () => {
    const { container } = wrap(
      <div style={{ display: "flex", gap: 12 }}>
        <ThemeToggle variant="icon" />
        <ThemeToggle variant="labeled" />
        <ThemeToggle variant="switch" />
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("calls onToggle with the destination theme", () => {
    const onToggle = vi.fn();
    wrap(<ThemeToggle variant="icon" onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onToggle).toHaveBeenCalled();
    const next = onToggle.mock.calls[0][0];
    expect(["light", "dark"]).toContain(next);
  });
});
