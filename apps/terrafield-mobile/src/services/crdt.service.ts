import { BehaviorSubject } from 'rxjs';
import * as Y from 'yjs';
import apiService from './api.service';
import networkService from './network.service';
import { ParcelNoteRepository, ParcelRepository } from '../utils/realm';
import Config from '../config';

// Type for document updates
interface DocUpdate {
  parcelId: string;
  update: string; // Base64 encoded update
  timestamp: Date;
}

/**
 * CRDT service for handling collaborative editing with Yjs
 */
class CrdtService {
  // Map to store active Y.Doc instances by parcel ID
  private docs = new Map<string, Y.Doc>();
  
  // Map to store the last known state for each document
  private docStates = new Map<string, string>();
  
  // Map to track observers by parcel ID
  private observers = new Map<string, BehaviorSubject<string>>();
  
  /**
   * Initialize a Yjs document for a parcel
   * 
   * @param parcelId The ID of the parcel
   * @returns Y.Doc instance
   */
  public async initDocument(parcelId: string): Promise<Y.Doc> {
    // Check if we already have an active document
    if (this.docs.has(parcelId)) {
      return this.docs.get(parcelId)!;
    }
    
    // Create a new Yjs document
    const doc = new Y.Doc();
    this.docs.set(parcelId, doc);
    
    // Create observer if it doesn't exist
    if (!this.observers.has(parcelId)) {
      this.observers.set(parcelId, new BehaviorSubject<string>(''));
    }
    
    // Get the text type for this document
    const yText = doc.getText('notes');
    
    try {
      // Try to get document state from local storage
      const localNote = await ParcelNoteRepository.getByParcelId(parcelId);
      
      if (localNote?.yDocData) {
        // Apply the local state to the document
        const update = Buffer.from(localNote.yDocData, 'base64');
        Y.applyUpdate(doc, update);
        this.docStates.set(parcelId, localNote.yDocData);
        
        // Notify observers
        this.observers.get(parcelId)?.next(yText.toString());
      }
      
      // If online, try to sync with server
      if (networkService.isOnline()) {
        await this.syncWithServer(parcelId);
      }
      
      // Subscribe to document changes
      doc.on('update', (update: Uint8Array) => {
        this.handleDocumentUpdate(parcelId, update);
      });
      
      return doc;
    } catch (error) {
      console.error(`Error initializing document for parcel ${parcelId}:`, error);
      return doc;
    }
  }
  
  /**
   * Get the text content for a document
   * @param parcelId The ID of the parcel
   * @returns Text content as a string
   */
  public async getText(parcelId: string): Promise<string> {
    const doc = await this.initDocument(parcelId);
    const yText = doc.getText('notes');
    return yText.toString();
  }
  
  /**
   * Set text content for a document
   * @param parcelId The ID of the parcel
   * @param text The text content to set
   */
  public async setText(parcelId: string, text: string): Promise<void> {
    const doc = await this.initDocument(parcelId);
    const yText = doc.getText('notes');
    
    // This will trigger the 'update' event
    // and automatically handle the synchronization
    doc.transact(() => {
      yText.delete(0, yText.length);
      yText.insert(0, text);
    });
  }
  
  /**
   * Get an observable for document changes
   * @param parcelId The ID of the parcel
   * @returns Observable that emits the document text when it changes
   */
  public getTextObservable(parcelId: string) {
    if (!this.observers.has(parcelId)) {
      this.observers.set(parcelId, new BehaviorSubject<string>(''));
    }
    
    return this.observers.get(parcelId)!.asObservable();
  }
  
