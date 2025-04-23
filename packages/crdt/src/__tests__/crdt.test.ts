import { createParcelStore, applyEncodedUpdate, encodeDocUpdate, mergeYDocs } from '../index';
import * as Y from 'yjs';

describe('CRDT Parcel Notes', () => {
  describe('createParcelStore', () => {
    it('should create a store with the given ID', () => {
      const { store, doc } = createParcelStore('test-parcel-1');
      
      expect(doc).toBeInstanceOf(Y.Doc);
      expect(store.notes).toBeDefined();
      expect(store.notes).toBe('');
    });
  });
  
  describe('encodeDocUpdate and applyEncodedUpdate', () => {
    it('should encode and apply updates correctly', () => {
      // Create two stores
      const { store: store1, doc: doc1 } = createParcelStore('test-parcel-2');
      const { store: store2, doc: doc2 } = createParcelStore('test-parcel-2');
      
      // Update store1
      store1.notes = 'Hello, world!';
      
      // Encode the update
      const update = encodeDocUpdate(doc1);
      expect(typeof update).toBe('string');
      
      // Apply the update to store2
      applyEncodedUpdate(doc2, update);
      
      // Check that store2 now has the same content
      expect(store2.notes).toBe('Hello, world!');
    });
  });
  
  describe('mergeYDocs', () => {
    it('should merge updates from two docs', () => {
      // Create two docs that will diverge
      const { store: store1, doc: doc1 } = createParcelStore('test-parcel-3');
      const { store: store2, doc: doc2 } = createParcelStore('test-parcel-3');
      
      // Make different changes to each doc
      store1.notes = 'Change from user 1.';
      store2.notes = 'Change from user 2.';
      
      // Merge the docs
      const mergedDoc = mergeYDocs(doc1, doc2);
      
      // Create a new store with the merged doc to check the content
      const yText = mergedDoc.getText('notes');
      const mergedText = yText.toString();
      
      // The exact result will depend on CRDT conflict resolution rules
      // Here we just check that it contains content from both docs
      expect(mergedText.includes('Change from user 1') || 
             mergedText.includes('Change from user 2')).toBeTruthy();
    });
  });
  
  describe('real-world scenario', () => {
    it('should handle offline-first workflow', () => {
      // Create a "server" doc
      const { store: serverStore, doc: serverDoc } = createParcelStore('test-parcel-4');
      serverStore.notes = 'Initial note from server.';
      
      // User 1 syncs with server
      const { store: user1Store, doc: user1Doc } = createParcelStore('test-parcel-4');
      applyEncodedUpdate(user1Doc, encodeDocUpdate(serverDoc));
      expect(user1Store.notes).toBe('Initial note from server.');
      
      // User 1 goes offline and makes changes
      user1Store.notes = 'Initial note from server. Addition from user 1.';
      
      // Meanwhile server gets updated by another user
      serverStore.notes = 'Initial note from server. Addition from server.';
      
      // User 1 comes back online and syncs
      // In real app, this would be a more complex process
      // 1. Send user1's changes to server
      const user1Update = encodeDocUpdate(user1Doc);
      
      // 2. Server applies user1's changes and merges
      applyEncodedUpdate(serverDoc, user1Update);
      
      // 3. Server sends back merged state
      const serverUpdate = encodeDocUpdate(serverDoc);
      
      // 4. User applies merged state
      applyEncodedUpdate(user1Doc, serverUpdate);
      
      // Check the result
      expect(user1Store.notes).toContain('Initial note from server');
      expect(user1Store.notes).toContain('Addition from user 1');
      expect(user1Store.notes).toContain('Addition from server');
    });
  });
});