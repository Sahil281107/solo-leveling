// lib/sessionManager.ts
// This utility helps manage user sessions and handle authentication issues

import Cookies from 'js-cookie';
import api from './api';

interface SessionValidationResult {
  isValid: boolean;
  needsRefresh: boolean;
  errorCode?: string;
}

class SessionManager {
  private static instance: SessionManager;
  private validationCache: { [key: string]: { timestamp: number; isValid: boolean } } = {};
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Validates the current session
   */
  async validateSession(): Promise<SessionValidationResult> {
    const token = Cookies.get('token');
    
    if (!token) {
      return { isValid: false, needsRefresh: true, errorCode: 'NO_TOKEN' };
    }

    // Check cache first
    const cacheKey = token.substring(0, 20); // Use part of token as cache key
    const cached = this.validationCache[cacheKey];
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return { isValid: cached.isValid, needsRefresh: !cached.isValid };
    }

    try {
      const response = await api.get('/auth/health');
      
      // Cache successful validation
      this.validationCache[cacheKey] = {
        timestamp: Date.now(),
        isValid: true
      };
      
      return { isValid: true, needsRefresh: false };
      
    } catch (error: any) {
      // Cache failed validation
      this.validationCache[cacheKey] = {
        timestamp: Date.now(),
        isValid: false
      };
      
      const errorCode = error.response?.data?.code || 'UNKNOWN_ERROR';
      return { 
        isValid: false, 
        needsRefresh: true, 
        errorCode 
      };
    }
  }

  /**
   * Clears all authentication data
   */
  clearAuthData(): void {
    Cookies.remove('token');
    Cookies.remove('user');
    Cookies.remove('profile');
    this.clearCache();
  }

  /**
   * Clears the validation cache
   */
  clearCache(): void {
    this.validationCache = {};
  }

  /**
   * Redirects to login with appropriate query parameters
   */
  redirectToLogin(reason?: string): void {
    this.clearAuthData();
    
    const loginUrl = reason ? `/login?reason=${reason}` : '/login';
    
    // Prevent redirect loops
    if (!window.location.pathname.includes('/login')) {
      window.location.href = loginUrl;
    }
  }

  /**
   * Checks if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = Cookies.get('token');
    const user = Cookies.get('user');
    return !!(token && user);
  }

  /**
   * Gets the current user data
   */
  getCurrentUser(): any {
    const userCookie = Cookies.get('user');
    try {
      return userCookie ? JSON.parse(userCookie) : null;
    } catch {
      return null;
    }
  }

  /**
   * Validates session before making important API calls
   */
  async ensureValidSession(): Promise<boolean> {
    const validation = await this.validateSession();
    
    if (!validation.isValid) {
      if (validation.errorCode === 'TOKEN_EXPIRED' || 
          validation.errorCode === 'SESSION_EXPIRED') {
        this.redirectToLogin('expired');
      } else if (validation.errorCode === 'ACCOUNT_INACTIVE') {
        this.redirectToLogin('inactive');
      } else {
        this.redirectToLogin('invalid');
      }
      return false;
    }
    
    return true;
  }

  /**
   * Setup automatic session validation
   */
  startSessionMonitoring(): void {
    // Validate session every 5 minutes
    const intervalId = setInterval(async () => {
      if (this.isAuthenticated()) {
        const validation = await this.validateSession();
        if (!validation.isValid) {
          console.warn('Session validation failed during monitoring');
        }
      }
    }, 5 * 60 * 1000);

    // Validate when page becomes visible
    const handleVisibilityChange = async () => {
      if (!document.hidden && this.isAuthenticated()) {
        await this.validateSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Store cleanup function
    (window as any).__sessionCleanup = () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }

  /**
   * Stop session monitoring
   */
  stopSessionMonitoring(): void {
    if ((window as any).__sessionCleanup) {
      (window as any).__sessionCleanup();
      delete (window as any).__sessionCleanup;
    }
  }
}

export const sessionManager = SessionManager.getInstance();

// Hook for React components
export const useSessionValidation = () => {
  const validateAndEnsure = async (): Promise<boolean> => {
    return await sessionManager.ensureValidSession();
  };

  const isAuthenticated = (): boolean => {
    return sessionManager.isAuthenticated();
  };

  const getCurrentUser = () => {
    return sessionManager.getCurrentUser();
  };

  const logout = () => {
    sessionManager.clearAuthData();
    sessionManager.redirectToLogin('logout');
  };

  return {
    validateAndEnsure,
    isAuthenticated,
    getCurrentUser,
    logout
  };
};

export default sessionManager;