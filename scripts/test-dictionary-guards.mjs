import assert from 'node:assert/strict';

import {
  applyDictionaryCorrections,
  sanitizePolishOutput,
  sanitizeRealtimeTranscript,
} from '../src/main/transcript-guards.ts';

const correctionCases = [
  {
    name: 'LiveKit spaced transcript',
    input: 'please use live kit for the call layer',
    dictionary: ['LiveKit'],
    expected: 'please use LiveKit for the call layer',
  },
  {
    name: 'OpenCloud spaced transcript',
    input: 'ship this on open cloud first',
    dictionary: ['OpenCloud'],
    expected: 'ship this on OpenCloud first',
  },
  {
    name: 'cloudcode lowercase merged transcript',
    input: 'cloudcode is the internal codename',
    dictionary: ['cloudcode'],
    expected: 'cloudcode is the internal codename',
  },
  {
    name: 'cloudcode spaced transcript',
    input: 'cloud code is the internal codename',
    dictionary: ['cloudcode'],
    expected: 'cloudcode is the internal codename',
  },
  {
    name: 'claude code fuzzy transcript',
    input: 'cloud code should handle the docs',
    dictionary: ['claude code'],
    expected: 'claude code should handle the docs',
  },
  {
    name: 'openClaw fuzzy transcript',
    input: 'opencloud should handle the docs',
    dictionary: ['openClaw'],
    expected: 'openClaw should handle the docs',
  },
];

for (const testCase of correctionCases) {
  const result = applyDictionaryCorrections(testCase.input, testCase.dictionary);
  assert.equal(result.text, testCase.expected, `${testCase.name} failed`);
}

const realtimeLeak = sanitizeRealtimeTranscript(`请帮我出个方案。\n\nContext: ###\nTranscribe everything the speaker says. Do not skip, summarize, or omit any part of the speech.\nThe speaker may use multiple languages interchangeably (code-switching). Keep each word in its original language exactly as spoken. Do not translate.\n###`);
assert.equal(realtimeLeak.text, '请帮我出个方案。', 'Realtime leak sanitizer failed');

const polishLeak = sanitizePolishOutput(
  '总结如下：\n1. 用 LiveKit。\n\n[PRIVATE_CONTEXT]\nActive app: Codex\nWindow title: Secret Draft\n[/PRIVATE_CONTEXT]',
  '总结如下，用 live kit。',
  {
    appName: 'Codex',
    windowTitle: 'Secret Draft',
    selectedText: '',
    elementRole: '',
  },
);
assert.equal(polishLeak.text, '总结如下：\n1. 用 LiveKit。', 'Polish leak sanitizer failed');

console.log('dictionary-guards tests passed');
