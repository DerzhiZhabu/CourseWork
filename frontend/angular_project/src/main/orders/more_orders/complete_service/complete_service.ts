import {ChangeDetectorRef, Component, EventEmitter, Input, Output, SimpleChanges} from '@angular/core';
import {NgForOf} from '@angular/common';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {TuiButton, TuiDialog, TuiError, TuiLoader, TuiTextfield} from '@taiga-ui/core';
import {TuiInputModule} from '@taiga-ui/legacy';
import {TuiChevron, TuiComboBox, TuiDataListWrapper} from '@taiga-ui/kit';
import {AuthService} from '../../../../app/services/auth.service';
import {IServiceInOrder, IWorkers} from '../../../../app/interfaces/auth.interface';
import {
  getControlErrorMessage,
  oneOfValidator,
  trimmedRequiredValidator,
} from '../../../../app/utils/form-validators';

@Component({
  selector: 'app-complete_service',
  standalone: true,
  imports: [
    NgForOf,
    TuiButton,
    TuiError,
    ReactiveFormsModule,
    TuiDialog,
    TuiLoader,
    TuiInputModule,
    TuiTextfield,
    TuiDataListWrapper,
    TuiComboBox,
    TuiChevron,
  ],
  templateUrl: './complete_service.html',
  styleUrl: './complete_service.less',
})
export class CompleteServiceComponent {
  @Input() openCompleteService = false;
  @Input() serviceInfo: IServiceInOrder | undefined;

  @Output() closed = new EventEmitter<void>();
  @Output() completed = new EventEmitter<{osid: number; worker: string}>();

  workers: IWorkers[] = [];
  workerNames: string[] = [];
  protected loading = false;
  protected submitting = false;
  protected error = '';

  protected CompleteServiceForm = new FormGroup({
    worker: new FormControl('', [
      trimmedRequiredValidator(),
    ]),
  });

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['openCompleteService']?.currentValue) {
      this.loadWorkers();
    }
  }

  onDialogStateChange(isOpen: boolean): void {
    if (!isOpen) {
      this.close();
    }
  }

  protected onCompleteSubmit(): void {
    if (this.CompleteServiceForm.invalid) {
      this.CompleteServiceForm.markAllAsTouched();
      this.error = this.getFormErrorMessage();
      this.cdr.detectChanges();
      return;
    }

    const workerName = this.CompleteServiceForm.value.worker;
    const worker = this.workers.find((item) => this.getWorkerLabel(item) === workerName);

    if (!this.serviceInfo || !worker) {
      this.error = 'Выберите сотрудника из списка';
      this.cdr.detectChanges();
      return;
    }

    this.error = '';
    this.submitting = true;
    this.authService.complete_order_service({
      token: this.authService.getAccessToken()!,
      osid: this.serviceInfo.osid,
      workerId: worker.id,
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.cdr.detectChanges();
        this.completed.emit({
          osid: this.serviceInfo!.osid,
          worker: this.getWorkerLabel(worker),
        });
        this.close();
      },
      error: (err) => {
        this.submitting = false;
        console.error('Complete Service error:', err);
        this.error = err?.error?.error || err?.error?.message || err?.message || 'Ошибка при выполнении услуги';
        this.cdr.detectChanges();
      }
    });
  }

  private loadWorkers(): void {
    this.loading = true;
    this.error = '';
    this.authService.load_workers({
      token: this.authService.getAccessToken()!,
    }).subscribe({
      next: (response) => {
        this.loading = false;
        this.workers = (response.user?.result || []).filter((worker) => worker.status);
        this.workerNames = this.workers.map((worker) => this.getWorkerLabel(worker));
        this.CompleteServiceForm.controls.worker.setValidators([
          trimmedRequiredValidator(),
          oneOfValidator(this.workerNames),
        ]);
        this.CompleteServiceForm.controls.worker.updateValueAndValidity();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        console.error('Load Workers error:', err);
        this.error = err?.error?.error || err?.error?.message || err?.message || 'Ошибка загрузки сотрудников';
        this.cdr.detectChanges();
      }
    });
  }

  private getWorkerLabel(worker: IWorkers): string {
    return `${worker.surname} ${worker.name} ${worker.patronimic}`.trim();
  }

  protected close(): void {
    this.error = '';
    this.CompleteServiceForm.reset({
      worker: '',
    });
    this.cdr.detectChanges();
    this.closed.emit();
  }

  private getFormErrorMessage(): string {
    return (
      getControlErrorMessage(this.CompleteServiceForm.controls.worker, {
        trimmedRequired: 'Выберите сотрудника',
        oneOf: 'Выберите сотрудника из списка',
      }) ||
      'Проверьте корректность заполнения формы'
    );
  }
}
