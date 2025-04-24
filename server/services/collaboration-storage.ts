import { db } from "../db";
import { 
  collaborationSessions, 
  sessionParticipants, 
  documentVersions, 
  collaborationEvents,
  type CollaborationSession,
  type InsertCollaborationSession,
  type SessionParticipant,
  type InsertSessionParticipant,
  type DocumentVersion,
  type InsertDocumentVersion,
  type CollaborationEvent,
  type InsertCollaborationEvent,
} from "@shared/schema";
import { eq, and, or, gt, lt, lte, desc, sql } from "drizzle-orm";

/**
 * Database storage for collaboration data
 */
export class CollaborationStorage {
  /**
   * Create a new collaboration session
   */
  async createSession(data: InsertCollaborationSession): Promise<CollaborationSession> {
    try {
      const [session] = await db
        .insert(collaborationSessions)
        .values({
          ...data,
          createdAt: data.createdAt || new Date(),
          lastActivity: data.lastActivity || new Date()
        })
        .returning();
      
      return session;
    } catch (error) {
      console.error('Error creating collaboration session:', error);
      throw new Error('Failed to create collaboration session');
    }
  }

  /**
   * Get a specific collaboration session by ID
   */
  async getSession(sessionId: string): Promise<CollaborationSession | undefined> {
    try {
      const [session] = await db
        .select()
        .from(collaborationSessions)
        .where(eq(collaborationSessions.sessionId, sessionId));
      
      return session;
    } catch (error) {
      console.error('Error fetching collaboration session:', error);
      throw new Error('Failed to fetch collaboration session');
    }
  }

