import {NgForOf, NgIf} from '@angular/common';
import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {TuiTable} from '@taiga-ui/addon-table';
import {TuiButton, TuiError, TuiIcon, TuiLoader, TuiTextfield} from '@taiga-ui/core';
import {TuiInputModule} from '@taiga-ui/legacy';
import {TuiChevron, TuiComboBox, TuiDataListWrapper, TuiPassword} from '@taiga-ui/kit';
import {IChildUser} from '../../app/interfaces/auth.interface';
import {AuthService} from '../../app/services/auth.service';
import {
  getControlErrorMessage,
  oneOfValidator,
  passwordComplexityValidator,
  trimmedMaxLengthValidator,
  trimmedMinLengthValidator,
  trimmedRequiredValidator,
} from '../../app/utils/form-validators';

@Component({
  selector: 'app-profile',
  imports: [
    NgForOf,
    NgIf,
    ReactiveFormsModule,
    TuiButton,
    TuiError,
    TuiChevron,
    TuiComboBox,
    TuiDataListWrapper,
    TuiIcon,
    TuiInputModule,
    TuiLoader,
    TuiPassword,
    TuiTable,
    TuiTextfield,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.less'
})
export class Profile implements OnInit, OnDestroy {
  private readonly autoRefreshMs = 5 * 60 * 1000;
  private refreshTimerId: ReturnType<typeof setInterval> | null = null;
  protected readonly roleOptions = ['manage', 'base'];
  protected readonly columns = ['login', 'acces', 'actions'];

  protected readonly ChangePasswordForm = new FormGroup({
    oldPassword: new FormControl('', [
      trimmedRequiredValidator(),
      Validators.maxLength(30),
    ]),
    newPassword: new FormControl('', [
      trimmedRequiredValidator(),
      Validators.minLength(8),
      Validators.maxLength(30),
      passwordComplexityValidator(),
    ]),
  });

  protected readonly NewChildUserForm = new FormGroup({
    login: new FormControl('', [
      trimmedRequiredValidator(),
      trimmedMinLengthValidator(4),
      trimmedMaxLengthValidator(30),
    ]),
    password: new FormControl('', [
      trimmedRequiredValidator(),
      Validators.minLength(8),
      Validators.maxLength(30),
      passwordComplexityValidator(),
    ]),
    acces: new FormControl('manage', [
      trimmedRequiredValidator(),
      oneOfValidator(this.roleOptions),
    ]),
  });

  protected login = '';
  protected acces = '';
  protected error = '';
  protected success = '';
  protected loading = false;
  protected passwordLoading = false;
  protected childUserLoading = false;
  protected deletingChildUserId: number | null = null;
  protected changePasswordMode = false;
  protected createUserMode = false;
  protected childUsers: IChildUser[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.refreshToken();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  protected showChangePassword(): void {
    this.changePasswordMode = true;
    this.error = '';
    this.success = '';
  }

  protected hideChangePassword(): void {
    this.changePasswordMode = false;
    this.error = '';
    this.success = '';
    this.ChangePasswordForm.reset({
      oldPassword: '',
      newPassword: '',
    });
  }

  protected showCreateUser(): void {
    this.createUserMode = true;
    this.error = '';
    this.success = '';
  }

  protected hideCreateUser(): void {
    this.createUserMode = false;
    this.error = '';
    this.success = '';
    this.NewChildUserForm.reset({
      login: '',
      password: '',
      acces: 'manage',
    });
  }

  protected onChangePasswordSubmit(): void {
    const token = this.authService.getAccessToken();
    const {oldPassword, newPassword} = this.ChangePasswordForm.value;

    if (!token) {
      this.router.navigate(['/']);
      return;
    }

    if (this.ChangePasswordForm.invalid) {
      this.ChangePasswordForm.markAllAsTouched();
      this.error = this.getChangePasswordErrorMessage();
      this.success = '';
      this.cdr.detectChanges();
      return;
    }

    this.passwordLoading = true;
    this.authService.change_password({
      token,
      oldPassword: oldPassword!,
      newPassword: newPassword!,
    }).subscribe({
      next: () => {
        this.passwordLoading = false;
        this.error = '';
        this.success = 'Пароль успешно изменён';
        this.ChangePasswordForm.reset({
          oldPassword: '',
          newPassword: '',
        });
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.passwordLoading = false;
        this.success = '';
        if (error.status === 401) {
          this.router.navigate(['/']);
          return;
        }

        this.error = error?.error?.error || 'Ошибка при смене пароля';
        this.cdr.detectChanges();
      }
    });
  }

  protected onCreateChildUserSubmit(): void {
    const token = this.authService.getAccessToken();
    const {login, password, acces} = this.NewChildUserForm.value;

    if (!token) {
      this.router.navigate(['/']);
      return;
    }

    if (this.NewChildUserForm.invalid) {
      this.NewChildUserForm.markAllAsTouched();
      this.error = this.getChildUserErrorMessage();
      this.success = '';
      this.cdr.detectChanges();
      return;
    }

    this.childUserLoading = true;
    this.authService.new_child_user({
      token,
      login: login!.trim(),
      password: password!,
      acces: acces!,
    }).subscribe({
      next: (response) => {
        this.childUserLoading = false;
        this.childUsers = this.sortChildUsers([...this.childUsers, response.user]);
        this.success = 'Пользователь успешно создан';
        this.error = '';
        this.hideCreateUser();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.childUserLoading = false;
        this.success = '';
        this.error = error?.error?.error || 'Ошибка при создании пользователя';
        this.cdr.detectChanges();
      }
    });
  }

  protected onDeleteChildUser(item: IChildUser): void {
    const token = this.authService.getAccessToken();

    if (!token) {
      this.router.navigate(['/']);
      return;
    }

    const confirmed = window.confirm(
      `Удалить связанный аккаунт "${item.login}"? Это действие нельзя отменить.`
    );

    if (!confirmed) {
      return;
    }

    this.deletingChildUserId = item.id;
    this.error = '';
    this.success = '';

    this.authService.delete_child_user({
      token,
      id: item.id,
    }).subscribe({
      next: () => {
        this.deletingChildUserId = null;
        this.childUsers = this.childUsers.filter((child) => child.id !== item.id);
        this.error = '';
        this.success = 'Связанный аккаунт успешно удалён';
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.deletingChildUserId = null;
        if (error.status === 401) {
          this.router.navigate(['/']);
          return;
        }

        this.error = error?.error?.error || 'Ошибка при удалении пользователя';
        this.success = '';
        this.cdr.detectChanges();
      }
    });
  }

  private refreshToken(): void {
    this.loading = true;
    this.error = '';

    this.authService.refreshToken().subscribe({
      next: () => {
        this.loadProfile();
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/']);
      }
    });
  }

  private loadProfile(): void {
    const token = this.authService.getAccessToken();

    if (!token) {
      this.router.navigate(['/']);
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.profile({token}).subscribe({
      next: (response) => {
        this.login = response.user.login;
        this.acces = response.user.acces;
        this.loadChildUsers(token);
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 401) {
          this.router.navigate(['/']);
          return;
        }

        this.error = error?.error?.error || 'Ошибка при загрузке профиля';
        this.cdr.detectChanges();
      }
    });
  }

  private loadChildUsers(token: string): void {
    this.authService.load_child_users({token}).subscribe({
      next: (response) => {
        this.childUsers = this.sortChildUsers(response.user.result || []);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 401) {
          this.router.navigate(['/']);
          return;
        }

        this.error = error?.error?.error || 'Ошибка при загрузке пользователей';
        this.cdr.detectChanges();
      }
    });
  }

  private sortChildUsers(users: IChildUser[]): IChildUser[] {
    return [...users].sort((left, right) => {
      const leftRank = this.getAccesRank(left.acces);
      const rightRank = this.getAccesRank(right.acces);

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return left.login.localeCompare(right.login, 'ru', {sensitivity: 'base'});
    });
  }

  private getAccesRank(acces: string): number {
    switch (acces) {
      case 'manage':
        return 1;
      case 'base':
        return 2;
      case 'main':
        return 3;
      default:
        return 4;
    }
  }

  private getChangePasswordErrorMessage(): string {
    return (
      getControlErrorMessage(this.ChangePasswordForm.controls.oldPassword, {
        trimmedRequired: 'Введите старый пароль',
        maxlength: 'Пароль должен содержать не более 30 символов',
      }) ||
      getControlErrorMessage(this.ChangePasswordForm.controls.newPassword, {
        trimmedRequired: 'Введите новый пароль',
        minlength: 'Новый пароль должен содержать минимум 8 символов',
        maxlength: 'Новый пароль должен содержать не более 30 символов',
        passwordComplexity:
          'Новый пароль должен содержать только латинские буквы, минимум одну цифру и один спецсимвол',
      }) ||
      'Проверьте корректность заполнения формы'
    );
  }

  private getChildUserErrorMessage(): string {
    return (
      getControlErrorMessage(this.NewChildUserForm.controls.login, {
        trimmedRequired: 'Введите логин пользователя',
        trimmedMinLength: 'Логин должен содержать минимум 4 символа',
        trimmedMaxLength: 'Логин должен содержать не более 30 символов',
      }) ||
      getControlErrorMessage(this.NewChildUserForm.controls.password, {
        trimmedRequired: 'Введите пароль пользователя',
        minlength: 'Пароль должен содержать минимум 8 символов',
        maxlength: 'Пароль должен содержать не более 30 символов',
        passwordComplexity:
          'Пароль должен содержать только латинские буквы, минимум одну цифру и один спецсимвол',
      }) ||
      getControlErrorMessage(this.NewChildUserForm.controls.acces, {
        trimmedRequired: 'Выберите уровень доступа',
        oneOf: 'Выберите уровень доступа из списка',
      }) ||
      'Проверьте корректность заполнения формы'
    );
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.refreshTimerId = setInterval(() => {
      this.refreshCurrentData();
    }, this.autoRefreshMs);
  }

  private stopAutoRefresh(): void {
    if (this.refreshTimerId !== null) {
      clearInterval(this.refreshTimerId);
      this.refreshTimerId = null;
    }
  }

  private refreshCurrentData(): void {
    this.refreshToken();
  }
}
