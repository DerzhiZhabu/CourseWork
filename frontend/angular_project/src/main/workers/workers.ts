import {CommonModule} from '@angular/common';
import {NgForOf} from '@angular/common';
import {ChangeDetectorRef, Component, OnDestroy} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {TuiTable} from '@taiga-ui/addon-table';
import {TuiButton, TuiError, TuiLoader} from '@taiga-ui/core';
import {ILoadWorkersSend, IWorkers} from '../../app/interfaces/auth.interface';
import {AuthService} from '../../app/services/auth.service';
import {ApiService} from '../../app/services/api.service';
import {TokenService} from '../../app/services/token.service';
import {MoreWorkersComponent} from './more_workers/more_workers';
import {NewWorkerComponent} from './new_worker/new_worker';

@Component({
  selector: 'app-workers',
  imports: [
    CommonModule,
    NgForOf,
    FormsModule,
    TuiTable,
    TuiButton,
    TuiError,
    TuiLoader,
    MoreWorkersComponent,
    NewWorkerComponent
  ],
  templateUrl: './workers.html',
  styleUrls: ['./workers.less']
})
export class Workers implements OnDestroy {
  private readonly autoRefreshMs = 5 * 60 * 1000;
  private refreshTimerId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private apiService: ApiService,
    private tokenService: TokenService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  columns = ['surname', 'name', 'patronimic', 'sost', 'edit_button'];
  data: IWorkers[] = [];
  loading = false;
  error = '';
  openMoreWorkers = false;
  openNewWorker = false;
  selectedWorker: IWorkers | undefined;

  ngOnInit(): void {
    this.refreshToken();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  refreshToken() {
    this.authService.refreshToken().subscribe({
      next: () => {
        this.loadWorkers();
      },
      error: (error) => {
        console.error('OrdersComponent: error', error);
        this.error = 'Ошибка обновления токена';
        this.cdr.detectChanges();
        this.loading = false;
        this.router.navigate(['/']);
      }
    })
  }

  loadWorkers(): void {
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

    const credentials: ILoadWorkersSend = {
      token: token
    };

    this.authService.load_workers(credentials).subscribe({
      next: (response) => {
        if (response.user && response.user.result) {
          this.data = this.sortWorkers(response.user.result.map((worker) => ({
            ...worker,
            status: this.normalizeStatus(worker.status),
          })));
        } else {
          this.data = [];
        }

        if (this.selectedWorker) {
          const actualWorker = this.data.find((item) => item.id === this.selectedWorker?.id);
          if (actualWorker) {
            this.selectedWorker = {...actualWorker};
          }
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
          this.error = error.error?.message || 'Ошибка загрузки работников';
        }

        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onOpenMoreWorker(worker: IWorkers): void {
    this.selectedWorker = {...worker};
    this.openMoreWorkers = true;
    this.cdr.detectChanges();
  }

  showNewWorker(): void {
    this.openNewWorker = true;
  }

  onCloseMoreWorker(): void {
    this.openMoreWorkers = false;
    this.selectedWorker = undefined;
    this.loadWorkers();
  }

  onCloseNewWorker(): void {
    this.openNewWorker = false;
    this.loadWorkers();
  }

  onWorkerUpdated(worker: IWorkers): void {
    this.data = this.sortWorkers(this.data.map((item) =>
      item.id === worker.id ? {...item, ...worker, status: this.normalizeStatus(worker.status)} : item
    ));
    this.selectedWorker = {...worker, status: this.normalizeStatus(worker.status)};
    this.cdr.detectChanges();
    this.loadWorkers();
  }

  private sortWorkers(workers: IWorkers[]): IWorkers[] {
    return [...workers].sort((left, right) => {
      if (left.status !== right.status) {
        return left.status ? -1 : 1;
      }

      const surnameCompare = left.surname.localeCompare(right.surname, 'ru', {sensitivity: 'base'});
      if (surnameCompare !== 0) {
        return surnameCompare;
      }

      const nameCompare = left.name.localeCompare(right.name, 'ru', {sensitivity: 'base'});
      if (nameCompare !== 0) {
        return nameCompare;
      }

      return left.patronimic.localeCompare(right.patronimic, 'ru', {sensitivity: 'base'});
    });
  }

  private normalizeStatus(status: boolean | string | number | null | undefined): boolean {
    if (typeof status === 'boolean') {
      return status;
    }

    if (typeof status === 'number') {
      return status === 1;
    }

    if (typeof status === 'string') {
      const normalized = status.trim().toLowerCase();
      return normalized === 'true' || normalized === '1' || normalized === 'активен';
    }

    return false;
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
