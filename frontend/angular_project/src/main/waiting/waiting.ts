import { CommonModule, NgForOf } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TuiTable, TuiTablePagination } from '@taiga-ui/addon-table';
import { TuiButton, TuiError, TuiLoader } from '@taiga-ui/core';
import { IOrder, IOrdersSend } from '../../app/interfaces/auth.interface';
import { AuthService } from '../../app/services/auth.service';
import { MoreOrdersComponent } from '../orders/more_orders/more_orders';

@Component({
  selector: 'app-waiting',
  imports: [
    CommonModule,
    NgForOf,
    TuiTable,
    TuiTablePagination,
    TuiError,
    TuiLoader,
    TuiButton,
    MoreOrdersComponent,
  ],
  templateUrl: './waiting.html',
  styleUrls: ['./waiting.less']
})
export class Waiting implements OnDestroy {
  private readonly paginationPageStorageKey = 'waiting-table-page';
  private readonly paginationSizeStorageKey = 'waiting-table-size';
  private readonly autoRefreshMs = 5 * 60 * 1000;
  private refreshTimerId: ReturnType<typeof setInterval> | null = null;
  protected readonly paginationItems = [10];
  protected page = 0;
  protected pageSize = 10;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  columns = ['number', 'name', 'client', 'date', 'sost', 'phone', 'type', 'price', 'button'];
  loading = false;
  error = '';
  data: IOrder[] = [];
  totalOrders = 0;
  openMoreOrder = false;
  selectedOrder: IOrder | undefined;

  ngOnInit(): void {
    this.restorePagination();
    this.refreshToken();
    this.startAutoRefresh();

    this.authService.waitingOrdersChanged$.subscribe(() => {
      this.loadOrders();
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  protected moreOrder(item: IOrder): void {
    this.selectedOrder = item;
    this.openMoreOrder = true;
  }

  protected onMoreOrderClosed(): void {
    this.openMoreOrder = false;
    this.selectedOrder = undefined;
    this.loadOrders();
    this.cdr.detectChanges();
  }

  protected refreshToken(): void {
    this.authService.refreshToken().subscribe({
      next: () => {
        this.loadOrders();
      },
      error: (error) => {
        console.error('WaitingComponent: ошибка', error);
        this.error = 'Ошибка обновления токена';
        this.cdr.detectChanges();
        this.loading = false;
        this.router.navigate(['/']);
      }
    });
  }

  protected loadOrders(): void {
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
      mode: 'waiting',
    };

    this.authService.get_orders(credentials).subscribe({
      next: (response) => {
        if (response.user && response.user.orders) {
          this.data = response.user.orders;
          this.page = response.user.page;
          this.pageSize = response.user.size;
          this.totalOrders = response.user.total;
          this.savePagination();
        } else {
          this.data = [];
          this.totalOrders = 0;
          this.page = 0;
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
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
      case 'Ждет подтверждения':
      case 'Ждёт подтверждения':
        return 'status-confirmation';
      case 'Готов':
        return 'status-ready';
      default:
        return 'status-ready';
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
  }
}
