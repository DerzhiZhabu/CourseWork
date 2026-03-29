import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges
} from '@angular/core';
import {DecimalPipe, NgForOf, NgIf} from '@angular/common';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TuiDay} from '@taiga-ui/cdk';
import {TuiTableCell, TuiTableDirective, TuiTableTbody, TuiTableTd, TuiTableTh, TuiTableThGroup, TuiTableTr} from '@taiga-ui/addon-table';
import {TuiButton, TuiDialog, TuiError, TuiLoader, TuiNumberFormat, TuiTextfield} from '@taiga-ui/core';
import {TuiInputModule} from '@taiga-ui/legacy';
import {TuiChevron, TuiComboBox, TuiDataListWrapper, TuiInputDate, TuiInputNumberDirective, TuiInputNumberStep} from '@taiga-ui/kit';
import {AuthService} from '../../../app/services/auth.service';
import {IWorkers, IWorkerServices} from '../../../app/interfaces/auth.interface';
import {
  getControlErrorMessage,
  oneOfValidator,
  trimmedRequiredValidator,
} from '../../../app/utils/form-validators';

@Component({
  selector: 'app-more_workers',
  imports: [
    NgForOf,
    NgIf,
    TuiButton,
    TuiError,
    TuiLoader,
    TuiNumberFormat,
    ReactiveFormsModule,
    TuiDialog,
    TuiInputModule,
    TuiTextfield,
    FormsModule,
    TuiInputNumberStep,
    TuiInputNumberDirective,
    DecimalPipe,
    TuiTableCell,
    TuiTableDirective,
    TuiTableTbody,
    TuiTableTd,
    TuiTableTh,
    TuiTableThGroup,
    TuiTableTr,
    TuiDataListWrapper,
    TuiComboBox,
    TuiChevron,
    TuiInputDate
  ],
  templateUrl: './more_workers.html',
  styleUrl: './more_workers.less'
})
export class MoreWorkersComponent {
  protected readonly statuses = ['Активен', 'Уволен'];

  @Input() openMoreWorkers = false;
  @Input() workerInfo: IWorkers | undefined;
  @Input() initialDateStart: TuiDay | null = null;
  @Input() initialDateEnd: TuiDay | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() updated = new EventEmitter<IWorkers>();

  number = 0;
  dateStart: TuiDay | null = this.getMonthStart();
  dateEnd: TuiDay | null = this.getToday();
  columns = ['sname', 'number', 'summary'];
  data: IWorkerServices[] = [];
  error = '';
  total = 0;
  protected loading = false;
  protected saving = false;
  protected printing = false;

