import {ChangeDetectorRef, Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {NgForOf, NgIf} from '@angular/common';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {TUI_IS_IOS, TuiAutoFocus} from '@taiga-ui/cdk';
import {TuiButton, TuiDialog, TuiError, TuiHint, TuiIcon, TuiLoader, TuiTextfield} from '@taiga-ui/core';
import {TuiInputModule} from '@taiga-ui/legacy';
import {TuiChevron, TuiComboBox, TuiDataListWrapper, TuiInputPhone, TuiPassword} from '@taiga-ui/kit';
import {AuthService} from '../../../app/services/auth.service';
import {
  getControlErrorMessage,
  oneOfValidator,
  phoneCompleteValidator,
  trimmedMinLengthValidator,
  trimmedRequiredValidator,
} from '../../../app/utils/form-validators';

@Component({
  selector: 'app-new_order',
  imports: [
    NgForOf,
    NgIf,
    TuiButton,
    TuiError,
    ReactiveFormsModule,
    TuiAutoFocus,
    TuiDialog,
    TuiHint,
    TuiInputModule,
    TuiPassword,
    TuiIcon,
    TuiLoader,
    TuiTextfield,
    TuiDataListWrapper,
    TuiComboBox,
    TuiChevron,
    TuiInputPhone,
  ],
  templateUrl: './new_order.html',
  styleUrl: './new_order.less'
})
export class NewOrderComponent {
  protected readonly isIos = inject(TUI_IS_IOS);
  protected readonly items = ['Легковое', 'Грузовое'];

  protected NewOrderForm = new FormGroup({
    name: new FormControl('', [
      trimmedRequiredValidator(),
      trimmedMinLengthValidator(3),
    ]),
    client: new FormControl('', [
      trimmedRequiredValidator(),
      trimmedMinLengthValidator(3),
    ]),
    phone: new FormControl('', [
      trimmedRequiredValidator(),
      phoneCompleteValidator(),
    ]),
    type: new FormControl('', [
      trimmedRequiredValidator(),
      oneOfValidator(this.items),
    ]),
  });

  @Input() openNewOrder = false;
  @Output() closed = new EventEmitter<void>();

  public value = '+71234567890';
  protected submitting = false;
  protected errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  protected get pattern(): string | null {
    return this.isIos ? '+[0-9-]{1,20}' : null;
  }

  onDialogStateChange(isOpen: boolean): void {
    if (!isOpen) {
      this.close();
    }
  }

  protected onNewOrderSubmit(): void {
    if (this.NewOrderForm.invalid) {
      this.NewOrderForm.markAllAsTouched();
      this.errorMessage = this.getFormErrorMessage();
      this.cdr.detectChanges();
      return;
    }

    const {name, client, phone, type} = this.NewOrderForm.value;
    this.errorMessage = '';
    this.submitting = true;
    this.authService.new_order({
      token: this.authService.getAccessToken()!,
      name: name!.trim(),
      client: client!.trim(),
      phone: phone!,
      type: type!,
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.errorMessage = '';
        this.cdr.detectChanges();
        this.openNewOrder = false;
        this.close();
        this.router.navigate(['/main/orders']);
      },
      error: (err) => {
        this.submitting = false;
        console.error('Create order error:', err);

        let errorText = 'Ошибка при создании заказа';

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
    this.NewOrderForm.reset({
      name: '',
      client: '',
      phone: '',
      type: '',
    });
    this.cdr.detectChanges();
    this.closed.emit();
  }

  private getFormErrorMessage(): string {
    return (
      getControlErrorMessage(this.NewOrderForm.controls.name, {
        trimmedRequired: 'Введите название заказа',
        trimmedMinLength: 'Название заказа должно содержать минимум 3 символа',
      }) ||
      getControlErrorMessage(this.NewOrderForm.controls.client, {
        trimmedRequired: 'Введите имя клиента',
        trimmedMinLength: 'Имя клиента должно содержать минимум 3 символа',
      }) ||
      getControlErrorMessage(this.NewOrderForm.controls.phone, {
        trimmedRequired: 'Введите номер телефона',
        phoneIncomplete: 'Введите полный номер телефона',
      }) ||
      getControlErrorMessage(this.NewOrderForm.controls.type, {
        trimmedRequired: 'Выберите тип транспорта',
        oneOf: 'Выберите тип транспорта из списка',
      }) ||
      'Проверьте корректность заполнения формы'
    );
  }
}
