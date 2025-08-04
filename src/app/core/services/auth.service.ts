import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { User } from '../../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private url = environment.apiUrl;

    constructor(
        private http: HttpClient
    ) {}

    getUserByEmail(email: string): Observable<User> {
        const apiUrl = `${this.url}/users/${email}`;
        return this.http.get<User>(apiUrl).pipe(
            catchError(error => {
                if (error.status === 404) {
                    console.error('User not found:', email);
                    return throwError(() => new Error('User not found'));
                }
                return throwError(() => new Error('An error occurred while fetching user'));
            })
        )
    }

    createUser(user: User): Observable<User> {
        const apiUrl = `${this.url}/users`;
        return this.http.post<User>(apiUrl, user);
    }
}