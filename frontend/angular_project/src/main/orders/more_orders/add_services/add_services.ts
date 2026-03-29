import {NgForOf, NgIf} from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {
  TuiButton,
  TuiDialog,
  TuiError,
  TuiLoader,
  TuiNumberFormat,
  TuiTextfield,
} from '@taiga-ui/core';
import {TuiInputNumberDirective} from '@taiga-ui/kit';
import {
  TuiTableCell,
  TuiTableDirective,
  TuiTableTbody,
  TuiTableTd,
  TuiTableTh,
  TuiTableThGroup,
  TuiTableTr,
} from '@taiga-ui/addon-table';
import {AuthService} from '../../../../app/services/auth.service';
import {IAddServiceInOrderLoad} from '../../../../app/interfaces/auth.interface';

@Component({
  selector: 'app-add_services',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    ReactiveFormsModule,
    TuiButton,
    TuiDialog,
    TuiError,
    TuiLoader,
    TuiNumberFormat,
    TuiTextfield,
    TuiInputNumberDirective,
    TuiTableCell,
    TuiTableDirective,
    TuiTableTbody,
    TuiTableTd,
    TuiTableTh,
    TuiTableThGroup,
    TuiTableTr,
  ],
  templateUrl: './add_services.html',
  styleUrl: './add_services.less'
})
export class AddServicesComponent {
  @Input() openAddServices = false;
  @Input() orderNumber = 0;
  @Input() orderLocked = false;

  @Output() closed = new EventEmitter<void>();
  @Output() added = new EventEmitter<void>();

  protected readonly columns = ['name', 'price', 'samount', 'status', 'add_button'];

  protected data: IAddServiceInOrderLoad[] = [];
  protected error = '';
  protected loading = false;
  protected addingServiceId: number | null = null;

  protected number = 0;
  protected priceControls: Record<number, FormControl<number | null>> = {};
  protected colControls: Record<number, FormControl<number | null>> = {};

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.openAddServices) {
      this.number = this.orderNumber;
      this.addServicesLoad();
    }

    this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['openAddServices']?.currentValue) {
      this.number = this.orderNumber;
      this.addServicesLoad();
    }
  }

  protected onDialogStateChange(isOpen: boolean): void {
    if (!isOpen) {
      this.close();
    }
  }

  protected isCompleted(item: IAddServiceInOrderLoad): boolean {
    return item.editable === 1;
  }

  protected isReadOnly(item: IAddServiceInOrderLoad): boolean {
    return this.orderLocked || this.isCompleted(item);
  }

  protected hasServiceInOrder(item: IAddServiceInOrderLoad): boolean {
    return item.sost === 1;
  }

  protected getServiceStatusLabel(item: IAddServiceInOrderLoad): string {
    return this.hasServiceInOrder(item) ? 'В заказе' : '';
  }

  protected getPriceControl(id: number): FormControl<number | null> {
    if (!this.priceControls[id]) {
      this.priceControls[id] = new FormControl<number | null>(0);
    }

    return this.priceControls[id];
  }

  protected getColControl(id: number): FormControl<number | null> {
    if (!this.colControls[id]) {
      this.colControls[id] = new FormControl<number | null>(1);
    }

    return this.colControls[id];
  }

  protected addService(item: IAddServiceInOrderLoad): void {
    if (this.orderLocked) {
      return;
    }

    this.addingServiceId = item.id;
    this.error = '';

    this.authService.add_service({
      token: this.authService.getAccessToken()!,
      number: this.number,
      id: item.id,
      price: this.getPriceControl(item.id).value ?? item.price,
      col: this.getColControl(item.id).value ?? 1,
    }).subscribe({
      next: (response) => {
        this.addingServiceId = null;

        if (response.user && response.user.result) {
          const targetService = this.data.find((service) => service.id === item.id);

          if (targetService) {
            targetService.sost = 1;
          }

          this.added.emit();
        } else {
          this.data = [];
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.addingServiceId = null;

        if (error.status === 401) {
          this.error = 'Сессия истекла, войдите снова';
        } else if (error.status === 0) {
          this.error = 'Не удалось соединиться с сервером';
        } else {
          this.error = error.error?.message || 'Ошибка добавления услуги';
        }

        this.cdr.detectChanges();
      }
    });
  }

  protected addServicesLoad(): void {
    this.loading = true;
    this.error = '';

    this.authService.add_services_in_order_load({
      token: this.authService.getAccessToken()!,
      number: this.number,
    }).subscribe({
      next: (response) => {
        this.loading = false;

        if (response.user && response.user.services) {
          this.data = response.user.services;
          this.priceControls = {};
          this.colControls = {};

          this.data.forEach((service) => {
            this.priceControls[service.id] = new FormControl<number | null>(service.price);
            this.colControls[service.id] = new FormControl<number | null>(1);
          });
        } else {
          this.data = [];
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

  protected close(): void {
    this.error = '';
    this.closed.emit();
  }
}
