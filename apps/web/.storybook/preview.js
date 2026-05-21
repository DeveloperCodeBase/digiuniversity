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
    // Phase-16 R3 — RTL is the production default for digiuniversity.ir
    // but every new primitive needs to be reviewable in LTR too, so we
    // expose a toolbar switch. Stories that need a specific direction
    // can pin it via parameters.dir = "rtl" | "ltr".
    dir: {
      description: "Text direction",
      defaultValue: "rtl",
      toolbar: {
        title: "Direction",
        icon: "transfer",
        items: [
          { value: "rtl", title: "RTL (Persian)" },
          { value: "ltr", title: "LTR (English)" },
        ],
      },
    },
  },
  decorators: [
    (Story, ctx) => {
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", ctx.globals.theme || "light");
        const dir = ctx.parameters?.dir ?? ctx.globals.dir ?? "rtl";
        document.documentElement.setAttribute("dir", dir);
        document.documentElement.setAttribute("lang", dir === "rtl" ? "fa" : "en");
      }
      return Story();
    },
  ],
};

export default preview;
