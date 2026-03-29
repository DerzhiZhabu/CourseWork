import {NgForOf, NgIf} from '@angular/common';
import {ChangeDetectorRef, Component} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {TuiAutoFocus} from '@taiga-ui/cdk';
import {TuiButton, TuiDialog, TuiError, TuiHint, TuiLoader, TuiIcon, TuiTextfield} from '@taiga-ui/core';
import {TuiInputModule} from '@taiga-ui/legacy';
import {TuiPassword} from '@taiga-ui/kit';
import {AuthService} from '../app/services/auth.service';
import {
  getControlErrorMessage,
  passwordComplexityValidator,
  trimmedMinLengthValidator,
  trimmedRequiredValidator,
} from '../app/utils/form-validators';

@Component({
  selector: 'app-home',
  imports: [
    NgForOf,
    NgIf,
    TuiButton,
    TuiLoader,
    TuiError,
    ReactiveFormsModule,
    TuiAutoFocus,
    TuiDialog,
    TuiHint,
    TuiInputModule,
    TuiPassword,
    TuiIcon,
    TuiTextfield,
  ],
  templateUrl: './home.html',
  styleUrl: './home.less'
})
export class Home {
  protected LoginForm = new FormGroup({
    login: new FormControl('', [
      trimmedRequiredValidator(),
      trimmedMinLengthValidator(4),
    ]),
    password: new FormControl('', [
      trimmedRequiredValidator(),
      Validators.minLength(8),
      passwordComplexityValidator(),
    ]),
  });

  protected RegisterForm = new FormGroup({
    login: new FormControl('', [
      trimmedRequiredValidator(),
      trimmedMinLengthValidator(4),
    ]),
    password: new FormControl('', [
      trimmedRequiredValidator(),
      Validators.minLength(8),
      passwordComplexityValidator(),
    ]),
    confirmPassword: new FormControl('', [
      trimmedRequiredValidator(),
    ]),
  });

  protected openLogin = false;
  protected openRegister = false;
  protected loginErrorMessage = '';
  protected registerErrorMessage = '';
  protected loginLoading = false;
  protected registerLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  protected showDialogLogin(): void {
    this.loginErrorMessage = '';
    this.openLogin = true;
    this.cdr.detectChanges();
  }

  protected showDialogRegister(): void {
    this.registerErrorMessage = '';
    this.openRegister = true;
    this.cdr.detectChanges();
  }

  protected onLoginSubmit(): void {
    if (this.LoginForm.invalid) {
      this.LoginForm.markAllAsTouched();
      this.loginErrorMessage = this.getLoginFormErrorMessage();
      this.cdr.detectChanges();
      return;
    }

    this.loginErrorMessage = '';
    const {login, password} = this.LoginForm.value;
    this.loginLoading = true;
    this.authService.login({login: login!, password: password!}).subscribe({
      next: () => {
        this.loginLoading = false;
        this.loginErrorMessage = '';
        this.cdr.detectChanges();
        this.openLogin = false;
        this.router.navigate(['/main']);
      },
      error: (err) => {
        this.loginLoading = false;
        console.error('Login error:', err);

        let errorText = 'Ошибка входа';

        if (err) {
          if (err.error?.error) {
            errorText = err.error.error;
          } else if (err.error?.message) {
            errorText = err.error.message;
          } else if (err.message) {
            errorText = err.message;
          } else if (typeof err.error === 'string') {
            errorText = err.error;
          }
        }

        this.loginErrorMessage = errorText;
        this.cdr.detectChanges();
      }
    });
  }

  protected onRegisterSubmit(): void {
    if (this.RegisterForm.invalid) {
      this.RegisterForm.markAllAsTouched();
      this.registerErrorMessage = this.getRegisterFormErrorMessage();
      this.cdr.detectChanges();
      return;
    }

    const {login, password, confirmPassword} = this.RegisterForm.value;

    if (password !== confirmPassword) {
      this.registerErrorMessage = 'Пароли не совпадают';
      this.cdr.detectChanges();
      return;
    }

    this.registerErrorMessage = '';
    this.registerLoading = true;
    this.authService.register({login: login!, password: password!}).subscribe({
      next: () => {
        this.registerLoading = false;
        this.registerErrorMessage = '';
        this.cdr.detectChanges();
        this.openRegister = false;
        this.router.navigate(['/main']);
      },
      error: (err) => {
        this.registerLoading = false;
        console.error('Register error:', err);

        let errorText = 'Ошибка при регистрации';

        if (err) {
          if (err.error?.error) {
            errorText = err.error.error;
          } else if (err.error?.message) {
            errorText = err.error.message;
          } else if (err.message) {
            errorText = err.message;
          } else if (typeof err.error === 'string') {
            errorText = err.error;
          }
        }

        this.registerErrorMessage = errorText;
        this.cdr.detectChanges();
      }
    });
  }

  private getLoginFormErrorMessage(): string {
    return (
      getControlErrorMessage(this.LoginForm.controls.login, {
        trimmedRequired: 'Введите логин',
        trimmedMinLength: 'Логин должен содержать минимум 4 символа',
      }) ||
      getControlErrorMessage(this.LoginForm.controls.password, {
        trimmedRequired: 'Введите пароль',
        minlength: 'Пароль должен содержать минимум 8 символов',
        passwordComplexity:
          'Пароль должен содержать только латинские буквы, минимум одну цифру и один спецсимвол',
      }) ||
      'Проверьте корректность введённых данных'
    );
  }

  private getRegisterFormErrorMessage(): string {
    return (
      getControlErrorMessage(this.RegisterForm.controls.login, {
        trimmedRequired: 'Введите логин',
        trimmedMinLength: 'Логин должен содержать минимум 4 символа',
      }) ||
      getControlErrorMessage(this.RegisterForm.controls.password, {
        trimmedRequired: 'Введите пароль',
        minlength: 'Пароль должен содержать минимум 8 символов',
        passwordComplexity:
          'Пароль должен содержать только латинские буквы, минимум одну цифру и один спецсимвол',
      }) ||
      getControlErrorMessage(this.RegisterForm.controls.confirmPassword, {
        trimmedRequired: 'Подтвердите пароль',
      }) ||
      'Проверьте корректность введённых данных'
    );
  }
}
