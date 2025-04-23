import * as Y from 'yjs';
import { Buffer } from 'buffer';
import apiService from './api.service';
import networkService from './network.service';
import { saveParcelNote, getNoteByParcelId } from '../utils/realm';

/**
 * CRDT-based synchronization service for parcel notes
 * Uses Y.js as the CRDT implementation for collaborative editing
 */
export class SyncService {
  private static instance: SyncService;
  
  // Map of active Y documents by parcel ID
  private documents: Map<string, Y.Doc> = new Map();
  
  // Flag to track sync in progress
  private syncInProgress: boolean = false;
  
  // Private constructor for singleton pattern
  private constructor() {
    // Set up network status listener
    this.setupNetworkListener();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Set up network status listener
   */
  private setupNetworkListener(): void {
    // When network comes back online, try to sync
    networkService.networkState$.subscribe(status => {
      if (status.isConnected && status.isInternetReachable) {
        this.syncAllDocuments();
      }
    });
  }

  /**
   * Get or create a Y document for a parcel
   */
  public async getDocument(parcelId: string): Promise<Y.Doc> {
    // Check if document already exists in memory
    if (this.documents.has(parcelId)) {
      return this.documents.get(parcelId);
    }
    
    // Create new document
    const doc = new Y.Doc();
    
    // Try to load from local storage
    try {
      const localNote = await getNoteByParcelId(parcelId);
      
      if (localNote && localNote.yDocData) {
        // Apply updates from stored document
        const updates = Buffer.from(localNote.yDocData, 'base64');
        Y.applyUpdate(doc, updates);
      } else {
        // Try to sync from server
        await this.syncDocumentFromServer(doc, parcelId);
      }
    } catch (error) {
      console.error(`Error loading document for parcel ${parcelId}:`, error);
    }
    
    // Store in memory
    this.documents.set(parcelId, doc);
    
    // Set up auto-save
    this.setupDocumentAutoSave(doc, parcelId);
    
    return doc;
  }

  /**
   * Set up auto-save for document changes
   */
  private setupDocumentAutoSave(doc: Y.Doc, parcelId: string): void {
    // Listen for document changes
    doc.on('update', async (update: Uint8Array) => {
      try {
        // Save current state to local storage
        const base64Data = Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64');
        
        // Get text content for easier viewing/searching
        const yText = doc.getText('content');
        const content = yText.toString();
        
        // Save to local storage
        await saveParcelNote({
          parcelId,
          content,
          yDocData: base64Data,
          isLocalOnly: !networkService.isOnline(),
          syncCount: 0,
        });
        
        // Try to sync if online
        if (networkService.isOnline()) {
          this.syncDocumentToServer(doc, parcelId);
        }
      } catch (error) {
        console.error(`Error auto-saving document for parcel ${parcelId}:`, error);
      }
    });
  }

  /**
   * Sync a document from the server
   */
  private async syncDocumentFromServer(doc: Y.Doc, parcelId: string): Promise<boolean> {
    if (!networkService.isOnline()) {
      return false;
    }
    
    try {
      // Get document from server
      const response = await apiService.request<any>(`/api/mobile/parcels/${parcelId}/notes`, {
        method: 'GET',
      });
      
      if (response && response.yDocData) {
        // Apply updates from server
        const updates = Buffer.from(response.yDocData, 'base64');
        Y.applyUpdate(doc, updates);
        
        // Save to local storage
        const base64Data = Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64');
        
        // Get text content
        const yText = doc.getText('content');
        const content = yText.toString();
        
        await saveParcelNote({
          parcelId,
          content,
          yDocData: base64Data,
          isLocalOnly: false,
          syncCount: response.syncCount || 0,
        });
        
        return true;
      }
    } catch (error) {
      console.error(`Error syncing document from server for parcel ${parcelId}:`, error);
    }
    
    return false;
  }

  /**
   * Sync a document to the server
   */
  private async syncDocumentToServer(doc: Y.Doc, parcelId: string): Promise<boolean> {
    if (!networkService.isOnline() || this.syncInProgress) {
      return false;
    }
    
    this.syncInProgress = true;
    
    try {
      // Get current state as base64
      const base64Data = Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64');
      
      // Get text content
      const yText = doc.getText('content');
      const content = yText.toString();
      
      // Send to server
      await apiService.request<any>(`/api/mobile/parcels/${parcelId}/notes`, {
        method: 'PUT',
        body: {
          yDocData: base64Data,
          content,
        },
      });
      
      // Update local note as synced
      await saveParcelNote({
        parcelId,
        content,
        yDocData: base64Data,
        isLocalOnly: false,
        syncCount: (await getNoteByParcelId(parcelId))?.syncCount + 1 || 1,
      });
      
      return true;
    } catch (error) {
      console.error(`Error syncing document to server for parcel ${parcelId}:`, error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync all documents to the server
   */
  public async syncAllDocuments(): Promise<boolean> {
    if (!networkService.isOnline() || this.syncInProgress) {
      return false;
    }
    
    this.syncInProgress = true;
    
    try {
      let success = true;
      
      // Sync all documents in memory
      for (const [parcelId, doc] of this.documents.entries()) {
        const result = await this.syncDocumentToServer(doc, parcelId);
        success = success && result;
      }
      
      return success;
    } catch (error) {
      console.error('Error syncing all documents:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Create a new text for a document if it doesn't exist
   */
  public initializeDocumentText(doc: Y.Doc, initialText: string = ''): Y.Text {
    let text = doc.getText('content');
    
    // If text is empty, initialize it
    if (text.length === 0 && initialText) {
      text.insert(0, initialText);
    }
    
    return text;
  }

  /**
   * Get text content from a document
   */
  public getTextContent(doc: Y.Doc): string {
    return doc.getText('content').toString();
  }

  /**
   * Update text content in a document
   */
  public updateTextContent(doc: Y.Doc, content: string): void {
    const text = doc.getText('content');
    text.delete(0, text.length);
    text.insert(0, content);
  }

  /**
   * Release a document when no longer needed
   */
  public releaseDocument(parcelId: string): void {
    // Save one last time
    const doc = this.documents.get(parcelId);
    if (doc) {
      // Final sync if online
      if (networkService.isOnline()) {
        this.syncDocumentToServer(doc, parcelId);
      }
      
      // Remove listeners and destroy
      doc.destroy();
      this.documents.delete(parcelId);
    }
  }

  /**
   * Check if there's a sync in progress
   */
  public isSyncing(): boolean {
    return this.syncInProgress;
  }
}

// Export singleton instance
export const syncService = SyncService.getInstance();

export default syncService;