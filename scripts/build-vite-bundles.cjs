#!/usr/bin/env node
const path = require('node:path');
const { build } = require('vite');
const { getConfig: getMainConfig } = require('@electron-forge/plugin-vite/dist/config/vite.main.config');
const { getConfig: getPreloadConfig } = require('@electron-forge/plugin-vite/dist/config/vite.preload.config');
const { getConfig: getRendererConfig } = require('@electron-forge/plugin-vite/dist/config/vite.renderer.config');

const root = path.resolve(__dirname, '..');
const forgeConfig = {
  renderer: [
    { name: 'overlay_window' },
    { name: 'main_window' },
  ],
};

const commonEnv = {
  command: 'build',
  mode: 'production',
  root,
  forgeConfig,
};

async function run() {
  await build(getMainConfig(
    {
      ...commonEnv,
      forgeConfigSelf: { entry: 'src/main.ts' },
    },
    {
      build: {
        rollupOptions: {
          external: ['bufferutil', 'utf-8-validate'],
        },
      },
    },
  ));

  await build(getPreloadConfig({
    ...commonEnv,
    forgeConfigSelf: { entry: 'src/preload.ts' },
  }));

  await build(getRendererConfig(
    {
      ...commonEnv,
      forgeConfigSelf: { name: 'overlay_window' },
    },
    {
      build: {
        rollupOptions: {
          input: 'index.html',
        },
      },
    },
  ));

  await build(getRendererConfig(
    {
      ...commonEnv,
      forgeConfigSelf: { name: 'main_window' },
    },
    {
      build: {
        rollupOptions: {
          input: 'main.html',
        },
      },
    },
  ));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
