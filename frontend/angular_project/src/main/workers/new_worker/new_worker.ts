import {ChangeDetectorRef, Component, EventEmitter, Input, Output} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {TuiButton, TuiDialog, TuiError, TuiLoader, TuiNumberFormat, TuiTextfield} from '@taiga-ui/core';
import {TuiInputModule} from '@taiga-ui/legacy';
import {TuiInputNumberDirective, TuiInputNumberStep} from '@taiga-ui/kit';
import {AuthService} from '../../../app/services/auth.service';
import {
  getControlErrorMessage,
  trimmedRequiredValidator,
} from '../../../app/utils/form-validators';

@Component({
  selector: 'app-new_worker',
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
  templateUrl: './new_worker.html',
  styleUrl: './new_worker.less'
})
export class NewWorkerComponent {
  protected NewWorkerForm = new FormGroup({
    name: new FormControl('', [
      trimmedRequiredValidator(),
    ]),
    surname: new FormControl('', [
      trimmedRequiredValidator(),
    ]),
    patronimic: new FormControl(''),
    procent: new FormControl(0, [
      Validators.required,
      Validators.min(0),
      Validators.max(100),
    ]),
  });

  @Input() openNewWorker = false;
  @Output() closed = new EventEmitter<void>();

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

  protected onNewWorkerSubmit(): void {
    if (this.NewWorkerForm.invalid) {
      this.NewWorkerForm.markAllAsTouched();
      this.errorMessage = this.getFormErrorMessage();
      this.cdr.detectChanges();
      return;
    }

    const {name, surname, patronimic, procent} = this.NewWorkerForm.value;

    this.errorMessage = '';
    this.submitting = true;
    this.authService.new_worker({
      token: this.authService.getAccessToken()!,
      name: name!.trim(),
      surname: surname!.trim(),
      patronimic: patronimic?.trim() || '',
      procent: procent!,
      sost: true
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.errorMessage = '';
        this.cdr.detectChanges();
        this.openNewWorker = false;
        this.close();
        this.router.navigate(['/main/workers']);
      },
      error: (err) => {
        this.submitting = false;
        console.error('Create Worker error:', err);

        let errorText = 'Ошибка при создании работника';

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
    this.NewWorkerForm.reset({
      name: '',
      surname: '',
      patronimic: '',
      procent: 0,
    });
    this.cdr.detectChanges();
    this.closed.emit();
  }

  private getFormErrorMessage(): string {
    return (
      getControlErrorMessage(this.NewWorkerForm.controls.name, {
        trimmedRequired: 'Введите имя работника',
      }) ||
      getControlErrorMessage(this.NewWorkerForm.controls.surname, {
        trimmedRequired: 'Введите фамилию работника',
      }) ||
      getControlErrorMessage(this.NewWorkerForm.controls.procent, {
        required: 'Укажите процент работника',
        min: 'Процент работника не может быть меньше 0',
        max: 'Процент работника не может быть больше 100',
      }) ||
      'Проверьте корректность заполнения формы'
    );
  }
}
