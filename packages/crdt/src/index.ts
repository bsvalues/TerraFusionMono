import * as Y from 'yjs';
import { syncedStore, getYjsDoc } from '@syncedstore/core';

export interface ParcelStore {
  notes: string;
}

/**
 * Creates a CRDT-enabled store for a parcel
 * @param parcelId The unique identifier for the parcel
 * @returns A synchronized store with CRDT capabilities
 */
export function createParcelStore(parcelId: string) {
  // Create a synced store with a notes field
  const store = syncedStore<ParcelStore>({ notes: '' });
  
  // Get the underlying Yjs document
  const doc = getYjsDoc(store);
  
  // Set the clientID to ensure consistent merges
  doc.clientID = generateClientId(parcelId);
  
  return {
    store,
    doc,
  };
}

/**
 * Generates a deterministic client ID based on parcel ID
 * This helps with consistent conflict resolution
 */
function generateClientId(parcelId: string): number {
  let hash = 0;
  for (let i = 0; i < parcelId.length; i++) {
    const char = parcelId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Encodes a Yjs document update as a Base64 string
 * @param doc The Yjs document
 * @returns Base64 encoded update
 */
export function encodeDocUpdate(doc: Y.Doc): string {
  const update = Y.encodeStateAsUpdate(doc);
  return Buffer.from(update).toString('base64');
}

/**
 * Decodes a Base64 encoded update and applies it to a Yjs document
 * @param doc The target Yjs document
 * @param base64Update The Base64 encoded update
 */
export function applyEncodedUpdate(doc: Y.Doc, base64Update: string): void {
  const update = Buffer.from(base64Update, 'base64');
  Y.applyUpdate(doc, update);
}

/**
 * Merges an encoded update into a document and returns the new state
 * @param doc The target Yjs document
 * @param base64Update The Base64 encoded update to merge
 * @returns The Base64 encoded state after merge
 */
export function mergeUpdates(doc: Y.Doc, base64Update: string): string {
  applyEncodedUpdate(doc, base64Update);
  return encodeDocUpdate(doc);
}