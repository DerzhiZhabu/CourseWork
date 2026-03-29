import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {DatePipe, DecimalPipe, NgClass, NgForOf, NgIf} from '@angular/common';
import {TuiButton, TuiDialog, TuiError, TuiLoader, TuiNumberFormat, TuiTextfield} from '@taiga-ui/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TuiInputModule} from '@taiga-ui/legacy';
import {
  TuiChevron,
  TuiComboBox,
  TuiDataListWrapper, TuiInputDate, TuiInputNumberDirective,
  TuiInputNumberStep, TuiInputPhone,
} from '@taiga-ui/kit';
import {AuthService} from '../../../app/services/auth.service';
import {IOrder, IServiceInOrder, IServicesInOrderReceive} from '../../../app/interfaces/auth.interface';
import {TuiDay, TUI_IS_IOS} from '@taiga-ui/cdk';
import {
  TuiTableCell,
  TuiTableDirective,
  TuiTableTbody,
  TuiTableTd,
  TuiTableTh,
  TuiTableThGroup, TuiTableTr
} from '@taiga-ui/addon-table';
import {AddServicesComponent} from './add_services/add_services';
import {CompleteServiceComponent} from './complete_service/complete_service';
import {
  getControlErrorMessage,
  oneOfValidator,
  phoneCompleteValidator,
  trimmedMinLengthValidator,
  trimmedRequiredValidator
} from '../../../app/utils/form-validators';

@Component({
  selector: 'app-more_orders',
  imports: [
    NgForOf,
    NgIf,
    NgClass,
    TuiButton,
    TuiError,
    TuiLoader,
    ReactiveFormsModule,
    TuiDialog,
    TuiInputModule,
    TuiTextfield,
    TuiDataListWrapper,
    TuiComboBox,
    TuiChevron,
    TuiInputDate,
    FormsModule,
    TuiInputNumberStep,
    TuiInputNumberDirective,
    TuiNumberFormat,
    TuiInputPhone,
    DatePipe,
    DecimalPipe,
    TuiTableCell,
    TuiTableDirective,
    TuiTableTbody,
    TuiTableTd,
    TuiTableTh,
    TuiTableThGroup,
    TuiTableTr,
    AddServicesComponent,
    CompleteServiceComponent,

  ],
  templateUrl: './more_orders.html',
  styleUrl: './more_orders.less'
})
export class MoreOrdersComponent implements OnInit {
  protected readonly isIos = inject(TUI_IS_IOS);
  protected get pattern(): string | null {
    return this.isIos ? '+[0-9-]{1,20}' : null;
  }

  protected readonly autoTypes=["Легковое", "Грузовое"];
  protected readonly baseOrderStatuses = ["Новый", "В работе", "Ждёт запчастей", "Отменен"];
  protected readonly readyOrderStatus = "Готов";
  protected readonly confirmationOrderStatus = "Ждёт подтверждения";
  protected readonly closedOrderStatus = "Закрыт";

  @Input() openMoreOrders : boolean = false;
  @Input() orderInfo : IOrder | undefined;
  protected openAddServices=false
  protected openCompleteService = false;
  protected number:number = 0;
  protected selectedService: IServiceInOrder | undefined;
  protected persistedOrderStatus = '';
  protected createdDate: TuiDay | null = null;
  protected closedDate: TuiDay | null = null;
  protected currentUserAcces = '';

  columns = ['sname', 'price', 'samount', 'summary', 'worker', 'sost', 'button'];

  protected get currentOrderStatus(): string {
    return this.MoreOrdersForm.value.sost ?? '';
  }

  protected get isOrderLocked(): boolean {
    return (
      this.persistedOrderStatus === this.readyOrderStatus ||
      this.persistedOrderStatus === this.closedOrderStatus
    );
  }

  protected get isOrderStatusLocked(): boolean {
    if (this.persistedOrderStatus === this.closedOrderStatus) {
      return true;
    }

    return (
      this.currentUserAcces === 'base' &&
      this.persistedOrderStatus === this.readyOrderStatus
    );
  }

  protected get canSubmitOrderChanges(): boolean {
    return !this.isOrderLocked || !this.isOrderStatusLocked;
  }

  protected get allServicesCompleted(): boolean {
    return this.data.length > 0 && this.data.every((item) => item.sost === 1);
  }

  protected get canUndoCompletedServices(): boolean {
    return this.currentUserAcces !== 'base';
  }