  /**
   * Get collaboration sessions with filtering
   */
  async getSessions(options?: {
    ownerId?: number,
    status?: string,
    documentType?: string,
    documentId?: string,
    maxAge?: number, // in hours
    limit?: number
  }): Promise<CollaborationSession[]> {
    try {
      let query = db
        .select()
        .from(collaborationSessions);
      
      // Apply filters
      const conditions = [];
      
      if (options?.ownerId) {
        conditions.push(eq(collaborationSessions.ownerId, options.ownerId));
      }
      
      if (options?.status) {
        conditions.push(eq(collaborationSessions.status, options.status));
      }
      
      if (options?.documentType) {
        conditions.push(eq(collaborationSessions.documentType, options.documentType));
      }
      
      if (options?.documentId) {
        conditions.push(eq(collaborationSessions.documentId, options.documentId));
      }
      
      if (options?.maxAge) {
        const oldestAllowed = new Date();
        oldestAllowed.setHours(oldestAllowed.getHours() - options.maxAge);
        
        conditions.push(gt(collaborationSessions.lastActivity, oldestAllowed));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Apply limit
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      // Order by last activity
      query = query.orderBy(desc(collaborationSessions.lastActivity));
      
      return await query;
    } catch (error) {
      console.error('Error fetching collaboration sessions:', error);
      throw new Error('Failed to fetch collaboration sessions');
    }
  }

  /**
   * Update an existing collaboration session
   */
  async updateSession(sessionId: string, data: Partial<CollaborationSession>): Promise<CollaborationSession | undefined> {
    try {
      // Remove readonly fields
      const updateData: any = { ...data };
      delete updateData.id;
      delete updateData.sessionId;
      delete updateData.createdAt;
      
      const [updatedSession] = await db
        .update(collaborationSessions)
        .set(updateData)
        .where(eq(collaborationSessions.sessionId, sessionId))
        .returning();
      
      return updatedSession;
    } catch (error) {
      console.error('Error updating collaboration session:', error);
      throw new Error('Failed to update collaboration session');
    }
  }

  /**
   * Update the lastActivity timestamp of a session
   */
  async updateLastActivity(sessionId: string): Promise<void> {
    try {
      await db
        .update(collaborationSessions)
        .set({ lastActivity: new Date() })
        .where(eq(collaborationSessions.sessionId, sessionId));
    } catch (error) {
      console.error('Error updating session last activity:', error);
      throw new Error('Failed to update session last activity');
    }
  }

  /**
   * Delete a collaboration session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      // First, delete all associated participants
      await db
        .delete(sessionParticipants)
        .where(eq(sessionParticipants.sessionId, sessionId));
      
      // Then, delete the session
      const result = await db
        .delete(collaborationSessions)
        .where(eq(collaborationSessions.sessionId, sessionId));
      
      return true;
    } catch (error) {
      console.error('Error deleting collaboration session:', error);
      throw new Error('Failed to delete collaboration session');
    }
  }

  // Session Participants
  
  /**
   * Add a participant to a session
   */
  async addParticipant(data: InsertSessionParticipant): Promise<SessionParticipant> {
    try {
      // Check if participant already exists
      const [existingParticipant] = await db
        .select()
        .from(sessionParticipants)
        .where(
          and(
            eq(sessionParticipants.sessionId, data.sessionId),
            eq(sessionParticipants.userId, data.userId)
          )
        );
      
      if (existingParticipant) {
        // Update the existing participant
        const [updatedParticipant] = await db
          .update(sessionParticipants)
          .set({
            isActive: data.isActive ?? true,
            lastActive: new Date(),
            color: data.color || existingParticipant.color
          })
          .where(eq(sessionParticipants.id, existingParticipant.id))
          .returning();
        
        return updatedParticipant;
      }
      
      // Create a new participant
      const [participant] = await db
        .insert(sessionParticipants)
        .values({
          ...data,
          isActive: data.isActive ?? true,
          lastActive: new Date(),
          joinedAt: new Date()
        })
        .returning();
      
      return participant;
    } catch (error) {
      console.error('Error adding session participant:', error);
      throw new Error('Failed to add participant to session');
    }
  }

  /**
   * Get a specific participant
   */
  async getParticipant(sessionId: string, userId: number): Promise<SessionParticipant | undefined> {
    try {
      const [participant] = await db
        .select()
        .from(sessionParticipants)
        .where(
          and(
            eq(sessionParticipants.sessionId, sessionId),
            eq(sessionParticipants.userId, userId)
          )
        );
      
      return participant;
    } catch (error) {
      console.error('Error fetching session participant:', error);
      throw new Error('Failed to fetch session participant');
    }
  }

  /**
   * Get all participants for a session
   */
  async getParticipants(sessionId: string, activeOnly: boolean = true): Promise<SessionParticipant[]> {
    try {
      let query = db
        .select()
        .from(sessionParticipants)
        .where(eq(sessionParticipants.sessionId, sessionId));
      
      if (activeOnly) {
        query = query.where(eq(sessionParticipants.isActive, true));
      }
      
      return await query;
    } catch (error) {
      console.error('Error fetching session participants:', error);
      throw new Error('Failed to fetch session participants');
    }
  }

  /**
   * Update a participant's information
   */
  async updateParticipant(
    sessionId: string,
    userId: number,
    data: Partial<SessionParticipant>
  ): Promise<SessionParticipant | undefined> {
    try {
      // Remove readonly fields
      const updateData: any = { ...data };
      delete updateData.id;
      delete updateData.sessionId;
      delete updateData.userId;
      delete updateData.joinedAt;
      
      // Always update lastActive
      updateData.lastActive = new Date();
      
      const [updatedParticipant] = await db
        .update(sessionParticipants)
        .set(updateData)
        .where(
          and(
            eq(sessionParticipants.sessionId, sessionId),
            eq(sessionParticipants.userId, userId)
          )
        )
        .returning();
      
      return updatedParticipant;
    } catch (error) {
      console.error('Error updating session participant:', error);
      throw new Error('Failed to update session participant');
    }
  }

  /**
   * Update a participant's cursor position
   */
  async updateCursorPosition(
    sessionId: string,
    userId: number,
    position: any,
    selection?: any
  ): Promise<SessionParticipant | undefined> {
    try {
      const [updatedParticipant] = await db
        .update(sessionParticipants)
        .set({
          cursorPosition: position,
          selection: selection || null,
          lastActive: new Date()
        })
        .where(
          and(
            eq(sessionParticipants.sessionId, sessionId),
            eq(sessionParticipants.userId, userId)
          )
        )
        .returning();
      
      return updatedParticipant;
    } catch (error) {
      console.error('Error updating cursor position:', error);
      throw new Error('Failed to update cursor position');
    }
  }

  /**
   * Update a participant's presence information
   */
  async updatePresence(
    sessionId: string,
    userId: number,
    presence: Record<string, any>
  ): Promise<SessionParticipant | undefined> {
    try {
      const [updatedParticipant] = await db
        .update(sessionParticipants)
        .set({
          presence,
          lastActive: new Date()
        })
        .where(
          and(
            eq(sessionParticipants.sessionId, sessionId),
            eq(sessionParticipants.userId, userId)
          )
        )
        .returning();
      
      return updatedParticipant;
    } catch (error) {
      console.error('Error updating presence:', error);
      throw new Error('Failed to update presence');
    }
  }

  /**
   * Remove a participant from a session
   */
  async removeParticipant(sessionId: string, userId: number): Promise<boolean> {
    try {
      // We don't actually delete participants, just mark them as inactive
      const [updatedParticipant] = await db
        .update(sessionParticipants)
        .set({
          isActive: false,
          leftAt: new Date()
        })
        .where(
          and(
            eq(sessionParticipants.sessionId, sessionId),
            eq(sessionParticipants.userId, userId)
          )
        )
        .returning();
      
      return !!updatedParticipant;
    } catch (error) {
      console.error('Error removing session participant:', error);
      throw new Error('Failed to remove participant from session');
    }
  }

  // Document Versions
  
  /**
   * Save a new document version
   */
  async saveDocumentVersion(data: InsertDocumentVersion): Promise<DocumentVersion> {
    try {
      const [version] = await db
        .insert(documentVersions)
        .values({
          ...data,
          createdAt: new Date()
        })
        .returning();
      
      return version;
    } catch (error) {
      console.error('Error saving document version:', error);
      throw new Error('Failed to save document version');
    }
  }

  /**
   * Get the latest document version
   */
  async getLatestDocumentVersion(
    documentType: string,
    documentId: string
  ): Promise<DocumentVersion | undefined> {
    try {
      const [version] = await db
        .select()
        .from(documentVersions)
        .where(
          and(
            eq(documentVersions.documentType, documentType),
            eq(documentVersions.documentId, documentId)
          )
        )
        .orderBy(desc(documentVersions.version))
        .limit(1);
      
      return version;
    } catch (error) {
      console.error('Error fetching latest document version:', error);
      throw new Error('Failed to fetch latest document version');
    }
  }

  /**
   * Get all versions of a document
   */
  async getDocumentVersions(
    documentType: string,
    documentId: string,
    limit: number = 10
  ): Promise<DocumentVersion[]> {
    try {
      const versions = await db
        .select()
        .from(documentVersions)
        .where(
          and(
            eq(documentVersions.documentType, documentType),
            eq(documentVersions.documentId, documentId)
          )
        )
        .orderBy(desc(documentVersions.version))
        .limit(limit);
      
      return versions;
    } catch (error) {
      console.error('Error fetching document versions:', error);
      throw new Error('Failed to fetch document versions');
    }
  }

  // Collaboration Events
  
  /**
   * Record a collaboration event
   */
  async recordEvent(data: InsertCollaborationEvent): Promise<CollaborationEvent> {
    try {
      const [event] = await db
        .insert(collaborationEvents)
        .values({
          ...data,
          timestamp: new Date()
        })
        .returning();
      
      return event;
    } catch (error) {
      console.error('Error recording collaboration event:', error);
      throw new Error('Failed to record collaboration event');
    }
  }

  /**
   * Get all events for a session with optional filtering
   */
  async getSessionEvents(
    sessionId: string,
    options?: {
      eventType?: string;
      userId?: number;
      clientId?: string;
      startTime?: Date;
      endTime?: Date;
      limit?: number;
    }
  ): Promise<CollaborationEvent[]> {
    try {
      let query = db
        .select()
        .from(collaborationEvents)
        .where(eq(collaborationEvents.sessionId, sessionId));
      
      const conditions = [eq(collaborationEvents.sessionId, sessionId)];
      
      if (options?.eventType) {
        conditions.push(eq(collaborationEvents.eventType, options.eventType));
      }
      
      if (options?.userId) {
        conditions.push(eq(collaborationEvents.userId, options.userId));
      }
      
      if (options?.clientId) {
        conditions.push(eq(collaborationEvents.clientId, options.clientId));
      }
      
      if (options?.startTime) {
        conditions.push(gt(collaborationEvents.timestamp, options.startTime));
      }
      
      if (options?.endTime) {
        conditions.push(lt(collaborationEvents.timestamp, options.endTime));
      }
      
      query = query.where(and(...conditions));
      
      // Apply order and limit
      query = query.orderBy(desc(collaborationEvents.timestamp));
      
      if (options?.limit) {
        query = query.limit(options.limit);
      } else {
        query = query.limit(100); // Default limit
      }
      
      return await query;
    } catch (error) {
      console.error('Error fetching session events:', error);
      throw new Error('Failed to fetch session events');
    }
  }

  /**
   * Cleanup tasks
   */
  
  /**
   * Archive or remove inactive sessions older than the specified age in days
   */
  async cleanupInactiveSessions(ageInDays: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - ageInDays);
      
      // First, we'll just mark them as archived
      const result = await db
        .update(collaborationSessions)
        .set({ status: 'archived' })
        .where(
          and(
            lte(collaborationSessions.lastActivity, cutoffDate),
            eq(collaborationSessions.status, 'active')
          )
        );
      
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error cleaning up inactive sessions:', error);
      throw new Error('Failed to clean up inactive sessions');
    }
  }

  /**
   * Purge old events that are older than the specified age in days
   */
  async purgeOldEvents(ageInDays: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - ageInDays);
      
      const result = await db
        .delete(collaborationEvents)
        .where(lte(collaborationEvents.timestamp, cutoffDate));
      
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error purging old events:', error);
      throw new Error('Failed to purge old events');
    }
  }
}

// Create and export an instance for use across the app
export const collaborationStorage = new CollaborationStorage();