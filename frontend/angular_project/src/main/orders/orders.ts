import { CommonModule } from '@angular/common';
import {FormsModule} from '@angular/forms';
import {AsyncPipe, NgForOf} from '@angular/common';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy} from '@angular/core';
import {TuiTable, TuiTablePagination} from '@taiga-ui/addon-table';
import {TuiButton, TuiError, TuiFormatNumberPipe, TuiLoader} from '@taiga-ui/core';
import {ApiService} from '../../app/services/api.service';
import {TokenService} from '../../app/services/token.service';
import {Router} from '@angular/router';
import {IOrder, IOrdersSend} from '../../app/interfaces/auth.interface';
import {AuthService} from '../../app/services/auth.service';
import {NewOrderComponent} from './new_order/new_order';
import {MoreOrdersComponent} from './more_orders/more_orders';


@Component({
  selector: 'app-orders',
  imports: [
    CommonModule,
    NgForOf,
    FormsModule,
    AsyncPipe,
    TuiTable,
    TuiTablePagination,
    TuiFormatNumberPipe,
    TuiError,
    TuiLoader,
    NewOrderComponent,
    TuiButton,
    MoreOrdersComponent
  ],
  templateUrl: './orders.html',
  styleUrls: ['./orders.less']
})
export class Orders implements OnDestroy {
  private readonly paginationPageStorageKey = 'orders-table-page';
  private readonly paginationSizeStorageKey = 'orders-table-size';
  private readonly autoRefreshMs = 5 * 60 * 1000;
  private refreshTimerId: ReturnType<typeof setInterval> | null = null;
  protected readonly paginationItems = [10];
  protected page = 0;
  protected pageSize = 10;

  constructor(
    private apiService: ApiService,
    private tokenService: TokenService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ){}


  columns = ['number', 'name', 'client', 'date', 'sost', 'phone', 'type', 'price', 'button'];
  orders: IOrder[] = [];
  loading = false;
  error = '';
  data: IOrder[] = [];
  totalOrders = 0;
  OpenNewOrder = false;
  OpenMoreOrder = false;
  toSendData: IOrder | undefined;

  moreOrder(item:IOrder): void {
    this.toSendData=item;
    this.OpenMoreOrder=true;

  }



  ngOnInit(): void {
    this.restorePagination();
    this.refreshToken();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  protected showNewOrder(): void {
    this.OpenNewOrder= true;
  }

  refreshToken(){
    this.authService.refreshToken().subscribe({
      next: (response) => {
        console.log('OrdersComponent: токен обновлен успешно');
        this.loadOrders();
      },
      error: (error) => {
        console.error('OrdersComponent: ошибка', error);
        this.error = 'Ошибка обновления токена';
        this.cdr.detectChanges();
        this.loading = false;
        this.router.navigate(['/']);
      }
    })
  }

  onMoreOrderClosed(): void {
    this.OpenMoreOrder = false;
    this.loadOrders();
    this.cdr.detectChanges();
  }

  onNewOrderClosed(): void {
    this.OpenNewOrder = false;
    this.loadOrders()
    this.cdr.detectChanges();
  }

  loadOrders(): void {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    const token = this.authService.getAccessToken();

    if (!token) {
      this.error = 'Не авторизован';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    const credentials: IOrdersSend = {
      token,
      page: this.page,
      size: this.pageSize,
    };

    this.authService.get_orders(credentials).subscribe({
      next: (response) => {
        console.log('Заказы получены:', response);

        if (response.user && response.user.orders) {
          this.data = response.user.orders;
          this.page = response.user.page;
          this.pageSize = response.user.size;
          this.totalOrders = response.user.total;
          this.savePagination();
          console.log('Количество заказов:', this.data.length);
        } else {
          console.warn('Структура ответа не соответствует ожидаемой:', response);
          this.data = [];
          this.totalOrders = 0;
          this.page = 0;
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Ошибка при получении заказов:', error);

        if (error.status === 401) {
          this.error = 'Сессия истекла, войдите снова';
        } else if (error.status === 0) {
          this.error = 'Не удалось соединиться с сервером';
        } else {
          this.error = error.error?.message || 'Ошибка загрузки заказов';
        }

        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  protected getStatusClass(status: string): string {
    switch (status) {
      case 'Новый':
        return 'status-new';
      case 'В работе':
        return 'status-work';
      case 'Ждёт запчастей':
        return 'status-wait';
      case 'Ждет подтверждения':
      case 'Ждёт подтверждения':
        return 'status-confirmation';
      case 'Готов':
        return 'status-ready';
      case 'Закрыт':
        return 'status-closed';
      case 'Отменен':
        return 'status-cancelled';
      default:
        return 'status-closed';
    }
  }

  protected onPaginationChange(event: {page: number; size: number}): void {
    this.page = event.page;
    this.pageSize = event.size;
    this.savePagination();
    this.loadOrders();
  }

  private restorePagination(): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    const storedPage = Number(sessionStorage.getItem(this.paginationPageStorageKey));
    const storedSize = Number(sessionStorage.getItem(this.paginationSizeStorageKey));

    if (Number.isInteger(storedPage) && storedPage >= 0) {
      this.page = storedPage;
    }

    if (this.paginationItems.includes(storedSize)) {
      this.pageSize = storedSize;
    }
  }

  private savePagination(): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    sessionStorage.setItem(this.paginationPageStorageKey, String(this.page));
    sessionStorage.setItem(this.paginationSizeStorageKey, String(this.pageSize));
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
    return;
  }
}
