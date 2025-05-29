import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { Task } from "../models/task.model"; // Importa la interfaz Task
import { AuthService } from "./auth.service"; // Importa el AuthService para obtener el email del usuario

@Injectable({
  providedIn: "root"
})
export class TaskService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService // Inyectamos AuthService
  ) { }

  private get userEmail(): string {
    const email = this.authService.getCurrentUserEmail();
    if (!email) {
      throw new Error("User email not found. Please log in.");
    }
    return email;
  }

  getTasks(): Observable<Task[]> {
    const params = new HttpParams().set("email", this.userEmail);
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  addTask(task: Omit<Task, "id" | "createdAt">): Observable<Task> {
    const taskWithUser = { ...task, userEmail: this.userEmail };
    return this.http.post<Task>(`${this.apiUrl}/tasks`, taskWithUser).pipe(
      catchError(this.handleError)
    );
  }

  updateTask(task: Task): Observable<any> {
    if (!task.id) {
      return throwError(() => new Error("Task ID is required for update."));
    }
    const updatePayload = { ...task, userEmail: this.userEmail }; // Aseguramos que el email se envíe en el body
    return this.http.put<any>(`<span class="math-inline">\{this\.apiUrl\}/tasks/</span>{task.id}`, updatePayload).pipe(
      catchError(this.handleError)
    );
  }

  deleteTask(taskId: string): Observable<any> {
    const params = new HttpParams().set("userEmail", this.userEmail); // userEmail como query param para DELETE
    return this.http.delete<any>(`<span class="math-inline">\{this\.apiUrl\}/tasks/</span>{taskId}`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = "An unknown error occurred!";
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      console.error(`Backend returned code ${error.status}, body was: `, error.error);
    }
    return throwError(() => new Error(errorMessage));
  }
}