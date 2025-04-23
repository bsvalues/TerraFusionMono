import * as Y from 'yjs';
import { SyncedStore } from '@syncedstore/core';

/**
 * Interface for parcel store type
 */
export interface ParcelStore {
  notes: string;
}

/**
 * Create a new parcel store with Yjs document
 * @param id The ID for the document
 * @returns Object containing the store and doc
 */
export function createParcelStore(id: string) {
  // Create the Y.Doc instance
  const doc = new Y.Doc();
  
  // Create a synced store using the Y.Doc
  const store = SyncedStore.create<ParcelStore>({
    notes: 'text',
  }, doc);
  
  // Initialize with empty text
  if (!store.notes) {
    store.notes = '';
  }
  
  return { store, doc };
}

/**
 * Apply an encoded update to a Y.Doc
 * @param doc The Y.Doc instance to update
 * @param base64Update Base64 encoded update
 */
export function applyEncodedUpdate(doc: Y.Doc, base64Update: string): void {
  const update = Buffer.from(base64Update, 'base64');
  Y.applyUpdate(doc, update);
}

/**
 * Encode a Y.Doc's state as a base64 string
 * @param doc The Y.Doc instance to encode
 * @returns Base64 encoded update
 */
export function encodeDocUpdate(doc: Y.Doc): string {
  const update = Y.encodeStateAsUpdate(doc);
  return Buffer.from(update).toString('base64');
}

/**
 * Merge two Y.Doc instances
 * @param doc1 The first Y.Doc
 * @param doc2 The second Y.Doc
 * @returns A new Y.Doc with merged state
 */
export function mergeYDocs(doc1: Y.Doc, doc2: Y.Doc): Y.Doc {
  const mergedDoc = new Y.Doc();
  
  // Apply updates from both docs to the merged doc
  Y.applyUpdate(mergedDoc, Y.encodeStateAsUpdate(doc1));
  Y.applyUpdate(mergedDoc, Y.encodeStateAsUpdate(doc2));
  
  return mergedDoc;
}

/**
 * Get differences between two Y.Doc instances
 * @param doc1 The first Y.Doc
 * @param doc2 The second Y.Doc
 * @returns Base64 encoded diff update
 */
export function getDiff(doc1: Y.Doc, doc2: Y.Doc): string {
  const state1 = Y.encodeStateAsUpdate(doc1);
  const state2 = Y.encodeStateAsUpdate(doc2);
  
  // This is a simplified approach; in a real implementation, 
  // you would compute a proper diff between the two states
  const diff = Y.diffUpdate(state1, state2);
  
  return Buffer.from(diff).toString('base64');
}