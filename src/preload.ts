import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from './shared/constants';
import type { AppStatus, ElectronAPI } from './shared/types';

const electronAPI: ElectronAPI = {
  onRecordingStart: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on(IPC_CHANNELS.RECORDING_START, handler);
    return () => { ipcRenderer.removeListener(IPC_CHANNELS.RECORDING_START, handler); };
  },
  onRecordingStop: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on(IPC_CHANNELS.RECORDING_STOP, handler);
    return () => { ipcRenderer.removeListener(IPC_CHANNELS.RECORDING_STOP, handler); };
  },
  onRecordingCancel: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on(IPC_CHANNELS.RECORDING_CANCEL, handler);
    return () => { ipcRenderer.removeListener(IPC_CHANNELS.RECORDING_CANCEL, handler); };
  },
  onRecordingCancelAvailability: (callback: (available: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, available: boolean) => callback(available);
    ipcRenderer.on(IPC_CHANNELS.RECORDING_CANCEL_AVAILABILITY, handler);
    return () => { ipcRenderer.removeListener(IPC_CHANNELS.RECORDING_CANCEL_AVAILABILITY, handler); };
  },
  onStatusUpdate: (callback: (status: AppStatus) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, status: AppStatus) => callback(status);
    ipcRenderer.on(IPC_CHANNELS.STATUS_UPDATE, handler);
    return () => { ipcRenderer.removeListener(IPC_CHANNELS.STATUS_UPDATE, handler); };
  },
  onTranscriptionResult: (callback: (text: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, text: string) => callback(text);
    ipcRenderer.on(IPC_CHANNELS.TRANSCRIPTION_RESULT, handler);
    return () => { ipcRenderer.removeListener(IPC_CHANNELS.TRANSCRIPTION_RESULT, handler); };
  },
  onTranscriptionError: (callback: (error: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, error: string) => callback(error);
    ipcRenderer.on(IPC_CHANNELS.TRANSCRIPTION_ERROR, handler);
    return () => { ipcRenderer.removeListener(IPC_CHANNELS.TRANSCRIPTION_ERROR, handler); };
  },
  cancelRecording: () => {
    ipcRenderer.send(IPC_CHANNELS.RECORDING_CANCELLED);
  },
  recordingPreflight: () =>
    ipcRenderer.invoke(IPC_CHANNELS.RECORDING_PREFLIGHT),
  reportRecordingStartFailure: (message: string) => {
    ipcRenderer.send(IPC_CHANNELS.RECORDING_START_FAILED, message);
  },
  getSettings: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET);
  },
  setSettings: (settings) => {
    ipcRenderer.send(IPC_CHANNELS.SETTINGS_SET, settings);
  },

  // Dictionary
  dictionaryList: () =>
    ipcRenderer.invoke(IPC_CHANNELS.DICTIONARY_LIST),
  dictionaryAdd: (word: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.DICTIONARY_ADD, { word }),
  dictionaryDelete: (id: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.DICTIONARY_DELETE, { id }),

  // History
  historyList: (page: number, pageSize: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.HISTORY_LIST, { page, pageSize }),
  historyDelete: (id: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.HISTORY_DELETE, { id }),
  historyGetDir: () =>
    ipcRenderer.invoke(IPC_CHANNELS.HISTORY_GET_DIR),
  historySetDir: (dir: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.HISTORY_SET_DIR, { dir }),

  // Stats
  statsGet: () =>
    ipcRenderer.invoke(IPC_CHANNELS.STATS_GET),
  onHistoryUpdated: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on(IPC_CHANNELS.HISTORY_UPDATED, handler);
    return () => { ipcRenderer.removeListener(IPC_CHANNELS.HISTORY_UPDATED, handler); };
  },

  // Realtime streaming transcription
  realtimeStart: () =>
    ipcRenderer.invoke(IPC_CHANNELS.REALTIME_START),
  realtimeSendAudio: (pcm16: ArrayBuffer) => {
    ipcRenderer.send(IPC_CHANNELS.REALTIME_AUDIO_CHUNK, pcm16);
  },
  realtimeStop: () => {
    ipcRenderer.send(IPC_CHANNELS.REALTIME_STOP);
  },
  onRealtimeStarted: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on(IPC_CHANNELS.REALTIME_STARTED, handler);
    return () => { ipcRenderer.removeListener(IPC_CHANNELS.REALTIME_STARTED, handler); };
  },
  onRealtimeUtterance: (callback: (text: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, text: string) => callback(text);
    ipcRenderer.on(IPC_CHANNELS.REALTIME_UTTERANCE, handler);
    return () => { ipcRenderer.removeListener(IPC_CHANNELS.REALTIME_UTTERANCE, handler); };
  },
  onRealtimeError: (callback: (error: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, error: string) => callback(error);
    ipcRenderer.on(IPC_CHANNELS.REALTIME_ERROR, handler);
    return () => { ipcRenderer.removeListener(IPC_CHANNELS.REALTIME_ERROR, handler); };
  },
  realtimeResize: (width: number, height: number) => {
    ipcRenderer.send(IPC_CHANNELS.REALTIME_RESIZE, width, height);
  },

  // Diagnostic logging (renderer -> main, visible in terminal)
  rendererLog: (msg: string) => {
    ipcRenderer.send(IPC_CHANNELS.RENDERER_LOG, msg);
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