  protected get availableOrderStatuses(): string[] {
    if (this.persistedOrderStatus === this.closedOrderStatus) {
      return [this.closedOrderStatus];
    }

    if (this.persistedOrderStatus === this.readyOrderStatus) {
      return this.currentUserAcces === 'base'
        ? [this.readyOrderStatus]
        : [this.readyOrderStatus, this.closedOrderStatus];
    }

    const statuses = [...this.baseOrderStatuses];
    const currentStatus = this.currentOrderStatus;
    const canSetReadyOrClosed = this.currentUserAcces !== 'base';

    if (
      canSetReadyOrClosed &&
      (this.allServicesCompleted || currentStatus === this.readyOrderStatus)
    ) {
      statuses.push(this.readyOrderStatus);
    }

    if (
      this.allServicesCompleted ||
      currentStatus === this.confirmationOrderStatus ||
      this.persistedOrderStatus === this.confirmationOrderStatus ||
      this.persistedOrderStatus === this.closedOrderStatus
    ) {
      statuses.push(this.confirmationOrderStatus);
    }

    if (
      canSetReadyOrClosed &&
      (
        this.allServicesCompleted ||
        currentStatus === this.closedOrderStatus ||
        this.persistedOrderStatus === this.closedOrderStatus
      )
    ) {
      statuses.push(this.closedOrderStatus);
    }

    if (currentStatus && !statuses.includes(currentStatus)) {
      statuses.push(currentStatus);
    }

    return Array.from(new Set(statuses));
  }

  onAddServicesOpen(): void {
    if (this.isOrderLocked) {
      return;
    }

    this.openAddServices = true;
  }

  onAddServicesClose(): void {
    this.openAddServices = false;
  }

  onServiceAdded(): void {
    this.loadServices();
  }

  onCompleteServiceOpen(service: IServiceInOrder): void {
    if (this.isOrderLocked) {
      return;
    }

    this.selectedService = {...service};
    this.openCompleteService = true;
  }

  onCompleteServiceClose(): void {
    this.openCompleteService = false;
    this.selectedService = undefined;
  }

  onServiceCompleted(event: {osid: number; worker: string}): void {
    this.data = this.data.map((item) =>
      item.osid === event.osid
        ? {
            ...item,
            sost: 1,
            worker: event.worker,
          }
        : item
    );
    this.cdr.detectChanges();
    this.loadServices();
  }

  protected onUndoService(item: IServiceInOrder): void {
    if (this.isOrderLocked) {
      return;
    }

    this.serviceActionOsId = item.osid;
    this.authService.undo_order_service({
      token: this.authService.getAccessToken()!,
      osid: item.osid,
    }).subscribe({
      next: () => {
        this.serviceActionOsId = null;
        this.data = this.data.map((currentItem) =>
          currentItem.osid === item.osid
            ? {
                ...currentItem,
                sost: 0,
                worker: 'Пусто',
              }
            : currentItem
        );
        this.cdr.detectChanges();
        this.loadServices();
      },
      error: (err) => {
        this.serviceActionOsId = null;
        console.error('Undo Service error:', err);
      }
    });
  }


  protected MoreOrdersForm = new FormGroup({
    name: new FormControl("", [
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
    sost: new FormControl('', [
      trimmedRequiredValidator(),
      oneOfValidator([
        ...this.baseOrderStatuses,
        this.readyOrderStatus,
        this.confirmationOrderStatus,
        this.closedOrderStatus,
      ]),
    ]),
    type: new FormControl('', [
      trimmedRequiredValidator(),
      oneOfValidator(this.autoTypes),
    ]),
    date: new FormControl(''),
    dateClosed: new FormControl(''),

  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['openMoreOrders']?.currentValue) {
      this.loadCurrentUserAcces();
    }

    if (changes['orderInfo']) {
      const newValue = changes['orderInfo'].currentValue;
      const oldValue = changes['orderInfo'].previousValue;

      console.log('orderInfo изменился:', oldValue, '→', newValue);

      if (newValue) {
        console.log('✅ orderInfo инициализирован:', newValue);
        this.onOrderInfoReceived(newValue);
        this.loadServices()
      } else {
        console.log('❌ orderInfo не инициализирован или сброшен');
      }
    }
  }

  private onOrderInfoReceived(newValue : IOrder): void {
    this.persistedOrderStatus = newValue.sost;
    this.createdDate = this.toTuiDay(newValue.date);
    this.closedDate = this.toTuiDay(newValue.date_closed);
    this.MoreOrdersForm.patchValue({
      name : newValue.name,
      client : newValue.client,
      phone : newValue.phone,
      sost : newValue.sost,
      type  : newValue.type,
      date : newValue.date,
      dateClosed: this.toDateControlValue(newValue.date_closed),
    });
    this.number = newValue.number;
  }

  ngOnInit(): void {
    this.loadCurrentUserAcces();
  }

  constructor(private authService: AuthService,
              private cdr: ChangeDetectorRef
  ) {}

  @Output() closed = new EventEmitter<void>();
  public value = 0;
  data: IServiceInOrder[] = [];
  error="";
  protected loading = false;
  protected saving = false;
  protected serviceActionOsId: number | null = null;

  protected get totalPrice(): number {
    return this.data.reduce((sum, item) => sum + (item.price * item.samount), 0);
  }

  protected getServiceStatusLabel(item: IServiceInOrder): string {
    return item.sost === 1 ? 'Готово' : 'В работе';
  }

  protected getServiceStatusClass(item: IServiceInOrder): string {
    return item.sost === 1 ? 'status-ready' : 'status-work';
  }

  onDialogStateChange(isOpen: boolean): void {
    if (!isOpen) {
      this.close()
    }
  }

  protected loadServices(){
    this.loading = true;
    this.authService.services_in_order({ token: this.authService.getAccessToken()!, number:this.number }).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Заказы получены:', response);

        if (response.user && response.user.services) {
          this.data = response.user.services;
          console.log('Количество заказов:', this.data.length);
        } else {
          console.warn('Структура ответа не соответствует ожидаемой:', response);
          this.data = [];
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        console.error('Ошибка при получении заказов:', error);

        if (error.status === 401) {
          this.error = 'Сессия истекла, войдите снова';
        } else if (error.status === 0) {
          this.error = 'Не удалось соединиться с сервером';
        } else {
          this.error = error.error?.message || 'Ошибка загрузки заказов';
        }
        this.cdr.detectChanges();
      }
    });
  }

