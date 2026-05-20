/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  // Phase-14 R2: pick up .ts/.tsx stories alongside .js/.jsx.
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  staticDirs: ["../public"],
};

export default config;
