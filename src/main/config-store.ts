import Store from 'electron-store';
import { APP_DEFAULTS } from '../shared/app-defaults';
import type { PolishProvider } from '../shared/types';

interface StoreSchema {
  hotkey: string;
  language: string;
  enablePolish: boolean;
  polishProvider: PolishProvider;
  audioInputDeviceId: string;
  openaiApiKey: string;
}

const store = new Store<StoreSchema>({
  defaults: {
    hotkey: APP_DEFAULTS.hotkey,
    language: APP_DEFAULTS.language,
    enablePolish: APP_DEFAULTS.enablePolish,
    polishProvider: APP_DEFAULTS.polishProvider,
    audioInputDeviceId: APP_DEFAULTS.audioInputDeviceId,
    openaiApiKey: APP_DEFAULTS.openaiApiKey,
  },
});

function normalizeLegacyConfig(): void {
  const legacyAudioInputDeviceId = store.get('audioInputDeviceId');
  if (legacyAudioInputDeviceId === 'default') {
    store.set('audioInputDeviceId', '');
  }
}

normalizeLegacyConfig();

store.set('hotkey', APP_DEFAULTS.hotkey);
store.set('polishProvider', APP_DEFAULTS.polishProvider);

// Clear legacy Supabase session store on startup
try { new Store({ name: 'supabase-session' }).clear(); } catch { /* ignore */ }

export function getConfig(): StoreSchema {
  return {
    hotkey: store.get('hotkey'),
    language: store.get('language'),
    enablePolish: store.get('enablePolish'),
    polishProvider: store.get('polishProvider'),
    audioInputDeviceId: store.get('audioInputDeviceId'),
    openaiApiKey: store.get('openaiApiKey'),
  };
}

export function setConfig(partial: Partial<StoreSchema>): void {
  for (const [key, value] of Object.entries(partial)) {
    store.set(key as keyof StoreSchema, value as any);
  }
}

export default store;
