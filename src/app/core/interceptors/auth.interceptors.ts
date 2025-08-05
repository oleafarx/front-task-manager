import { inject, Injectable } from '@angular/core';
import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpErrorResponse,
    HttpHandlerFn,
    HttpInterceptorFn
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { TokenService } from '../services/auth.service';
import { SessionState } from '../states/sessionState';
import { Router } from '@angular/router';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const tokenService = inject(TokenService);
    const sessionState = inject(SessionState);
    const router = inject(Router);

    const authReq = addTokenToRequest(req, sessionState);

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && !isAuthRequest(req)) {
                return handle401Error(authReq, next, tokenService, sessionState, router);
            }
            return throwError(() => error);
        })
    );
};

function addTokenToRequest(req: HttpRequest<unknown>, sessionState: SessionState): HttpRequest<unknown> {
    const token = sessionState.currentSession.token;

    if (token && !isAuthRequest(req)) {
        return req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return req;
}

function isAuthRequest(req: HttpRequest<unknown>): boolean {
    return req.url.includes('/users');
}

function handle401Error(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
    tokenService: TokenService,
    sessionState: SessionState,
    router: Router
): Observable<HttpEvent<unknown>> {
    if (!isRefreshing) {
        isRefreshing = true;
        const refreshToken = sessionState.currentSession.refreshToken;

        return tokenService.refreshAccessToken(refreshToken).pipe(
            switchMap((tokenResponse) => {
                isRefreshing = false;

                updateSessionWithNewToken(tokenResponse, sessionState);

                return next(addTokenToRequest(req, sessionState));
            }),
            catchError((error) => {
                isRefreshing = false;
                handleAuthFailure(sessionState, router);
                return throwError(() => error);
            })
        );
    }
    return next(addTokenToRequest(req, sessionState));
}

function updateSessionWithNewToken(tokenResponse: any, sessionState: SessionState): void {
    const currentSession = sessionState.currentSession;
    if (currentSession.isAuthenticated) {
        sessionState.setSession({
            ...currentSession,
            token: tokenResponse.accessToken,
        });
    }
}

function handleAuthFailure(sessionState: SessionState, router: Router): void {
    console.log('Auth failure - clearing session and redirecting to login');
    sessionState.clearSession();
    router.navigate(['/login']);
}