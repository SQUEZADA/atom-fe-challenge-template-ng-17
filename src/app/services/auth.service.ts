import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, BehaviorSubject, of } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { environment } from "../../environments/environment";

export interface UserCheckResponse {
    exists: boolean;
    user?: { email: string };
    message?: string;
}

export interface UserCreateResponse {
    success: boolean;
    message: string;
    statusCode?: number;
    user?: { email: string };
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
        console.log(`AuthService: Checking user existence for ${email}`);
        return this.http.get<UserCheckResponse>(`${this.apiUrl}/users/${email}`).pipe(
            tap(response => {
                console.log("AuthService: User check response:", response);
                if (response.exists) {
                    localStorage.setItem("currentUserEmail", email);
                    this.currentUserEmailSubject.next(email);
                }
            }),
            catchError((error: HttpErrorResponse) => {
                console.error("AuthService: Error checking user:", error);
                if (error.status === 404) {
                    return of({ exists: false, message: "User not found on server (404)." });
                }
                return of({ 
                    exists: false, 
                    message: `An unexpected error occurred: ${error.message || "Unknown error"}` 
                });
            })
        );
    }

    createUser(email: string): Observable<UserCreateResponse> {
        console.log(`AuthService: Creating user ${email}`);
        return this.http.post<any>(`${this.apiUrl}/users`, { email }).pipe(
            tap(response => {
                console.log("AuthService: User created response (201 OK):", response);
                // Si llegamos aquí, la creación fue exitosa (201 OK)
                localStorage.setItem("currentUserEmail", email);
                this.currentUserEmailSubject.next(email);
            }),
            catchError((error: HttpErrorResponse) => { // Especifica HttpErrorResponse
                console.error("AuthService: Error creating user:", error);
                if (error.status === 409) {
                    // El usuario ya existe, devuelve una respuesta específica para que el componente la maneje
                    return of({ success: false, message: "El usuario ya existe.", statusCode: 409 });
                }
                // Para otros errores, devuelve un objeto con éxito: false y un mensaje de error.
                return of({ 
                    success: false,
                    message: `Error al crear usuario: ${error.message || "Error desconocido"}`,
                    statusCode: error.status
                });
            })
        );
    }

    getCurrentUserEmail(): string | null {
        return this.currentUserEmailSubject.value;
    }

    logout(): void {
        console.log("AuthService: Logging out user");
        localStorage.removeItem("currentUserEmail");
        this.currentUserEmailSubject.next(null);
    }
}