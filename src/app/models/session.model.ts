import { User } from "./user.model";

export interface SessionData {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
}