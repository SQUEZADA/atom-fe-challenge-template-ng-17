import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService, UserCheckResponse, UserCreateResponse } from '../../services/auth.service'; // Importa las interfaces
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { CommonModule } from '@angular/common';
import { MaterialImports } from '../../shared/material-imports';
import { Subject, takeUntil, finalize } from 'rxjs'; // Importa 'finalize'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ...MaterialImports
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  loading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    console.log('LoginComponent: ngOnInit');
    if (this.authService.getCurrentUserEmail()) {
      console.log('LoginComponent: User already logged in, navigating to dashboard.');
      this.router.navigate(['/todos']);
    }
  }

  onSubmit(): void {
    console.log('LoginComponent: onSubmit called.');
    if (this.loginForm.invalid) {
      console.warn('LoginComponent: Form is invalid.');
      this.loginForm.markAllAsTouched(); // Para mostrar errores de validación inmediatamente
      return;
    }

    this.loading = true;
    const email = this.loginForm.value.email;
    console.log(`LoginComponent: Submitting email: ${email}`);

    this.authService.checkUserExists(email)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false; // Asegura que 'loading' se desactive al finalizar la suscripción
          console.log('LoginComponent: User check finished, loading set to false.');
        })
      )
      .subscribe({
        next: (response: UserCheckResponse) => { // Asegura el tipo de respuesta
          console.log('LoginComponent: checkUserExists success response:', response);
          if (response.exists) {
            console.log('LoginComponent: User exists, navigating to dashboard.');
            this.router.navigate(['/todos']);
          } else {
            console.log('LoginComponent: User does not exist, opening confirm dialog.');
            this.openConfirmCreateDialog(email);
          }
        },
        error: (err) => {
          console.error('LoginComponent: Error during checkUserExists:', err);
          alert(`Error al verificar usuario: ${err.message || 'Verifica tu conexión y logs.'}`);
        }
      });
  }

  openConfirmCreateDialog(email: string): void {
    console.log('LoginComponent: Opening confirm create dialog for', email);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Usuario no encontrado',
        message: `El usuario con el correo "${email}" no existe. ¿Deseas crearlo?`,
        confirmButtonText: 'Sí, crear',
        cancelButtonText: 'Cancelar'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        console.log('LoginComponent: Dialog closed with result:', result);
        if (result) {
          this.loading = true; // Activa el loading mientras se crea el usuario
          console.log('LoginComponent: User confirmed creation. Calling createUser...');
          this.authService.createUser(email)
            .pipe(
              takeUntil(this.destroy$),
              finalize(() => {
                this.loading = false; // Asegura que 'loading' se desactive al finalizar la suscripción
                console.log('LoginComponent: User creation finished, loading set to false.');
              })
            )
            .subscribe({
              next: (createResponse: UserCreateResponse) => { // Asegura el tipo de respuesta
                console.log('LoginComponent: createUser success/response:', createResponse);
                if (createResponse.statusCode === 409) { // El usuario ya existe (fue un 409)
                  alert(`Atención: ${createResponse.message}`);
                  console.log('LoginComponent: User already exists (409). Re-checking for login.');
                  // Aunque nos dio 409, el usuario ya está en Firestore, así que intentamos iniciar sesión directamente
                  this.authService.checkUserExists(email)
                    .pipe(
                      takeUntil(this.destroy$),
                      finalize(() => {
                        this.loading = false; // Asegura que 'loading' se desactive
                      })
                    )
                    .subscribe({
                      next: (checkAgainResponse) => {
                        if (checkAgainResponse.exists) {
                          console.log('LoginComponent: Re-check successful, navigating to dashboard.');
                          this.router.navigate(['/todos']);
                        } else {
                          console.error('LoginComponent: Re-check failed after 409.');
                          alert('No se pudo verificar el usuario existente después del intento de creación. Intenta de nuevo.');
                        }
                      },
                      error: (err) => {
                        console.error('LoginComponent: Error re-verifying user after 409:', err);
                        alert('Ocurrió un error al intentar iniciar sesión con el usuario existente.');
                      }
                    });

                } else if (createResponse.success === false) { // Otros errores de creación
                  console.error('LoginComponent: User creation failed:', createResponse.message);
                  alert(`No se pudo crear el usuario: ${createResponse.message}`);
                } else { // Creación exitosa (201 OK)
                  console.log('LoginComponent: User created successfully. Navigating to dashboard.');
                  this.router.navigate(['/todos']);
                }
              },
              error: (err) => { // Este error se captura si el Observable lanza un error y no fue manejado por 'of' en el servicio
                console.error('LoginComponent: Fatal error during createUser:', err);
                alert(`Error grave al crear usuario: ${err.message || 'Verifica tu conexión y logs.'}`);
              }
            });
        } else {
          console.log('LoginComponent: User canceled creation dialog.');
          // Si el usuario cancela, el loading ya fue desactivado por el finalize de onSubmit
        }
      });
  }

  ngOnDestroy(): void {
    console.log('LoginComponent: ngOnDestroy, unsubscribing.');
    this.destroy$.next();
    this.destroy$.complete();
  }
}