import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { SessionState } from '../states/sessionState';
import { TokenService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {

    constructor(
        private sessionState: SessionState,
        private tokenService: TokenService,
        private router: Router
    ) { }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> | Promise<boolean> | boolean {

        if (!this.sessionState.isAuthenticated) {
            console.log('AuthGuard: Usuario no autenticado, redirigiendo al login');
            this.router.navigate(['/login']);
            return false;
        }

        const token = this.sessionState.currentSession.token;
        if (!token) {
            console.log('AuthGuard: No hay token, redirigiendo al login');
            this.clearSessionAndRedirect();
            return false;
        }

        if (this.tokenService.isTokenExpired(token)) {
            console.log('AuthGuard: Token expirado, intentando renovar...');
            const refreshToken = this.sessionState.currentSession.refreshToken;
            this.tokenService.refreshAccessToken(refreshToken).subscribe({
                next: (resp) => {
                    console.log('AuthGuard: Token renovado exitosamente');
                    const currentSession = this.sessionState.currentSession;
                    this.sessionState.setSession({
                        ...currentSession,
                        token: resp.accessToken,
                        refreshToken: resp.refreshToken
                    });
                    return true;
                },
                error: (error) => {
                    console.error('AuthGuard: Error renovando token:', error);
                    this.clearSessionAndRedirect();
                    return false;
                }
            })
        }

        return true;
    }

    // NUEVO: Método helper para limpiar sesión y redirigir
    private clearSessionAndRedirect(): void {
        this.sessionState.clearSession();
        this.router.navigate(['/login']);
    }
}
