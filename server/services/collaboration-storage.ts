import { 
  CollaborationSession, 
  CollaborationEvent,
  DocumentVersion,
  SessionParticipant,
  InsertCollaborationSession,
  InsertCollaborationEvent,
  InsertDocumentVersion,
  InsertSessionParticipant,
  collaborationSessions,
  collaborationEvents,
  documentVersions,
  sessionParticipants
} from '@shared/schema';
import { db } from '../db';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

/**
 * Database storage for collaboration data
 */
export class CollaborationStorage {
  // Session management
  async createSession(data: InsertCollaborationSession): Promise<CollaborationSession> {
    // Generate a session ID if not provided
    const sessionData = {
      ...data,
      sessionId: data.sessionId || uuid()
    };
    
    const [session] = await db
      .insert(collaborationSessions)
      .values(sessionData)
      .returning();
    
    return session;
  }
  
  async getSession(sessionId: string): Promise<CollaborationSession | undefined> {
    const [session] = await db
      .select()
      .from(collaborationSessions)
      .where(eq(collaborationSessions.sessionId, sessionId));
    
    return session;
  }
  
  async getSessions(options?: {
    ownerId?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<CollaborationSession[]> {
    let query = db
      .select()
      .from(collaborationSessions)
      .orderBy(desc(collaborationSessions.lastActivity));
    
    if (options?.ownerId) {
      query = query.where(eq(collaborationSessions.ownerId, options.ownerId));
    }
    
    if (options?.status) {
      query = query.where(eq(collaborationSessions.status, options.status));
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }
  
  async updateSession(sessionId: string, data: Partial<CollaborationSession>): Promise<CollaborationSession | undefined> {
    const [session] = await db
      .update(collaborationSessions)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(collaborationSessions.sessionId, sessionId))
      .returning();
    
    return session;
  }
  
  async updateLastActivity(sessionId: string): Promise<void> {
    await db
      .update(collaborationSessions)
      .set({
        lastActivity: new Date(),
        updatedAt: new Date()
      })
      .where(eq(collaborationSessions.sessionId, sessionId));
  }
  
  async deleteSession(sessionId: string): Promise<boolean> {
    const result = await db
      .delete(collaborationSessions)
      .where(eq(collaborationSessions.sessionId, sessionId));
    
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  // Participants management
  async addParticipant(data: InsertSessionParticipant): Promise<SessionParticipant> {
    // First check if participant already exists
    const existingParticipant = await this.getParticipant(data.sessionId, data.userId);
    
    if (existingParticipant) {
      // If participant exists but was marked as inactive, reactivate them
      if (!existingParticipant.isActive) {
        const [participant] = await db
          .update(sessionParticipants)
          .set({
            isActive: true,
            leftAt: null,
            lastActivity: new Date(),
            cursorPosition: data.cursorPosition,
            selection: data.selection,
            color: data.color || existingParticipant.color,
            presence: data.presence
          })
          .where(
            and(
              eq(sessionParticipants.sessionId, data.sessionId),
              eq(sessionParticipants.userId, data.userId)
            )
          )
          .returning();
        
        return participant;
      }
      
      // Otherwise, just return the existing participant
      return existingParticipant;
    }
    
    // Create a new participant
    const [participant] = await db
      .insert(sessionParticipants)
      .values(data)
      .returning();
    
    return participant;
  }
  
  async getParticipant(sessionId: string, userId: number): Promise<SessionParticipant | undefined> {
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
  }
  
  async getParticipants(sessionId: string, activeOnly: boolean = true): Promise<SessionParticipant[]> {
    let query = db
      .select()
      .from(sessionParticipants)
      .where(eq(sessionParticipants.sessionId, sessionId));
    
    if (activeOnly) {
      query = query.where(eq(sessionParticipants.isActive, true));
    }
    
    return await query;
  }
  
  async updateParticipant(
    sessionId: string, 
    userId: number, 
    data: Partial<SessionParticipant>
  ): Promise<SessionParticipant | undefined> {
    const [participant] = await db
      .update(sessionParticipants)
      .set({
        ...data,
        lastActivity: new Date()
      })
      .where(
        and(
          eq(sessionParticipants.sessionId, sessionId),
          eq(sessionParticipants.userId, userId)
        )
      )
      .returning();
    
    return participant;
  }
  
  async updateCursorPosition(
    sessionId: string,
    userId: number,
    cursorPosition: any,
    selection?: any
  ): Promise<void> {
    await db
      .update(sessionParticipants)
      .set({
        cursorPosition,
        selection,
        lastActivity: new Date()
      })
      .where(
        and(
          eq(sessionParticipants.sessionId, sessionId),
          eq(sessionParticipants.userId, userId)
        )
      );
  }
  
  async updatePresence(
    sessionId: string,
    userId: number,
    presence: any
  ): Promise<void> {
    await db
      .update(sessionParticipants)
      .set({
        presence,
        lastActivity: new Date()
      })
      .where(
        and(
          eq(sessionParticipants.sessionId, sessionId),
          eq(sessionParticipants.userId, userId)
        )
      );
  }
  
  async removeParticipant(sessionId: string, userId: number): Promise<boolean> {
    // Mark participant as inactive rather than deleting
    const result = await db
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
      );
    
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  // Document version management
  async saveDocumentVersion(data: InsertDocumentVersion): Promise<DocumentVersion> {
    const [version] = await db
      .insert(documentVersions)
      .values(data)
      .returning();
    
    return version;
  }
  
  async getLatestDocumentVersion(
    documentType: string,
    documentId: string
  ): Promise<DocumentVersion | undefined> {
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
  }
  
  async getDocumentVersions(
    documentType: string,
    documentId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<DocumentVersion[]> {
    let query = db
      .select()
      .from(documentVersions)
      .where(
        and(
          eq(documentVersions.documentType, documentType),
          eq(documentVersions.documentId, documentId)
        )
      )
      .orderBy(desc(documentVersions.version));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }
  
  // Event management
  async recordEvent(data: InsertCollaborationEvent): Promise<CollaborationEvent> {
    const [event] = await db
      .insert(collaborationEvents)
      .values(data)
      .returning();
    
    return event;
  }
  
  async getSessionEvents(
    sessionId: string,
    options?: {
      eventTypes?: string[];
      startTime?: Date;
      endTime?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<CollaborationEvent[]> {
    let query = db
      .select()
      .from(collaborationEvents)
      .where(eq(collaborationEvents.sessionId, sessionId))
      .orderBy(desc(collaborationEvents.timestamp));
    
    if (options?.eventTypes && options.eventTypes.length > 0) {
      // This is a simplification - in a real implementation you would need a more complex query
      // to handle an array of event types
      // For this example, we'll just use the first event type
      query = query.where(eq(collaborationEvents.eventType, options.eventTypes[0]));
    }
    
    if (options?.startTime) {
      query = query.where(gte(collaborationEvents.timestamp, options.startTime));
    }
    
    if (options?.endTime) {
      query = query.where(lte(collaborationEvents.timestamp, options.endTime));
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }
  
  // Cleanup methods
  async cleanupInactiveSessions(ageInDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ageInDays);
    
    const result = await db
      .update(collaborationSessions)
      .set({
        status: 'archived'
      })
      .where(
        and(
          eq(collaborationSessions.status, 'active'),
          lte(collaborationSessions.lastActivity, cutoffDate)
        )
      );
    
    return result.rowCount || 0;
  }
  
  async purgeOldEvents(ageInDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ageInDays);
    
    const result = await db
      .delete(collaborationEvents)
      .where(lte(collaborationEvents.timestamp, cutoffDate));
    
    return result.rowCount || 0;
  }
}

// Export a singleton instance
export const collaborationStorage = new CollaborationStorage();