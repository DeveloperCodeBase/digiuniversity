import "../styles.css";

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "paper",
      values: [
        { name: "paper", value: "#fafaf5" },
        { name: "dark", value: "#0a0d1a" },
      ],
    },
  },
  globalTypes: {
    theme: {
      description: "DigiU theme",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "روشن (paper)" },
          { value: "dark", title: "تیره (navy)" },
        ],
      },
    },
  },
  decorators: [
    (Story, ctx) => {
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", ctx.globals.theme || "light");
        document.documentElement.setAttribute("dir", "rtl");
        document.documentElement.setAttribute("lang", "fa");
      }
      return Story();
    },
  ],
};

export default preview;
