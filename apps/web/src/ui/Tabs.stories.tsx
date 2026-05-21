import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";

const meta: Meta<typeof Tabs> = {
  title: "UI/Tabs",
  component: Tabs,
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj<typeof Tabs>;

const Sample = () => (
  <Tabs defaultValue="lobby" style={{ maxWidth: 480 }}>
    <TabsList>
      <TabsTrigger value="lobby">پیش از شروع</TabsTrigger>
      <TabsTrigger value="live">زنده</TabsTrigger>
      <TabsTrigger value="ended">پایان‌یافته</TabsTrigger>
    </TabsList>
    <TabsContent value="lobby">
      <p>کلاس در ۱۲ دقیقه آغاز می‌شود. لطفاً میکروفون و دوربین خود را بررسی کنید.</p>
    </TabsContent>
    <TabsContent value="live">
      <p>کلاس در حال برگزاری است. می‌توانید سؤال خود را در پنل Q&A بپرسید.</p>
    </TabsContent>
    <TabsContent value="ended">
      <p>ضبط جلسه ظرف ۲ ساعت آینده در دسترس قرار می‌گیرد.</p>
    </TabsContent>
  </Tabs>
);

export const Default: Story = { render: () => <Sample /> };

export const LTR: Story = {
  parameters: { dir: "ltr" },
  render: () => (
    <Tabs defaultValue="lobby" style={{ maxWidth: 480 }}>
      <TabsList>
        <TabsTrigger value="lobby">Lobby</TabsTrigger>
        <TabsTrigger value="live">Live</TabsTrigger>
        <TabsTrigger value="ended">Ended</TabsTrigger>
      </TabsList>
      <TabsContent value="lobby">
        <p>Class starts in 12 minutes. Please check your mic and camera.</p>
      </TabsContent>
      <TabsContent value="live">
        <p>The session is live. Ask questions in the Q&A panel.</p>
      </TabsContent>
      <TabsContent value="ended">
        <p>The recording will be available within 2 hours.</p>
      </TabsContent>
    </Tabs>
  ),
};

export const Dark: Story = {
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "dark" } },
  render: () => <Sample />,
};