  /**
   * Manually trigger a sync with the server
   * @param parcelId The ID of the parcel
   */
  public async syncWithServer(parcelId: string): Promise<boolean> {
    if (!networkService.isOnline()) {
      return false;
    }
    
    try {
      const doc = await this.initDocument(parcelId);
      
      // Get the current document state
      const encodedState = this.encodeDocState(doc);
      
      // Send to server for synchronization
      const response = await apiService.request(`/api/mobile/sync/crdt`, {
        method: 'POST',
        body: {
          parcelId,
          update: encodedState
        },
        requiresAuth: true,
        cacheResponse: false,
        resourceType: 'parcelNote',
        resourceId: parcelId
      });
      
      if (response.success && response.data?.update) {
        // Apply server response to the document
        const serverUpdate = Buffer.from(response.data.update, 'base64');
        Y.applyUpdate(doc, serverUpdate);
        
        // Update local state
        this.docStates.set(parcelId, response.data.update);
        
        // Save to local database
        await this.saveToLocalDatabase(parcelId, response.data.update);
        
        // Notify observers
        const yText = doc.getText('notes');
        this.observers.get(parcelId)?.next(yText.toString());
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error syncing document for parcel ${parcelId}:`, error);
      return false;
    }
  }
  
  /**
   * Handle document updates from Yjs
   * @param parcelId The ID of the parcel
   * @param update The update from Yjs
   */
  private async handleDocumentUpdate(parcelId: string, update: Uint8Array): Promise<void> {
    try {
      const doc = this.docs.get(parcelId);
      
      if (!doc) {
        return;
      }
      
      // Encode the current state
      const encodedState = this.encodeDocState(doc);
      
      // Save to local database
      await this.saveToLocalDatabase(parcelId, encodedState);
      
      // Notify observers
      const yText = doc.getText('notes');
      this.observers.get(parcelId)?.next(yText.toString());
      
      // If online, sync with server
      if (networkService.isOnline() && !this.isSyncing) {
        // Throttle server sync to avoid too many requests
        this.throttledSync(parcelId);
      }
    } catch (error) {
      console.error(`Error handling document update for parcel ${parcelId}:`, error);
    }
  }
  
  // Flag to track if we're currently syncing
  private isSyncing = false;
  private syncTimeout: any = null;
  
  /**
   * Throttle server synchronization to avoid too many requests
   */
  private throttledSync(parcelId: string): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    
    this.syncTimeout = setTimeout(async () => {
      this.isSyncing = true;
      await this.syncWithServer(parcelId);
      this.isSyncing = false;
    }, Config.SYNC.CRDT_SYNC_DELAY);
  }
  
  /**
   * Encode a Yjs document state as a base64 string
   */
  private encodeDocState(doc: Y.Doc): string {
    const update = Y.encodeStateAsUpdate(doc);
    return Buffer.from(update).toString('base64');
  }
  
  /**
   * Save a document state to the local database
   */
  private async saveToLocalDatabase(parcelId: string, encodedState: string): Promise<void> {
    try {
      // Check if note exists
      const existingNote = await ParcelNoteRepository.getByParcelId(parcelId);
      
      // Get the current text content from the CRDT document
      const currentText = this.docs.get(parcelId)?.getText('notes').toString() || '';
      
      if (existingNote) {
        // Update existing note
        await ParcelNoteRepository.update(existingNote.id, {
          yDocData: encodedState,
          text: currentText,
          updatedAt: new Date(),
          serverSynced: false,
          syncCount: (existingNote.syncCount || 0) + 1
        });
      } else {
        // Create new note
        await ParcelNoteRepository.create({
          parcelId,
          yDocData: encodedState,
          text: currentText,
          syncCount: 1,
          serverSynced: false
        });
      }
      
      // Update the associated parcel to indicate it has notes (if not already)
      const parcel = await ParcelRepository.getById(parcelId);
      if (parcel && !parcel.hasNotes) {
        await ParcelRepository.update(parcelId, {
          hasNotes: true,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error(`Error saving document state to database for parcel ${parcelId}:`, error);
    }
  }
  
  /**
   * Destroy a document and release resources
   */
  public destroyDocument(parcelId: string): void {
    const doc = this.docs.get(parcelId);
    
    if (doc) {
      // Unsubscribe from updates
      doc.off('update');
      
      // Destroy the document
      doc.destroy();
      
      // Remove from maps
      this.docs.delete(parcelId);
      this.docStates.delete(parcelId);
      
      // Complete and remove the subject
      const subject = this.observers.get(parcelId);
      if (subject) {
        subject.complete();
        this.observers.delete(parcelId);
      }
    }
  }
}

const crdtService = new CrdtService();
export default crdtService;