import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  avatar?: string;
  preferences?: any;
}

export interface SessionData {
  user: User | null;
  //token: string | null;
  //refreshToken: string | null;
  isAuthenticated: boolean;
  loginTime: Date | null;
  lastActivity: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class SessionState {
  private readonly SESSION_KEY = 'task-manager';
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000;

  private sessionSubject = new BehaviorSubject<SessionData>(this.getInitialState());
  public session$ = this.sessionSubject.asObservable();
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      //this.initializeSessionTimeout();
      this.loadSessionFromStorage();
    }
  }

  private getInitialState(): SessionData {
    return {
      user: null,
      //token: null,
      //refreshToken: null,
      isAuthenticated: false,
      loginTime: null,
      lastActivity: null
    };
  }

  get currentSession(): SessionData {
    return this.sessionSubject.value;
  }

  get currentUser(): User | null {
    return this.currentSession.user;
  }

  //   get isAuthenticated(): boolean {
  //     return this.currentSession.isAuthenticated && !!this.currentSession.token;
  //   }

  get userEmail(): string | null {
    return this.currentUser?.email || null;
  }

  setSession(user: User): void {
    const now = new Date();
    const sessionData: SessionData = {
      user,
      //token,
      //refreshToken: refreshToken || null,
      isAuthenticated: true,
      loginTime: now,
      lastActivity: now
    };

    this.updateSession(sessionData);
    this.saveSessionToStorage();
  }

  updateUser(user: Partial<User>): void {
    const currentSession = this.currentSession;
    if (currentSession.user) {
      const updatedUser = { ...currentSession.user, ...user };
      this.updateSession({
        ...currentSession,
        user: updatedUser,
        lastActivity: new Date()
      });
      //this.saveSessionToStorage();
    }
  }

  updateToken(token: string, refreshToken?: string): void {
    const currentSession = this.currentSession;
    this.updateSession({
      ...currentSession,
      //token,
      //refreshToken: refreshToken || currentSession.refreshToken,
      lastActivity: new Date()
    });
    //this.saveSessionToStorage();
  }

  updateActivity(): void {
    const currentSession = this.currentSession;
    if (currentSession.isAuthenticated) {
      this.updateSession({
        ...currentSession,
        lastActivity: new Date()
      });
      this.saveSessionToStorage();
    }
  }

  clearSession(): void {
    this.updateSession(this.getInitialState());
    this.removeSessionFromStorage();
  }

  isSessionExpired(): boolean {
    const { lastActivity } = this.currentSession;
    if (!lastActivity) return true;

    const now = new Date().getTime();
    const lastActivityTime = new Date(lastActivity).getTime();
    return (now - lastActivityTime) > this.SESSION_TIMEOUT;
  }

  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const userRole = this.currentUser?.role;
    return userRole ? roles.includes(userRole) : false;
  }

  getSessionTimeRemaining(): number {
    const { lastActivity } = this.currentSession;
    if (!lastActivity) return 0;

    const now = new Date().getTime();
    const lastActivityTime = new Date(lastActivity).getTime();
    const elapsed = now - lastActivityTime;
    const remaining = this.SESSION_TIMEOUT - elapsed;

    return Math.max(0, Math.floor(remaining / (1000 * 60))); // en minutos
  }

  private updateSession(sessionData: SessionData): void {
    this.sessionSubject.next(sessionData);
  }

  private saveSessionToStorage(): void {
    if (!this.isBrowser) return;
    try {
      const sessionData = this.currentSession;
      console.log("GUARDAR LS: ", sessionData)
      // Crear objeto limpio sin referencias circulares
      const cleanData = {
        user: sessionData.user ? {
          id: sessionData.user.id,
          email: sessionData.user.email,
          name: sessionData.user.name,
          role: sessionData.user.role,
          avatar: sessionData.user.avatar
        } : null,
        isAuthenticated: sessionData.isAuthenticated,
        loginTime: sessionData.loginTime ? sessionData.loginTime.toISOString() : null,
lastActivity: sessionData.lastActivity ? sessionData.lastActivity.toISOString() : null
      };

      const existingData = localStorage.getItem(this.SESSION_KEY);
      const newDataString = JSON.stringify(cleanData);
      console.log("ANTES: ", existingData);
      console.log("DESPUES: ", newDataString);

      if (existingData !== newDataString) {
        console.log("DIFERENTE");
        localStorage.setItem(this.SESSION_KEY, newDataString);
      }

    } catch (error) {
      console.warn('No se pudo guardar la sesión en localStorage:', error);
    }
  }

  private loadSessionFromStorage(): void {
    if (!this.isBrowser) return;
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (stored) {
        const parsedData = JSON.parse(stored);

        if (parsedData.lastActivity) {
          const lastActivity = new Date(parsedData.lastActivity).getTime();
          const now = new Date().getTime();

          if ((now - lastActivity) > this.SESSION_TIMEOUT) {
            this.removeSessionFromStorage();
            return;
          }
        }

        this.updateSession({
          ...this.getInitialState(),
          user: parsedData.user,
          isAuthenticated: false, // Requerirá reautenticación para obtener token
          loginTime: parsedData.loginTime ? new Date(parsedData.loginTime) : null,
          lastActivity: parsedData.lastActivity ? new Date(parsedData.lastActivity) : null
        });
      }
    } catch (error) {
      console.warn('Error al cargar la sesión desde localStorage:', error);
      this.removeSessionFromStorage();
    }
  }

  private removeSessionFromStorage(): void {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      console.warn('Error al eliminar la sesión de localStorage:', error);
    }
  }

  // private initializeSessionTimeout(): void {
  //   setInterval(() => {
  //     if (this.isAuthenticated && this.isSessionExpired()) {
  //       console.log('Sesión expirada por inactividad');
  //       this.clearSession();
  //     }
  //   }, 60000);
  // }

  // Método para debug (solo en desarrollo)
  getSessionInfo(): any {
    return {
      ...this.currentSession,
      timeRemaining: this.getSessionTimeRemaining(),
      isExpired: this.isSessionExpired(),
      isBrowser: this.isBrowser
    };
  }
}