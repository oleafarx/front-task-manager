import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  public loginForm: FormGroup;
  private session: any = {};
  public showModal: boolean = false;
  private emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  constructor(private fb: FormBuilder,
              private authService: AuthService) {

    this.loginForm = this.fb.group({
      email: ['', [
        Validators.required, 
        Validators.pattern(this.emailPattern)
      ]]
    });
  }

  get email(): AbstractControl | null {
    return this.loginForm.get('email');
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const emailValue = this.loginForm.value.email;
      this.getUserByEmail(emailValue);
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  private getUserByEmail(email: string): void {
    this.authService.getUserByEmail(email).subscribe({
      next: (user) => {
        this.session.email = email;
        this.session.user = user;
        this.handleSuccessfulLogin();
      },
      error: (error) => {
        if (error.message === 'User not found') {
          console.error('User not found:', email);
          this.showModal = true;
        }
      }
    })
  }

  private handleSuccessfulLogin(): void {
    // Lógica para cuando el login es exitoso
    console.log('Login successful, session:', this.session);
    // Ejemplo: redirigir al dashboard
    // this.router.navigate(['/dashboard']);
  }

  onRegisterConfirm(): void {
    // Usuario confirma que quiere registrarse
    const email = this.loginForm.value.email;
    console.log('Redirect to register with email:', email);
    // Aquí puedes redirigir a la página de registro pasando el email
    // this.router.navigate(['/register'], { queryParams: { email: email } });
    this.closeModal();
  }

  onRegisterCancel(): void {
    // Usuario cancela el registro
    this.closeModal();
  }

  private closeModal(): void {
    this.showModal = false;
  }
}
