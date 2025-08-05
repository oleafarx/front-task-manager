import { User } from "./user.interface";

export interface SessionData {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
}