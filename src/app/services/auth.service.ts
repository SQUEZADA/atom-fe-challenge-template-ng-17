import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, BehaviorSubject, of } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { environment } from "../../environments/environment";

interface UserCheckResponse {
    exists: boolean;
    user?: { email: string }; 
    message?: string;
}

@Injectable({
    providedIn: "root"
})
export class AuthService {
    private apiUrl = environment.apiUrl;
    private currentUserEmailSubject: BehaviorSubject<string | null>;
    public currentUserEmail$: Observable<string | null>;

    constructor(private http: HttpClient) {
        const storedEmail = localStorage.getItem("currentUserEmail");
        this.currentUserEmailSubject = new BehaviorSubject<string | null>(storedEmail);
        this.currentUserEmail$ = this.currentUserEmailSubject.asObservable();
    }

    checkUserExists(email: string): Observable<UserCheckResponse> {
        return this.http.get<UserCheckResponse>(`<span class="math-inline">\{this\.apiUrl\}/users/</span>{email}`).pipe(
            tap(response => {
                if (response.exists) {
                    localStorage.setItem("currentUserEmail", email);
                    this.currentUserEmailSubject.next(email);
                }
            }),
            catchError(error => {
                if (error.status === 404) {
                    return of({ exists: false, message: "User not found on server." });
                }
                return of({ exists: false, message: "An unexpected error occurred." });
            })
        );
    }

    createUser(email: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/users`, { email }).pipe(
            tap(response => {
                localStorage.setItem("currentUserEmail", email);
                this.currentUserEmailSubject.next(email);
                console.log("User created:", response);
            }),
            catchError(error => {
                console.error("Error creating user:", error);
                return of({ success: false, message: "Error creating user", error: error.message });
            })
        );
    }
    getCurrentUserEmail(): string | null {
        return this.currentUserEmailSubject.value;
    }

    logout(): void {
        localStorage.removeItem("currentUserEmail");
        this.currentUserEmailSubject.next(null);
    }
}