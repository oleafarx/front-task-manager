import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TokenPayload } from '../../interfaces/tokens.interface';
import { catchError, filter, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TokenService {
    private url = environment.apiUrl;

    constructor(private http: HttpClient) { }

    private decodeToken(token: string): TokenPayload | null {
        try {
            const payload = token.split('.')[1];
            const decoded = atob(payload);
            return JSON.parse(decoded);
        } catch (error) {
            console.error('Error decodificando token:', error);
            return null;
        }
    }

    isTokenExpired(token: string): boolean {
        const payload = this.decodeToken(token);
        if (!payload) return true;
        const currentTime = Math.floor(Date.now() / 1000);
        const bufferTime = 5 * 60; // 5 minutos en segundos

        return payload.exp < (currentTime + bufferTime);
    }

    refreshAccessToken(refreshToken: string | null): Observable<any> {
        const apiUrl = `${this.url}/token/refresh`;
        return this.http.post<any>(apiUrl, {refreshToken}).pipe(
            filter(resp => resp.data),
            catchError(error => {
                console.error('Error in refresh token:', error);
                return throwError(() => new Error('An error occurred while refreshing the token'));
            })
        )
    }
}