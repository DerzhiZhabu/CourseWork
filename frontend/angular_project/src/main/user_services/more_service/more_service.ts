import {ChangeDetectorRef, Component, EventEmitter, Input, Output, SimpleChanges} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {TuiButton, TuiDialog, TuiError, TuiLoader, TuiNumberFormat, TuiTextfield} from '@taiga-ui/core';
import {TuiInputModule} from '@taiga-ui/legacy';
import {TuiInputNumberDirective, TuiInputNumberStep} from '@taiga-ui/kit';
import {AuthService} from '../../../app/services/auth.service';
import {IService} from '../../../app/interfaces/auth.interface';
import {
  getControlErrorMessage,
  trimmedMinLengthValidator,
  trimmedRequiredValidator,
} from '../../../app/utils/form-validators';

@Component({
  selector: 'app-more_service',
  imports: [
    TuiButton,
    TuiError,
    ReactiveFormsModule,
    TuiDialog,
    TuiLoader,
    TuiInputModule,
    TuiTextfield,
    TuiInputNumberStep,
    TuiInputNumberDirective,
    TuiNumberFormat,
  ],
  templateUrl: './more_service.html',
  styleUrl: './more_service.less',
})
export class MoreServiceComponent {
  @Input() openMoreService = false;
  @Input() serviceInfo: IService | undefined;

  @Output() closed = new EventEmitter<void>();
  @Output() updated = new EventEmitter<IService>();

  protected MoreServiceForm = new FormGroup({
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
  protected submitting = false;
  protected errorMessage = '';

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.serviceInfo && (changes['openMoreService'] || changes['serviceInfo'])) {
      this.errorMessage = '';
      this.MoreServiceForm.patchValue({
        name: this.serviceInfo.name,
        price1: this.serviceInfo.price1,
        price2: this.serviceInfo.price2,
      });
      this.cdr.detectChanges();
    }
  }

  onDialogStateChange(isOpen: boolean): void {
    if (!isOpen) {
      this.close();
    }
  }

  protected onUpdateServiceSubmit(): void {
    if (!this.serviceInfo) {
      return;
    }

    if (this.MoreServiceForm.invalid) {
      this.MoreServiceForm.markAllAsTouched();
      this.errorMessage = this.getFormErrorMessage();
      this.cdr.detectChanges();
      return;
    }

    const {name, price1, price2} = this.MoreServiceForm.value;
    this.errorMessage = '';
    this.submitting = true;
    this.authService.update_service({
      token: this.authService.getAccessToken()!,
      id: this.serviceInfo.id,
      name: name!.trim(),
      price1: price1!,
      price2: price2!,
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.errorMessage = '';
        this.cdr.detectChanges();
        this.updated.emit({
          id: this.serviceInfo!.id,
          name: name!.trim(),
          price1: price1!,
          price2: price2!,
        });
      },
      error: (err) => {
        this.submitting = false;
        console.error('Update Service error:', err);
        this.errorMessage = err?.error?.error || err?.error?.message || err?.message || 'Ошибка при обновлении услуги';
        this.cdr.detectChanges();
      }
    });
  }

  protected close(): void {
    this.errorMessage = '';
    this.cdr.detectChanges();
    this.closed.emit();
  }

  private getFormErrorMessage(): string {
    return (
      getControlErrorMessage(this.MoreServiceForm.controls.name, {
        trimmedRequired: 'Введите название услуги',
        trimmedMinLength: 'Название услуги должно содержать минимум 3 символа',
      }) ||
      getControlErrorMessage(this.MoreServiceForm.controls.price1, {
        required: 'Укажите цену для легковых',
        min: 'Цена для легковых не может быть отрицательной',
      }) ||
      getControlErrorMessage(this.MoreServiceForm.controls.price2, {
        required: 'Укажите цену для грузовых',
        min: 'Цена для грузовых не может быть отрицательной',
      }) ||
      'Проверьте корректность заполнения формы'
    );
  }
}
