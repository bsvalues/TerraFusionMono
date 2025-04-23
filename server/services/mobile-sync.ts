import { eq } from 'drizzle-orm';
import { storage } from '../storage';
import { parcelNotes } from '../../shared/schema';
import * as Y from 'yjs';

// This would normally be in a shared package, but we're simplifying for this example
function applyEncodedUpdate(doc: Y.Doc, base64Update: string): void {
  const update = Buffer.from(base64Update, 'base64');
  Y.applyUpdate(doc, update);
}

function encodeDocUpdate(doc: Y.Doc): string {
  const update = Y.encodeStateAsUpdate(doc);
  return Buffer.from(update).toString('base64');
}

/**
 * Service for handling mobile synchronization
 */
class MobileSyncService {
  /**
   * Synchronize a parcel note with the server
   * 
   * @param parcelId The ID of the parcel
   * @param update Base64 encoded Y.Doc update
   * @param userId User performing the sync
   * @returns The merged document state
   */
  async syncParcelNote(parcelId: string, update: string, userId: number) {
    try {
      // Create a new Yjs document
      const doc = new Y.Doc();
      
      // Set up text type for notes
      const yText = doc.getText('notes');
      
      // Get existing document from database if available
      const existingNote = await storage.getParcelNoteByParcelId(parcelId);
      
      if (existingNote) {
        // Apply existing state to document if available
        if (existingNote.yDocData) {
          applyEncodedUpdate(doc, existingNote.yDocData);
        }
        
        // Apply client update to document (merges automatically with CRDT)
        applyEncodedUpdate(doc, update);
        
        // Encode the merged result
        const mergedUpdate = encodeDocUpdate(doc);
        
        // Extract plain text content from the document
        const textContent = yText.toString();
        
        // Save to database
        await storage.updateParcelNote(existingNote.id, {
          yDocData: mergedUpdate,
          content: textContent,
          userId,
          syncCount: (existingNote.syncCount || 0) + 1,
          updatedAt: new Date()
        });
        
        return {
          update: mergedUpdate,
          timestamp: new Date().toISOString()
        };
      } else {
        // This is a new document, apply the update directly
        applyEncodedUpdate(doc, update);
        
        // Encode the result
        const encodedUpdate = encodeDocUpdate(doc);
        
        // Extract plain text content from the document
        const textContent = yText.toString();
        
        // Save to database
        await storage.createParcelNote({
          parcelId,
          yDocData: encodedUpdate,
          content: textContent,
          userId,
          syncCount: 1
        });
        
        return {
          update: encodedUpdate,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error(`Error syncing parcel note ${parcelId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get a parcel note by ID
   * 
   * @param parcelId The ID of the parcel
   * @returns The parcel note or null if not found
   */
  async getParcelNote(parcelId: string) {
    return storage.getParcelNoteByParcelId(parcelId);
  }
}

export const mobileSyncService = new MobileSyncService();