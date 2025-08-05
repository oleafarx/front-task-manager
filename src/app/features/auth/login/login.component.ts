import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service'
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SessionState } from '../../../core/states/sessionState';
import { SessionData } from '../../../interfaces/session.interface';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  public loginForm: FormGroup;
  public showModal: boolean = false;
  private emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private sessionSubscription: Subscription = new Subscription();

  constructor(private fb: FormBuilder,
    private userService: UserService,
    private sessionState: SessionState,
    private router: Router) {

    this.loginForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.pattern(this.emailPattern)
      ]]
    });
  }

  ngOnInit(): void {
    this.sessionSubscription = this.sessionState.session$.subscribe(session => {
      if (session.isAuthenticated) {
        this.handleSuccessfulLogin();
      }
    });

    if (this.sessionState.isAuthenticated) {
      this.handleSuccessfulLogin();
    }
  }

  ngOnDestroy(): void {
    if (this.sessionSubscription) {
      this.sessionSubscription.unsubscribe();
    }
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
    this.userService.getUserByEmail(email).subscribe({
      next: (resp) => {
        this.saveSession(resp);
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
    this.router.navigate(['/tasks']);
  }

  onRegisterConfirm(): void {
    const email = this.loginForm.value.email;
    console.log('Redirect to register with email:', email);
    this.userService.createUser(email).subscribe({
      next: (resp) => {
        this.saveSession(resp);
        this.handleSuccessfulLogin();
      },
      error: (error) => {
        console.error('Error creating user:', error);
      }
    })
    this.closeModal();
  }

  private saveSession(resp: any): void {
    const data = resp.data;
    const session: SessionData = {
      user: data.user,
      token: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
      isAuthenticated: true
    }
    console.log("getUser res: ", session);
    this.sessionState.setSession(session);
  }

  onRegisterCancel(): void {
    this.closeModal();
  }

  private closeModal(): void {
    this.showModal = false;
  }
}
