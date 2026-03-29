import {CommonModule, NgForOf} from '@angular/common';
import {ChangeDetectorRef, Component, OnDestroy} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {TuiTable} from '@taiga-ui/addon-table';
import {TuiButton, TuiError, TuiLoader} from '@taiga-ui/core';
import {IAccessTokenSend, IService} from '../../app/interfaces/auth.interface';
import {AuthService} from '../../app/services/auth.service';
import {NewServiceComponent} from './new_service/new_services';
import {MoreServiceComponent} from './more_service/more_service';

@Component({
  selector: 'app-orders',
  imports: [
    CommonModule,
    NgForOf,
    FormsModule,
    TuiTable,
    TuiError,
    TuiLoader,
    NewServiceComponent,
    MoreServiceComponent,
    TuiButton,
  ],
  templateUrl: './services.html',
  styleUrls: ['./services.less']
})
export class UserServices implements OnDestroy {
  private readonly autoRefreshMs = 5 * 60 * 1000;
  private refreshTimerId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  columns = ['name', 'price l', 'price g', 'edit_button'];
  loading = false;
  error = '';
  data: IService[] = [];
  openNewService = false;
  openMoreService = false;
  selectedService: IService | undefined;

  ngOnInit(): void {
    this.refreshToken();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  onNewServiceClosed(): void {
    this.openNewService = false;
    this.loadServices();
    this.cdr.detectChanges();
  }

  onMoreServiceClosed(): void {
    this.openMoreService = false;
    this.selectedService = undefined;
    this.loadServices();
    this.cdr.detectChanges();
  }

  onServiceUpdated(service: IService): void {
    this.data = this.data.map((item) =>
      item.id === service.id ? service : item
    );
    this.selectedService = {...service};
    this.cdr.detectChanges();
    this.loadServices();
  }

  protected showNewService(): void {
    this.openNewService = true;
  }

  protected showMoreService(service: IService): void {
    this.selectedService = {...service};
    this.openMoreService = true;
    this.cdr.detectChanges();
  }

  refreshToken() {
    this.authService.refreshToken().subscribe({
      next: () => {
        this.loadServices();
      },
      error: (error) => {
        console.error('ServiceComponent: error', error);
        this.error = 'Ошибка обновления токена';
        this.cdr.detectChanges();
        this.loading = false;
        this.router.navigate(['/']);
      }
    })
  }

  loadServices(): void {
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

    const credentials: IAccessTokenSend = {
      token: token
    };

    this.authService.load_services(credentials).subscribe({
      next: (response) => {
        if (response.user && response.user.services) {
          this.data = response.user.services;
        } else {
          this.data = [];
        }

        if (this.selectedService) {
          const actualService = this.data.find((item) => item.id === this.selectedService?.id);
          if (actualService) {
            this.selectedService = {...actualService};
          }
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        if (error.status === 401) {
          this.error = 'Сессия истекла, войдите снова';
          this.router.navigate(['/']);
        } else if (error.status === 0) {
          this.error = 'Не удалось соединиться с сервером';
          this.router.navigate(['/']);
        } else {
          this.error = error.error?.message || 'Ошибка загрузки услуг';
          this.router.navigate(['/']);
        }

        this.loading = false;
        this.cdr.detectChanges();
      }
    });
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
