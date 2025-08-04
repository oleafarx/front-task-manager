import { BehaviorSubject } from 'rxjs';
import { User } from '../../models/user.model';
import { SessionData } from '../../models/session.model';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionState {
    private sessionSubject = new BehaviorSubject<SessionData>(this.getInitialState());
    public session = this.sessionSubject.asObservable();
    
    private getInitialState(): SessionData {
        return {
            user: null,
        };
    }

    setSession(user: User): void {
        const sessionData: SessionData = {
            user
        }

        this.sessionSubject.next(sessionData);
    }

    get currentSession(): SessionData {
        return this.sessionSubject.value;
    }

    clearSession(): void {
       this.sessionSubject.next(this.getInitialState());
    }
}
