export const IPC_CHANNELS = {
  // Recording control
  RECORDING_START: 'recording:start',
  RECORDING_STOP: 'recording:stop',
  RECORDING_CANCEL: 'recording:cancel',         // main -> renderer: cancel recording
  RECORDING_CANCELLED: 'recording:cancelled',   // renderer -> main: recording was cancelled
  RECORDING_PREFLIGHT: 'recording:preflight',   // renderer -> main: check mic permission before start
  RECORDING_START_FAILED: 'recording:start-failed', // renderer -> main: reset state after start failure
  RECORDING_CANCEL_AVAILABILITY: 'recording:cancel-availability', // main -> renderer: whether ESC cancel is available

  // Transcription
  TRANSCRIPTION_RESULT: 'transcription:result',
  TRANSCRIPTION_ERROR: 'transcription:error',

  // Status
  STATUS_UPDATE: 'status:update',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_UPDATED: 'settings:updated',

  // History (renderer -> main, invoke)
  HISTORY_LIST: 'history:list',
  HISTORY_DELETE: 'history:delete',
  HISTORY_GET_DIR: 'history:get-dir',
  HISTORY_SET_DIR: 'history:set-dir',

  // Stats (renderer -> main, invoke)
  STATS_GET: 'stats:get',

  // History updated (main -> renderer, push)
  HISTORY_UPDATED: 'history:updated',

  // Dictionary (renderer -> main, invoke)
  DICTIONARY_LIST: 'dictionary:list',
  DICTIONARY_ADD: 'dictionary:add',
  DICTIONARY_DELETE: 'dictionary:delete',

  // Realtime streaming transcription
  REALTIME_START: 'realtime:start',
  REALTIME_STARTED: 'realtime:started',
  REALTIME_AUDIO_CHUNK: 'realtime:audio-chunk',
  REALTIME_STOP: 'realtime:stop',
  REALTIME_UTTERANCE: 'realtime:utterance',
  REALTIME_ERROR: 'realtime:error',
  REALTIME_RESIZE: 'realtime:resize',

  // Renderer -> main diagnostic logging
  RENDERER_LOG: 'renderer:log',
} as const;

export const DEFAULT_HOTKEY = '`';

export const OVERLAY_WIDTH = 360;
export const OVERLAY_HEIGHT = 300;
