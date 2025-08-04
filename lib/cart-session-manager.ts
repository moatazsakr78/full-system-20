// Centralized cart session manager
let globalSessionId: string | null = null;
const STORAGE_KEY = 'cart_session_id';

export class CartSessionManager {
  // Get the global session ID, ensuring consistency across all components
  static getSessionId(): string {
    if (typeof window === 'undefined') return '';
    
    // If we already have a global session ID, return it
    if (globalSessionId) {
      return globalSessionId;
    }
    
    // Try to get from sessionStorage first
    try {
      const storedSessionId = sessionStorage.getItem(STORAGE_KEY);
      if (storedSessionId) {
        globalSessionId = storedSessionId;
        return globalSessionId;
      }
    } catch (error) {
      console.warn('SessionStorage not available:', error);
    }
    
    // Generate new session ID if none exists
    globalSessionId = this.generateSessionId();
    
    // Save to sessionStorage
    this.saveToStorage(globalSessionId);
    
    console.log('🔑 New cart session created:', globalSessionId);
    return globalSessionId;
  }
  
  // Generate unique session ID
  private static generateSessionId(): string {
    return `cart_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
  
  // Save session ID to storage
  private static saveToStorage(sessionId: string): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, sessionId);
    } catch (error) {
      console.warn('Could not save session ID to sessionStorage:', error);
    }
  }
  
  // Force refresh session ID (for testing or when needed)
  static refreshSession(): string {
    globalSessionId = this.generateSessionId();
    this.saveToStorage(globalSessionId);
    console.log('🔄 Cart session refreshed:', globalSessionId);
    return globalSessionId;
  }
  
  // Clear session (for logout or testing)
  static clearSession(): void {
    globalSessionId = null;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Could not clear session from sessionStorage:', error);
    }
    console.log('🗑️ Cart session cleared');
  }
  
  // Check if current session is active
  static hasActiveSession(): boolean {
    return globalSessionId !== null;
  }
  
  // Get session info for debugging
  static getSessionInfo() {
    return {
      globalSessionId,
      storageSessionId: typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY) : null,
      hasActiveSession: this.hasActiveSession()
    };
  }
}