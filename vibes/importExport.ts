import { HistoryExportRecord } from '@/data/historyDb';
import { Counter, Group, HistoryEntry } from '@/vibes/definitions';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export type ExportScope = 'counter' | 'group' | 'all';
export type ImportMode = 'merge' | 'replace';

type ExportBase = {
  format: 'viby-export';
  version: 1;
  exportedAt: number;
};

export type CounterExportPayload = ExportBase & {
  scope: 'counter';
  data: {
    group: Group;
    counter: Counter;
    history: HistoryEntry[];
  };
};

export type GroupExportPayload = ExportBase & {
  scope: 'group';
  data: {
    group: Group;
    counters: Counter[];
    history: HistoryExportRecord[];
  };
};

export type AllExportPayload = ExportBase & {
  scope: 'all';
  data: {
    groups: Group[];
    counters: Counter[];
    history: HistoryExportRecord[];
  };
};

export type VibyExportPayload =
  | CounterExportPayload
  | GroupExportPayload
  | AllExportPayload;

export type ExportPreview = {
  groups: number;
  counters: number;
  historyEntries: number;
};

export function buildExportFileName(scope: ExportScope): string {
  const date = new Date().toISOString().slice(0, 10);
  return `viby-${scope}-${date}.json`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function hasHistoryEntryShape(value: unknown): value is HistoryEntry {
  if (!isObject(value)) return false;
  return typeof value.type === 'number' && typeof value.timestamp === 'number';
}

function hasCounterShape(value: unknown): value is Counter {
  if (!isObject(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.groupId === 'string' &&
    typeof value.label === 'string'
  );
}

function hasGroupShape(value: unknown): value is Group {
  if (!isObject(value)) return false;
  return typeof value.id === 'string' && typeof value.name === 'string';
}

function hasHistoryRecordShape(value: unknown): value is HistoryExportRecord {
  if (!isObject(value)) return false;
  return typeof value.counterId === 'string' && hasHistoryEntryShape(value.entry);
}

export function parseExportPayload(raw: string): VibyExportPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Selected file is not valid JSON.');
  }

  if (!isObject(parsed)) throw new Error('Invalid export payload format.');
  if (parsed.format !== 'viby-export' || parsed.version !== 1) {
    throw new Error('This file is not a supported Viby export.');
  }
  if (!['counter', 'group', 'all'].includes(String(parsed.scope))) {
    throw new Error('Unknown export scope.');
  }
  if (!isObject(parsed.data)) throw new Error('Export payload is missing data.');

  if (parsed.scope === 'counter') {
    const data = parsed.data as Record<string, unknown>;
    if (
      !hasGroupShape(data.group) ||
      !hasCounterShape(data.counter) ||
      !Array.isArray(data.history) ||
      !data.history.every(hasHistoryEntryShape)
    ) {
      throw new Error('Counter export payload is invalid.');
    }
  }

  if (parsed.scope === 'group') {
    const data = parsed.data as Record<string, unknown>;
    if (
      !hasGroupShape(data.group) ||
      !Array.isArray(data.counters) ||
      !data.counters.every(hasCounterShape) ||
      !Array.isArray(data.history) ||
      !data.history.every(hasHistoryRecordShape)
    ) {
      throw new Error('Group export payload is invalid.');
    }
  }

  if (parsed.scope === 'all') {
    const data = parsed.data as Record<string, unknown>;
    if (
      !Array.isArray(data.groups) ||
      !data.groups.every(hasGroupShape) ||
      !Array.isArray(data.counters) ||
      !data.counters.every(hasCounterShape) ||
      !Array.isArray(data.history) ||
      !data.history.every(hasHistoryRecordShape)
    ) {
      throw new Error('Full export payload is invalid.');
    }
  }

  return parsed as VibyExportPayload;
}

export function getExportPreview(payload: VibyExportPayload): ExportPreview {
  if (payload.scope === 'counter') {
    return { groups: 1, counters: 1, historyEntries: payload.data.history.length };
  }
  if (payload.scope === 'group') {
    return {
      groups: 1,
      counters: payload.data.counters.length,
      historyEntries: payload.data.history.length,
    };
  }
  return {
    groups: payload.data.groups.length,
    counters: payload.data.counters.length,
    historyEntries: payload.data.history.length,
  };
}

export async function shareExportPayload(payload: VibyExportPayload) {
  const json = JSON.stringify(payload, null, 2);
  const fileName = buildExportFileName(payload.scope);
  let shareUri: string | null = null;

  try {
    const file = new File(Paths.cache, fileName);
    await file.write(json);
    shareUri = file.uri;
  } catch {
    const legacy = await import('expo-file-system/legacy');
    const cacheDir = legacy.cacheDirectory;
    if (!cacheDir) throw new Error('Temporary storage is not available on this device.');
    const uri = `${cacheDir}${fileName}`;
    await legacy.writeAsStringAsync(uri, json, {
      encoding: legacy.EncodingType.UTF8,
    });
    shareUri = uri;
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing is not available on this device.');

  await Sharing.shareAsync(shareUri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Export data',
  });
}

export async function pickImportPayload(): Promise<VibyExportPayload | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets[0]) return null;

  let content = '';
  try {
    const file = new File(result.assets[0].uri);
    content = await file.text();
  } catch {
    const legacy = await import('expo-file-system/legacy');
    content = await legacy.readAsStringAsync(result.assets[0].uri, {
      encoding: legacy.EncodingType.UTF8,
    });
  }
  return parseExportPayload(content);
}
