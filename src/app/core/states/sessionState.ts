import { BehaviorSubject } from 'rxjs';
import { SessionData } from '../../interfaces/session.interface';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionState {
    private sessionSubject = new BehaviorSubject<SessionData>(this.getInitialState());
    public session$ = this.sessionSubject.asObservable();
    
    private getInitialState(): SessionData {
        return {
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false
        };
    }

    setSession(session: SessionData): void {
        this.sessionSubject.next(session);
    }

    get currentSession(): SessionData {
        return this.sessionSubject.value;
    }

    get isAuthenticated(): boolean {
        console.log("CURRENT: ", this.currentSession);
      return this.currentSession.isAuthenticated && !!this.currentSession.token;
    }

    clearSession(): void {
       this.sessionSubject.next(this.getInitialState());
    }
}
