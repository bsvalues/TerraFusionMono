import { NotificationType } from './types';

export interface Notification {
  id: string;
  type: NotificationType;
  userId: number;
  title: string;
  message: string;
  resourceId?: string;
  resourceType?: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, any>;
}

/**
 * Service to manage notifications in the TerraField Mobile app
 */
export class NotificationService {
  private static instance: NotificationService;
  private websocket: WebSocket | null = null;
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private isConnected: boolean = false;
  private userId: number | null = null;
  private reconnectTimer: any = null;
  private apiUrl: string;
  
  private constructor() {
    this.apiUrl = 'https://appraisalcore.replit.app';
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  /**
   * Connect to the notification server for a user
   */
  public connect(userId: number): void {
    this.userId = userId;
    
    if (this.websocket) {
      this.disconnect();
    }
    
    const wsUrl = `${this.apiUrl.replace('http', 'ws')}/notifications`;
    this.websocket = new WebSocket(wsUrl);
    
    this.websocket.onopen = () => {
      console.log('Notification WebSocket connected');
      this.isConnected = true;
      
      // Register this connection with user ID
      if (this.websocket && this.userId) {
        this.websocket.send(JSON.stringify({
          type: 'register',
          userId: this.userId
        }));
      }
      
      // Clear any reconnect timers
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };
    
    this.websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'notification':
            // Single new notification
            this.addNotification(data.notification);
            break;
            
          case 'initial_notifications':
            // Batch of notifications on connection
            this.notifications = data.notifications;
            this.notifyListeners();
            break;
            
          case 'notification_updated':
            // A notification was updated (e.g. marked as read)
            this.updateNotification(data.notification);
            break;
            
          case 'notifications_cleared':
            // All notifications were cleared
            this.notifications = [];
            this.notifyListeners();
            break;
        }
      } catch (error) {
        console.error('Error processing notification message:', error);
      }
    };
    
    this.websocket.onclose = () => {
      console.log('Notification WebSocket disconnected');
      this.isConnected = false;
      
      // Attempt to reconnect after a delay
      this.reconnectTimer = setTimeout(() => {
        if (this.userId) {
          this.connect(this.userId);
        }
      }, 5000);
    };
    
    this.websocket.onerror = (error) => {
      console.error('Notification WebSocket error:', error);
    };
    
    // Also fetch existing notifications via API
    this.fetchNotifications();
  }
  
  /**
   * Disconnect from the notification server
   */
  public disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    this.isConnected = false;
    this.userId = null;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  /**
   * Get all notifications
   */
  public getNotifications(): Notification[] {
    return [...this.notifications];
  }
  
  /**
   * Subscribe to notification updates
   */
  public subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately call with current notifications
    listener([...this.notifications]);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Mark a notification as read
   */
  public async markAsRead(notificationId: string): Promise<boolean> {
    if (!this.userId) {
      return false;
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: this.userId })
      });
      
      if (response.ok) {
        // The server will notify us via WebSocket, but we'll update locally too for immediate feedback
        this.updateNotification({ id: notificationId, read: true });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
  
  /**
   * Clear all notifications
   */
  public async clearNotifications(): Promise<boolean> {
    if (!this.userId) {
      return false;
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/api/notifications/clear?userId=${this.userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // The server will notify us via WebSocket, but we'll update locally too for immediate feedback
        this.notifications = [];
        this.notifyListeners();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }
  }
  
  /**
   * Fetch notifications from the API
   */
  private async fetchNotifications(): Promise<void> {
    if (!this.userId) {
      return;
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/api/notifications?userId=${this.userId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.notifications) {
          this.notifications = data.notifications;
          this.notifyListeners();
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }
  
  /**
   * Add a new notification
   */
  private addNotification(notification: Notification): void {
    // Convert string timestamp to Date if needed
    if (typeof notification.timestamp === 'string') {
      notification.timestamp = new Date(notification.timestamp);
    }
    
    this.notifications.unshift(notification);
    this.notifyListeners();
  }
  
  /**
   * Update an existing notification
   */
  private updateNotification(updatedNotification: Partial<Notification> & { id: string }): void {
    const index = this.notifications.findIndex(n => n.id === updatedNotification.id);
    
    if (index !== -1) {
      this.notifications[index] = {
        ...this.notifications[index],
        ...updatedNotification
      };
      
      this.notifyListeners();
    }
  }
  
  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    const notificationsCopy = [...this.notifications];
    
    for (const listener of this.listeners) {
      listener(notificationsCopy);
    }
  }
}