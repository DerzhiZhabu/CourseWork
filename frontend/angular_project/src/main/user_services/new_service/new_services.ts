import {ChangeDetectorRef, Component, EventEmitter, Input, Output} from '@angular/core';
import {NgIf} from '@angular/common';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {TuiButton, TuiDialog, TuiError, TuiLoader, TuiNumberFormat, TuiTextfield} from '@taiga-ui/core';
import {TuiInputModule} from '@taiga-ui/legacy';
import {TuiInputNumberDirective, TuiInputNumberStep} from '@taiga-ui/kit';
import {AuthService} from '../../../app/services/auth.service';
import {
  getControlErrorMessage,
  trimmedMinLengthValidator,
  trimmedRequiredValidator,
} from '../../../app/utils/form-validators';

@Component({
  selector: 'app-new_service',
  imports: [
    NgIf,
    TuiButton,
    TuiError,
    ReactiveFormsModule,
    TuiDialog,
    TuiLoader,
    TuiInputModule,
    TuiTextfield,
    FormsModule,
    TuiInputNumberStep,
    TuiInputNumberDirective,
    TuiNumberFormat,
  ],
  templateUrl: './new_services.html',
  styleUrl: './new_services.less'
})
export class NewServiceComponent {
  protected NewServiceForm = new FormGroup({
    name: new FormControl('', [
      trimmedRequiredValidator(),
      trimmedMinLengthValidator(3),
    ]),
    price1: new FormControl(0, [
      Validators.required,
      Validators.min(0),
    ]),
    price2: new FormControl(0, [
      Validators.required,
      Validators.min(0),
    ]),
  });

  @Input() openNewService = false;
  @Output() closed = new EventEmitter<void>();

  public value = 0;
  protected submitting = false;
  protected errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  onDialogStateChange(isOpen: boolean): void {
    if (!isOpen) {
      this.close();
    }
  }

  protected onNewServiceSubmit(): void {
    if (this.NewServiceForm.invalid) {
      this.NewServiceForm.markAllAsTouched();
      this.errorMessage = this.getFormErrorMessage();
      this.cdr.detectChanges();
      return;
    }

    const {name, price1, price2} = this.NewServiceForm.value;
    this.errorMessage = '';
    this.submitting = true;
    this.authService.new_service({
      token: this.authService.getAccessToken()!,
      name: name!.trim(),
      price1: price1!,
      price2: price2!,
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.errorMessage = '';
        this.cdr.detectChanges();
        this.openNewService = false;
        this.close();
        this.router.navigate(['/main/services']);
      },
      error: (err) => {
        this.submitting = false;
        console.error('Create Service error:', err);

        let errorText = 'Ошибка при создании услуги';

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

        this.errorMessage = errorText;
        this.cdr.detectChanges();
      }
    });
  }

  protected close(): void {
    this.errorMessage = '';
    this.NewServiceForm.reset({
      name: '',
      price1: 0,
      price2: 0,
    });
    this.cdr.detectChanges();
    this.closed.emit();
  }

  private getFormErrorMessage(): string {
    return (
      getControlErrorMessage(this.NewServiceForm.controls.name, {
        trimmedRequired: 'Введите название услуги',
        trimmedMinLength: 'Название услуги должно содержать минимум 3 символа',
      }) ||
      getControlErrorMessage(this.NewServiceForm.controls.price1, {
        required: 'Укажите цену для легковых',
        min: 'Цена для легковых не может быть отрицательной',
      }) ||
      getControlErrorMessage(this.NewServiceForm.controls.price2, {
        required: 'Укажите цену для грузовых',
        min: 'Цена для грузовых не может быть отрицательной',
      }) ||
      'Проверьте корректность заполнения формы'
    );
  }
}
