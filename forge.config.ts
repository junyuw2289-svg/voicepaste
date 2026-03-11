import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import dotenv from 'dotenv';

dotenv.config();

const shouldSign = !!process.env.APPLE_ID && process.env.SKIP_APPLE_SIGN !== '1';
const shouldNotarize = shouldSign && process.env.SKIP_APPLE_NOTARIZE !== '1';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    appBundleId: 'com.junyuwang.voicepaste',
    appCategoryType: 'public.app-category.productivity',
    icon: './assets/icon.icns',
    extraResource: ['./assets'],
    extendInfo: {
      NSMicrophoneUsageDescription: 'VoicePaste needs access to your microphone to record voice for transcription.',
      NSAppleEventsUsageDescription: 'VoicePaste needs to send keystrokes to insert transcribed text into other applications.',
    },
    ...(shouldSign ? {
      osxSign: {
        identity: 'Developer ID Application',
        hardenedRuntime: true,
        entitlements: 'entitlements.plist',
        optionsForFile: (filePath: string) => {
          if (filePath.includes('VoicePaste Helper')) {
            return {
              entitlements: 'entitlements.inherit.plist',
              hardenedRuntime: true,
            };
          }

          return {};
        },
      },
    } : {
      osxSign: { identity: '-' },
    }),
    ...(shouldNotarize ? {
      osxNotarize: {
        tool: 'notarytool',
        appleId: process.env.APPLE_ID!,
        appleIdPassword: process.env.APPLE_ID_PASSWORD!,
        teamId: process.env.APPLE_TEAM_ID!,
      },
    } : {}),
  },
  rebuildConfig: {},
  makers: [
    new MakerDMG({
      format: 'ULFO',
      icon: './assets/icon.icns',
      name: 'VoicePaste',
    }, ['darwin']),
    new MakerZIP({}, ['darwin']),
    new MakerSquirrel({}),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'overlay_window',
          config: 'vite.renderer.config.ts',
        },
        {
          name: 'main_window',
          config: 'vite.main-renderer.config.ts',
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
