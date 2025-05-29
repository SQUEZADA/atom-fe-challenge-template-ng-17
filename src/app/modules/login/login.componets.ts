import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { AuthService } from "../../services/auth.service";
import { ConfirmDialogComponent } from "../../shared/confirm-dialog/confirm-dialog.component";
import { CommonModule } from "@angular/common";
import { MaterialImports } from "../../shared/material-imports";
import { Subject, takeUntil } from "rxjs";

@Component({
    selector: "app-login",
    standalone: true, // Si es standalone
    imports: [
        CommonModule,
        ReactiveFormsModule, // ¡Importante para formularios reactivos!
        ...MaterialImports // Importa tus módulos de Material
    ],
    templateUrl: "./login.component.html",
    styleUrl: "./login.component.scss"
})
export class LoginComponent implements OnInit, OnDestroy {
    loginForm: FormGroup;
    loading: boolean = false;
    private destroy$ = new Subject<void>(); // Para desuscribirse al destruir el componente

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private dialog: MatDialog
    ) {
        this.loginForm = this.fb.group({
            email: ["", [Validators.required, Validators.email]]
        });
    }

    ngOnInit(): void {
        // Si ya hay un usuario loggeado, redirigir al dashboard
        if (this.authService.getCurrentUserEmail()) {
            this.router.navigate(["/dashboard"]);
        }
    }

    // Método para manejar el envío del formulario
    onSubmit(): void {
        if (this.loginForm.invalid) {
            return;
        }

        this.loading = true;
        const email = this.loginForm.value.email;

        this.authService.checkUserExists(email)
            .pipe(takeUntil(this.destroy$)) // Desuscribirse al destruir
            .subscribe({
                next: (response) => {
                    this.loading = false;
                    if (response.exists) {
                        // Usuario existe, redirigir al dashboard
                        this.router.navigate(["/dashboard"]);
                    } else {
                        // Usuario no existe, mostrar diálogo para confirmar creación
                        this.openConfirmCreateDialog(email);
                    }
                },
                error: (err) => {
                    this.loading = false;
                    console.error("Login error:", err);
                    alert(`Error al verificar usuario: ${err.message || "Verifica tu conexión."}`);
                }
            });
    }

    // Abre el diálogo de confirmación para crear un nuevo usuario
    openConfirmCreateDialog(email: string): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: "350px",
            data: {
                title: "Usuario no encontrado",
                message: `El usuario con el correo "${email}" no existe. ¿Deseas crearlo?`,
                confirmButtonText: "Sí, crear",
                cancelButtonText: "Cancelar"
            }
        });

        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe(result => {
                if (result) {
                    this.loading = true;
                    this.authService.createUser(email)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: (createResponse) => {
                                this.loading = false;
                                if (createResponse.success === false) { 
                                    alert(`No se pudo crear el usuario: ${createResponse.message}`);
                                } else {
                                    // Usuario creado exitosamente, redirigir
                                    this.router.navigate(["/dashboard"]);
                                }
                            },
                            error: (err) => {
                                this.loading = false;
                                console.error("Error al crear usuario:", err);
                                alert(`Error al crear usuario: ${err.message || "Verifica tu conexión."}`);
                            }
                        });
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}