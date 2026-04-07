import { HistoryAction, HistoryEntry, HistoryEntryChange } from '@/vibes/definitions';
import * as SQLite from 'expo-sqlite';

type DbHistoryRow = {
  id: number;
  ts: number;
  action_type: number;
  value_before: number | null;
  value_after: number | null;
  delta: number | null;
  payload_json: string | null;
};

type DbDailyStatRow = {
  day_key: string;
  entry_count: number;
};

export type HistoryCursor = {
  ts: number;
  id: number;
};

export type HistoryRange = {
  startTs?: number;
  endTs?: number;
};

export type HistoryPage = {
  items: HistoryEntry[];
  nextCursor: HistoryCursor | null;
  hasMore: boolean;
};

export type HistoryExportRecord = {
  counterId: string;
  entry: HistoryEntry;
};

let db: SQLite.SQLiteDatabase | null = null;

function getDb() {
  if (db) return db;

  db = SQLite.openDatabaseSync('history.db');
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS counter_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      counter_id TEXT NOT NULL,
      ts INTEGER NOT NULL,
      action_type INTEGER NOT NULL,
      value_before INTEGER,
      value_after INTEGER,
      delta INTEGER,
      payload_json TEXT
    );

    CREATE TABLE IF NOT EXISTS history_daily_stats (
      counter_id TEXT NOT NULL,
      day_key TEXT NOT NULL,
      entry_count INTEGER NOT NULL,
      PRIMARY KEY (counter_id, day_key)
    );

    CREATE INDEX IF NOT EXISTS idx_history_counter_ts_desc
      ON counter_history(counter_id, ts DESC, id DESC);

    CREATE INDEX IF NOT EXISTS idx_history_counter_ts
      ON counter_history(counter_id, ts);

    CREATE INDEX IF NOT EXISTS idx_daily_counter_day
      ON history_daily_stats(counter_id, day_key);
  `);

  return db;
}

function getDayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

function normalizeDayKey(value: string): string {
  if (!value) return value;
  return value.length >= 10 ? value.slice(0, 10) : value;
}

function serializePayload(payload: unknown): string | null {
  if (!payload) return null;
  return JSON.stringify(payload);
}

function parsePayload(value: string | null): unknown {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function toHistoryEntry(row: DbHistoryRow): HistoryEntry {
  const payload = parsePayload(row.payload_json) as { changes?: HistoryEntryChange[] };
  const entry: HistoryEntry = {
    type: row.action_type as HistoryAction,
    timestamp: row.ts,
  };

  if (
    row.action_type === HistoryAction.Increment &&
    row.delta != null &&
    row.value_before != null &&
    row.value_after != null
  ) {
    entry.details = {
      incrementBy: row.delta,
      valueBefore: row.value_before,
      valueAfter: row.value_after,
    };
  }

  if (row.action_type === HistoryAction.SettingsChange && payload?.changes) {
    entry.changes = payload.changes;
  }

  return entry;
}

function updateDailyStat(counterId: string, ts: number, delta: number) {
  const database = getDb();
  const dayKey = getDayKey(ts);
  database.runSync(
    `
      INSERT INTO history_daily_stats(counter_id, day_key, entry_count)
      VALUES (?, ?, ?)
      ON CONFLICT(counter_id, day_key)
      DO UPDATE SET entry_count = MAX(0, entry_count + excluded.entry_count);
    `,
    [counterId, dayKey, delta],
  );
}

export function initHistoryDb() {
  getDb();
}

export function appendHistoryEntry(
  counterId: string,
  entry: {
    type: number;
    timestamp: number;
    valueBefore?: number;
    valueAfter?: number;
    delta?: number;
    changes?: HistoryEntryChange[];
  },
) {
  const database = getDb();
  database.runSync(
    `
      INSERT INTO counter_history(
        counter_id,
        ts,
        action_type,
        value_before,
        value_after,
        delta,
        payload_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `,
    [
      counterId,
      entry.timestamp,
      entry.type,
      entry.valueBefore ?? null,
      entry.valueAfter ?? null,
      entry.delta ?? null,
      serializePayload({ changes: entry.changes }),
    ],
  );
  updateDailyStat(counterId, entry.timestamp, 1);
}

export function clearHistoryEntries(counterId: string): number {
  const database = getDb();
  const rows = database.getAllSync<DbDailyStatRow>(
    `SELECT day_key, entry_count FROM history_daily_stats WHERE counter_id = ?;`,
    [counterId],
  );
  for (const row of rows) {
    if (row.entry_count > 0) {
      database.runSync(
        `
          UPDATE history_daily_stats
          SET entry_count = 0
          WHERE counter_id = ? AND day_key = ?;
        `,
        [counterId, row.day_key],
      );
    }
  }
  database.runSync(`DELETE FROM counter_history WHERE counter_id = ?;`, [counterId]);
  return rows.reduce((sum, row) => sum + row.entry_count, 0);
}

export function deleteHistoryForCounter(counterId: string) {
  const database = getDb();
  database.runSync(`DELETE FROM counter_history WHERE counter_id = ?;`, [counterId]);
  database.runSync(`DELETE FROM history_daily_stats WHERE counter_id = ?;`, [counterId]);
}

export function deleteHistoryForCounters(counterIds: string[]) {
  if (counterIds.length === 0) return;

  const database = getDb();
  const placeholders = counterIds.map(() => '?').join(',');
  database.runSync(
    `DELETE FROM counter_history WHERE counter_id IN (${placeholders});`,
    counterIds,
  );
  database.runSync(
    `DELETE FROM history_daily_stats WHERE counter_id IN (${placeholders});`,
    counterIds,
  );
}

export function duplicateCounterHistory(sourceCounterId: string, targetCounterId: string) {
  const database = getDb();
  database.runSync(
    `
      INSERT INTO counter_history(
        counter_id,
        ts,
        action_type,
        value_before,
        value_after,
        delta,
        payload_json
      )
      SELECT ?, ts, action_type, value_before, value_after, delta, payload_json
      FROM counter_history
      WHERE counter_id = ?
      ORDER BY ts ASC, id ASC;
    `,
    [targetCounterId, sourceCounterId],
  );

  database.runSync(
    `
      INSERT INTO history_daily_stats(counter_id, day_key, entry_count)
      SELECT ?, day_key, entry_count
      FROM history_daily_stats
      WHERE counter_id = ?
      ON CONFLICT(counter_id, day_key)
      DO UPDATE SET entry_count = excluded.entry_count;
    `,
    [targetCounterId, sourceCounterId],
  );
}

export function getHistoryEntriesForCounters(counterIds: string[]): HistoryExportRecord[] {
  if (counterIds.length === 0) return [];

  const database = getDb();
  const placeholders = counterIds.map(() => '?').join(',');
  const rows = database.getAllSync<(DbHistoryRow & { counter_id: string })>(
    `
      SELECT counter_id, id, ts, action_type, value_before, value_after, delta, payload_json
      FROM counter_history
      WHERE counter_id IN (${placeholders})
      ORDER BY counter_id ASC, ts ASC, id ASC;
    `,
    counterIds,
  );

  return rows.map((row) => ({
    counterId: row.counter_id,
    entry: toHistoryEntry(row),
  }));
}

export function replaceAllHistoryEntries(records: HistoryExportRecord[]) {
  const database = getDb();
  database.execSync('BEGIN TRANSACTION;');
  try {
    database.execSync('DELETE FROM counter_history; DELETE FROM history_daily_stats;');

    for (const record of records) {
      const entry = record.entry;
      database.runSync(
        `
          INSERT INTO counter_history(
            counter_id,
            ts,
            action_type,
            value_before,
            value_after,
            delta,
            payload_json
          )
          VALUES (?, ?, ?, ?, ?, ?, ?);
        `,
        [
          record.counterId,
          entry.timestamp,
          entry.type,
          entry.details?.valueBefore ?? null,
          entry.details?.valueAfter ?? null,
          entry.details?.incrementBy ?? null,
          serializePayload({ changes: entry.changes }),
        ],
      );
      updateDailyStat(record.counterId, entry.timestamp, 1);
    }
    database.execSync('COMMIT;');
  } catch (error) {
    database.execSync('ROLLBACK;');
    throw error;
  }
}

export function getHistoryPage(
  counterId: string,
  opts: {
    limit: number;
    range?: HistoryRange;
    cursor?: HistoryCursor | null;
  },
): HistoryPage {
  const database = getDb();
  const whereParts = ['counter_id = ?'];
  const args: (string | number)[] = [counterId];

  if (opts.range?.startTs != null) {
    whereParts.push('ts >= ?');
    args.push(opts.range.startTs);
  }
  if (opts.range?.endTs != null) {
    whereParts.push('ts <= ?');
    args.push(opts.range.endTs);
  }
  if (opts.cursor) {
    whereParts.push('(ts < ? OR (ts = ? AND id < ?))');
    args.push(opts.cursor.ts, opts.cursor.ts, opts.cursor.id);
  }

  const rows = database.getAllSync<DbHistoryRow>(
    `
      SELECT id, ts, action_type, value_before, value_after, delta, payload_json
      FROM counter_history
      WHERE ${whereParts.join(' AND ')}
      ORDER BY ts DESC, id DESC
      LIMIT ?;
    `,
    [...args, opts.limit + 1],
  );

  const rowsForPage = rows.slice(0, opts.limit);
  const items = rowsForPage.map((row) => toHistoryEntry(row));

  const hasMore = rows.length > opts.limit;
  const lastRow = rowsForPage[rowsForPage.length - 1];
  const nextCursor = hasMore && lastRow ? { ts: lastRow.ts, id: lastRow.id } : null;

  return { items, nextCursor, hasMore };
}

export function getDailyCounts(counterId: string, range: HistoryRange) {
  const database = getDb();
  const whereParts = ['counter_id = ?'];
  const args: (string | number)[] = [counterId];

  if (range.startTs != null) {
    whereParts.push('day_key >= ?');
    args.push(getDayKey(range.startTs));
  }
  if (range.endTs != null) {
    whereParts.push('day_key <= ?');
    args.push(getDayKey(range.endTs));
  }

  const rows = database.getAllSync<DbDailyStatRow>(
    `
      SELECT day_key, entry_count
      FROM history_daily_stats
      WHERE ${whereParts.join(' AND ')}
      ORDER BY day_key ASC;
    `,
    args,
  );

  return rows.map((row) => ({
    dayKey: normalizeDayKey(row.day_key),
    count: row.entry_count,
  }));
}