  protected MoreWorkersForm = new FormGroup({
    name: new FormControl('', [
      trimmedRequiredValidator(),
    ]),
    surname: new FormControl('', [
      trimmedRequiredValidator(),
    ]),
    patronimic: new FormControl(''),
    sost: new FormControl('', [
      trimmedRequiredValidator(),
      oneOfValidator(this.statuses),
    ]),
    procent: new FormControl<number | null>({value: null, disabled: true}),
  });

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.workerInfo &&
      (
        changes['openMoreWorkers'] ||
        changes['workerInfo'] ||
        changes['initialDateStart'] ||
        changes['initialDateEnd']
      )
    ) {
      this.applyInitialDates();
      this.onWorkerInfoReceived();
      if (this.openMoreWorkers) {
        this.onApplyPeriod();
      }
    }
  }

  onDialogStateChange(isOpen: boolean): void {
    if (!isOpen) {
      this.close();
    }
  }

  protected onApplyPeriod(): void {
    if (!this.hasValidPeriod()) {
      this.error = 'Выберите обе даты периода';
      this.cdr.detectChanges();
      return;
    }

    this.loadServices();
  }

  protected onPrint(): void {
    if (!this.hasValidPeriod()) {
      this.error = 'Выберите обе даты периода';
      this.cdr.detectChanges();
      return;
    }

    this.printing = true;
    this.authService.print_worker_services({
      token: this.authService.getAccessToken()!,
      id: this.number,
      dateStart: this.toRequestDate(this.dateStart, false),
      dateEnd: this.toRequestDate(this.dateEnd, true)
    }).subscribe({
      next: (file) => {
        this.printing = false;
        const url = window.URL.createObjectURL(file);
        const link = document.createElement('a');
        const dateStart = this.formatFileDate(this.dateStart);
        const dateEnd = this.formatFileDate(this.dateEnd);

        link.href = url;
        link.download = `worker_${this.number}_${dateStart}_${dateEnd}.docx`;
        link.click();

        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.printing = false;
        if (error.status === 401) {
          this.error = 'Сессия истекла, войдите снова';
        } else if (error.status === 0) {
          this.error = 'Не удалось соединиться с сервером';
        } else {
          this.error = 'Ошибка формирования отчета';
        }
        this.cdr.detectChanges();
      }
    });
  }

  protected loadServices(): void {
    if (!this.hasValidPeriod()) {
      this.loading = false;
      this.error = 'Выберите обе даты периода';
      this.cdr.detectChanges();
      return;
    }

    this.error = '';
    this.loading = true;
    this.authService.load_worker_services({
      token: this.authService.getAccessToken()!,
      id: this.number,
      dateStart: this.toRequestDate(this.dateStart, false),
      dateEnd: this.toRequestDate(this.dateEnd, true)
    }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.user && response.user.result) {
          this.data = response.user.result;
          this.total = response.user.total;
        } else {
          this.data = [];
          this.total = 0;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 401) {
          this.error = 'Сессия истекла, войдите снова';
        } else if (error.status === 0) {
          this.error = 'Не удалось соединиться с сервером';
        } else {
          this.error = error.error?.message || 'Ошибка загрузки услуг';
        }
        this.cdr.detectChanges();
      }
    });
  }

  protected onUpdateWorkerSubmit(): void {
    if (this.MoreWorkersForm.invalid) {
      this.MoreWorkersForm.markAllAsTouched();
      this.error = this.getFormErrorMessage();
      this.cdr.detectChanges();
      return;
    }

    const {name, surname, patronimic, sost} = this.MoreWorkersForm.value;
    this.error = '';

    this.saving = true;
    this.authService.update_worker({
      token: this.authService.getAccessToken()!,
      id: this.number,
      name: name!.trim(),
      surname: surname!.trim(),
      patronimic: patronimic?.trim() || '',
      sost: sost === 'Активен'
    }).subscribe({
      next: () => {
        this.saving = false;
        const updatedWorker: IWorkers = {
          id: this.number,
          name: name!.trim(),
          surname: surname!.trim(),
          patronimic: patronimic?.trim() || '',
          procent: this.workerInfo?.procent ?? 0,
          status: sost === 'Активен',
        };

        if (this.workerInfo) {
          this.workerInfo.name = updatedWorker.name;
          this.workerInfo.surname = updatedWorker.surname;
          this.workerInfo.patronimic = updatedWorker.patronimic;
          this.workerInfo.status = updatedWorker.status;
        }

        this.updated.emit(updatedWorker);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        if (err?.error?.error) {
          this.error = err.error.error;
        } else if (err?.error?.message) {
          this.error = err.error.message;
        } else {
          this.error = 'Ошибка при обновлении работника';
        }
        this.cdr.detectChanges();
      }
    });
  }

  protected close(): void {
    this.closed.emit();
  }

  private onWorkerInfoReceived(): void {
    this.MoreWorkersForm.patchValue({
      name: this.workerInfo?.name,
      surname: this.workerInfo?.surname,
      patronimic: this.workerInfo?.patronimic,
      sost: this.workerInfo?.status ? 'Активен' : 'Уволен',
      procent: this.workerInfo?.procent ?? null,
    });
    this.number = this.workerInfo?.id as number;
  }

  private getMonthStart(): TuiDay {
    const today = new Date();
    today.setDate(1);
    return TuiDay.fromLocalNativeDate(today);
  }

  private getToday(): TuiDay {
    return TuiDay.fromLocalNativeDate(new Date());
  }

  private hasValidPeriod(): this is this & {dateStart: TuiDay; dateEnd: TuiDay} {
    return !!this.dateStart && !!this.dateEnd;
  }

  private applyInitialDates(): void {
    if (this.initialDateStart) {
      this.dateStart = new TuiDay(
        this.initialDateStart.year,
        this.initialDateStart.month,
        this.initialDateStart.day
      );
    }

    if (this.initialDateEnd) {
      this.dateEnd = new TuiDay(
        this.initialDateEnd.year,
        this.initialDateEnd.month,
        this.initialDateEnd.day
      );
    }
  }

  private toRequestDate(value: TuiDay, isEndOfDay: boolean): string {
    const suffix = isEndOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
    return `${value.year}-${this.padDatePart(value.month + 1)}-${this.padDatePart(value.day)}${suffix}`;
  }

  private padDatePart(value: number): string {
    return String(value).padStart(2, '0');
  }

  private formatFileDate(value: TuiDay): string {
    return `${value.year}-${this.padDatePart(value.month + 1)}-${this.padDatePart(value.day)}`;
  }

  private getFormErrorMessage(): string {
    return (
      getControlErrorMessage(this.MoreWorkersForm.controls.name, {
        trimmedRequired: 'Введите имя работника',
      }) ||
      getControlErrorMessage(this.MoreWorkersForm.controls.surname, {
        trimmedRequired: 'Введите фамилию работника',
      }) ||
      getControlErrorMessage(this.MoreWorkersForm.controls.sost, {
        trimmedRequired: 'Выберите статус работника',
        oneOf: 'Выберите статус работника из списка',
      }) ||
      'Проверьте корректность заполнения формы'
    );
  }
}
