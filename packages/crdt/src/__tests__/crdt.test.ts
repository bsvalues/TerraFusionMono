import * as Y from 'yjs';
import { createParcelStore, encodeDocUpdate, applyEncodedUpdate, mergeUpdates } from '../index';

describe('CRDT functionality', () => {
  test('createParcelStore initializes with empty notes', () => {
    const { store } = createParcelStore('TEST123');
    expect(store.notes).toBe('');
  });

  test('consistent merge with concurrent edits', () => {
    // Create two independent stores for the same parcel
    const { store: store1, doc: doc1 } = createParcelStore('TEST123');
    const { store: store2, doc: doc2 } = createParcelStore('TEST123');

    // Make different edits in each store
    store1.notes = 'Update from device 1';
    store2.notes = 'Update from device 2';

    // Capture updates from both devices
    const update1 = encodeDocUpdate(doc1);
    const update2 = encodeDocUpdate(doc2);

    // Create a third store to test both merges in different orders
    const { store: storeA, doc: docA } = createParcelStore('TEST123');
    const { store: storeB, doc: docB } = createParcelStore('TEST123');

    // Apply updates in different orders
    applyEncodedUpdate(docA, update1);
    applyEncodedUpdate(docA, update2);

    applyEncodedUpdate(docB, update2);
    applyEncodedUpdate(docB, update1);

    // Both stores should converge to the same state
    expect(storeA.notes).toBe(storeB.notes);
    
    // Final result should contain essence of both updates (actual merge depends on Yjs algorithm)
    const finalResult = storeA.notes;
    expect(
      finalResult.includes('device 1') || finalResult.includes('device 2')
    ).toBeTruthy();
  });

  test('encode and decode preserves document state', () => {
    const { store, doc } = createParcelStore('TEST123');
    store.notes = 'Test content for encoding';
    
    // Encode the document
    const encoded = encodeDocUpdate(doc);
    expect(typeof encoded).toBe('string');
    
    // Create a new document and apply the update
    const { store: newStore, doc: newDoc } = createParcelStore('TEST123');
    applyEncodedUpdate(newDoc, encoded);
    
    // The new store should have the same content
    expect(newStore.notes).toBe('Test content for encoding');
  });

  test('mergeUpdates correctly applies an update', () => {
    // Create initial doc with content
    const { store, doc } = createParcelStore('TEST123');
    store.notes = 'Initial content';
    
    // Create another doc with different content
    const { store: store2, doc: doc2 } = createParcelStore('TEST123');
    store2.notes = 'Updated content';
    
    const update = encodeDocUpdate(doc2);
    
    // Merge the update into the first doc
    mergeUpdates(doc, update);
    
    // The first store should now have the merged content
    expect(store.notes).toBe('Updated content');
  });
});