  protected onUpdateOrderSubmit(): void {
    if (!this.canSubmitOrderChanges) {
      return;
    }

    if (this.MoreOrdersForm.invalid) {
      this.MoreOrdersForm.markAllAsTouched();
      this.error = this.getOrderFormErrorMessage();
      this.cdr.detectChanges();
      return;
    }

    const { name, client, phone, sost, type} = this.MoreOrdersForm.value;
    this.error = '';

    if (!this.availableOrderStatuses.includes(sost || '')) {
      this.error = 'Выберите статус заказа из списка';
      this.cdr.detectChanges();
      return;
    }

    if (sost === this.readyOrderStatus || sost === this.closedOrderStatus) {
      const confirmationMessage =
        sost === this.readyOrderStatus
          ? 'Подтвердить перевод заказа в статус "Готов"?'
          : 'Подтвердить закрытие заказа?';
      const isConfirmed = window.confirm(confirmationMessage);

      if (!isConfirmed) {
        return;
      }
    }

    this.saving = true;
    this.authService.update_order({ token: this.authService.getAccessToken()!, name: name!.trim(), client:client!.trim(), sost:sost!, phone:phone!, type:type!, number:this.number }).subscribe({
      next: () => {
        this.saving = false;
        this.authService.notifyWaitingOrdersChanged();
        this.openMoreOrders= false;
        this.close()
      },
      error: (err) => {
        this.saving = false;
        console.error('Update Order error:', err);

        let errorText = 'Ошибка при обновлении заказа';

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

        this.error = errorText;
        this.cdr.detectChanges();
      }

    });
  }

  private getOrderFormErrorMessage(): string {
    return (
      getControlErrorMessage(this.MoreOrdersForm.controls.name, {
        trimmedRequired: 'Введите название заказа',
        trimmedMinLength: 'Название заказа должно содержать минимум 3 символа',
      }) ||
      getControlErrorMessage(this.MoreOrdersForm.controls.client, {
        trimmedRequired: 'Введите имя клиента',
        trimmedMinLength: 'Имя клиента должно содержать минимум 3 символа',
      }) ||
      getControlErrorMessage(this.MoreOrdersForm.controls.phone, {
        trimmedRequired: 'Введите номер телефона',
        phoneIncomplete: 'Введите полный номер телефона',
      }) ||
      getControlErrorMessage(this.MoreOrdersForm.controls.type, {
        trimmedRequired: 'Выберите тип транспорта',
        oneOf: 'Выберите тип транспорта из списка',
      }) ||
      getControlErrorMessage(this.MoreOrdersForm.controls.sost, {
        trimmedRequired: 'Выберите статус заказа',
        oneOf: 'Выберите статус заказа из списка',
      }) ||
      'Проверьте корректность заполнения формы'
    );
  }

  protected close(): void {
    this.closed.emit();
  }

  private loadCurrentUserAcces(): void {
    const token = this.authService.getAccessToken();

    if (!token) {
      return;
    }

    this.authService.profile({ token }).subscribe({
      next: (response) => {
        this.currentUserAcces = response.user.acces || '';
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Load profile error:', error);
      }
    });
  }

  private toTuiDay(value: unknown): TuiDay | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'object' && value !== null) {
      const maybeNullTime = value as {Time?: unknown; Valid?: unknown};

      if (maybeNullTime.Valid === false) {
        return null;
      }

      if (typeof maybeNullTime.Time === 'string') {
        const parsed = new Date(maybeNullTime.Time);

        if (Number.isNaN(parsed.getTime())) {
          return null;
        }

        return TuiDay.fromLocalNativeDate(parsed);
      }
    }

    if (typeof value !== 'string') {
      return null;
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return TuiDay.fromLocalNativeDate(parsed);
  }

  private toDateControlValue(value: unknown): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'object' && value !== null) {
      const maybeNullTime = value as {Time?: unknown; Valid?: unknown};

      if (maybeNullTime.Valid === false) {
        return null;
      }

      if (typeof maybeNullTime.Time === 'string') {
        return maybeNullTime.Time;
      }

      return null;
    }

    return typeof value === 'string' ? value : null;
  }
}
