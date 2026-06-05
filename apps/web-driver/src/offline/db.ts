import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export type OutboxKind = 'STATUS_TRANSITION' | 'POD' | 'LOCATION';
export type OutboxStatus = 'PENDING' | 'IN_FLIGHT' | 'FAILED' | 'DONE';

export interface OutboxItem {
  id: string;
  kind: OutboxKind;
  shipmentId: string;
  /** Idempotency key so server-side dedupe makes retries safe. */
  idempotencyKey: string;
  payload: unknown;
  status: OutboxStatus;
  attempts: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

interface DriverDb extends DBSchema {
  outbox: {
    key: string;
    value: OutboxItem;
    indexes: { 'by-status': OutboxStatus; 'by-shipment': string };
  };
  cache: {
    key: string;
    value: { key: string; value: unknown; updatedAt: number };
  };
}

const DB_NAME = 'livraison-driver';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<DriverDb>> | null = null;

export function getDb(): Promise<IDBPDatabase<DriverDb>> {
  if (dbPromise === null) {
    dbPromise = openDB<DriverDb>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const outbox = db.createObjectStore('outbox', { keyPath: 'id' });
        outbox.createIndex('by-status', 'status');
        outbox.createIndex('by-shipment', 'shipmentId');
        db.createObjectStore('cache', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}

/** Test-only hook to reset the singleton between cases. */
export function __resetDbForTests(): void {
  dbPromise = null;
}
