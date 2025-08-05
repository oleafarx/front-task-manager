import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, filter, Observable, throwError } from 'rxjs';
import { User } from '../../interfaces/user.interface';

@Injectable({ providedIn: 'root' })
export class UserService {
    private url = environment.apiUrl;

    constructor(
        private http: HttpClient
    ) {}

    getUserByEmail(email: string): Observable<any> {
        const apiUrl = `${this.url}/users/${email}`;
        return this.http.get<any>(apiUrl).pipe(
            catchError(error => {
                if (error.status === 404) {
                    console.error('User not found:', email);
                    return throwError(() => new Error('User not found'));
                }
                return throwError(() => new Error('An error occurred while fetching user'));
            })
        )
    }

    createUser(email: string): Observable<any> {
        const user: Partial<User> = {
            email: email,
            createdAt: new Date()
        }
        const apiUrl = `${this.url}/users`;
        return this.http.post<any>(apiUrl, user).pipe(
            filter(resp => resp.data)
        );
    }
}