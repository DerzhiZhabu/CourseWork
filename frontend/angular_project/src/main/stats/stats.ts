import {CommonModule, DecimalPipe, NgForOf, NgIf} from '@angular/common';
import {ChangeDetectorRef, Component, OnDestroy} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {TuiTable} from '@taiga-ui/addon-table';
import {TuiDay} from '@taiga-ui/cdk';
import {TuiButton, TuiError, TuiLoader, TuiTextfield} from '@taiga-ui/core';
import {TuiInputDate} from '@taiga-ui/kit';
import {
  IStatsSalaryRow,
  IStatsServiceRow,
  IStatsSend,
  IWorkers,
} from '../../app/interfaces/auth.interface';
import {AuthService} from '../../app/services/auth.service';
import {MoreWorkersComponent} from '../workers/more_workers/more_workers';

type StatsTab = 'salary' | 'services' | 'profit';

@Component({
  selector: 'app-stats',
  imports: [
    CommonModule,
    NgForOf,
    NgIf,
    FormsModule,
    DecimalPipe,
    TuiButton,
    TuiError,
    TuiInputDate,
    TuiLoader,
    TuiTable,
    TuiTextfield,
    MoreWorkersComponent,
  ],
  templateUrl: './stats.html',
  styleUrls: ['./stats.less']
})
export class Stats implements OnDestroy {
  private readonly autoRefreshMs = 5 * 60 * 1000;
  private refreshTimerId: ReturnType<typeof setInterval> | null = null;
  protected readonly salaryColumns = ['fio', 'salary', 'button'];
  protected readonly serviceColumns = ['name', 'income'];
  protected readonly profitColumns = ['title', 'amount'];

  protected readonly salaryTab: StatsTab = 'salary';
  protected readonly servicesTab: StatsTab = 'services';
  protected readonly profitTab: StatsTab = 'profit';

  protected activeTab: StatsTab = this.salaryTab;
  protected dateStart: TuiDay | null = this.getMonthStart();
  protected dateEnd: TuiDay | null = this.getToday();
  protected loading = false;
  protected error = '';

  protected salaryRows: IStatsSalaryRow[] = [];
  protected salaryTotal = 0;
  protected salaryAverage = 0;
  protected serviceRows: IStatsServiceRow[] = [];
  protected servicesTotal = 0;
  protected revenueTotal = 0;
  protected netProfit = 0;
  protected profitRows: Array<{title: string; amount: number}> = [
    {title: 'Общая прибыль заказов', amount: 0},
    {title: 'Сумма зарплат', amount: 0},
  ];

  protected openMoreWorker = false;
  protected selectedWorker: IWorkers | undefined;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.refreshToken();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  protected setActiveTab(tab: StatsTab): void {
    this.activeTab = tab;
  }

  protected onApplyPeriod(): void {
    if (!this.hasValidPeriod()) {
      this.error = 'Выберите обе даты периода';
      this.cdr.detectChanges();
      return;
    }

    this.loadStats();
  }

  protected getWorkerFullName(worker: IStatsSalaryRow): string {
    return [worker.surname, worker.name, worker.patronimic].filter(Boolean).join(' ');
  }

  protected onOpenWorkerDetails(worker: IStatsSalaryRow): void {
    this.selectedWorker = {
      id: worker.id,
      name: worker.name,
      surname: worker.surname,
      patronimic: worker.patronimic,
      procent: worker.procent,
      status: worker.status,
    };
    this.openMoreWorker = true;
  }

  protected onCloseWorkerDetails(): void {
    this.openMoreWorker = false;
    this.selectedWorker = undefined;
  }

  protected onWorkerUpdated(worker: IWorkers): void {
    this.salaryRows = this.salaryRows.map((item) =>
      item.id === worker.id
        ? {
            ...item,
            name: worker.name,
            surname: worker.surname,
            patronimic: worker.patronimic,
            procent: worker.procent,
            status: worker.status,
          }
        : item
    );

    if (this.selectedWorker?.id === worker.id) {
      this.selectedWorker = {...worker};
    }

    this.cdr.detectChanges();
  }

  private refreshToken(): void {
    this.loading = true;
    this.error = '';

    this.authService.refreshToken().subscribe({
      next: () => {
        this.loadStats();
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/']);
      }
    });
  }

  private loadStats(): void {
    const token = this.authService.getAccessToken();

    if (!token) {
      this.router.navigate(['/']);
      return;
    }

    if (!this.hasValidPeriod()) {
      this.loading = false;
      this.error = 'Выберите обе даты периода';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    const credentials: IStatsSend = {
      token,
      dateStart: this.toRequestDate(this.dateStart, false),
      dateEnd: this.toRequestDate(this.dateEnd, true),
    };

    this.authService.stats(credentials).subscribe({
      next: (response) => {
        this.salaryRows = response.user.salaryRows || [];
        this.salaryTotal = response.user.salaryTotal || 0;
        this.salaryAverage = response.user.salaryAverage || 0;
        this.serviceRows = response.user.serviceRows || [];
        this.servicesTotal = response.user.servicesTotal || 0;
        this.revenueTotal = response.user.revenueTotal || 0;
        this.netProfit = response.user.netProfit || 0;
        this.profitRows = [
          {title: 'Общая прибыль заказов', amount: this.revenueTotal},
          {title: 'Сумма зарплат', amount: this.salaryTotal},
        ];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 401) {
          this.router.navigate(['/']);
          return;
        }

        if (error.status === 0) {
          this.error = 'Не удалось соединиться с сервером';
        } else {
          this.error = error.error?.error || 'Ошибка загрузки статистики';
        }
        this.cdr.detectChanges();
      }
    });
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

  private toRequestDate(value: TuiDay, isEndOfDay: boolean): string {
    const suffix = isEndOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
    return `${value.year}-${this.padDatePart(value.month + 1)}-${this.padDatePart(value.day)}${suffix}`;
  }

  private padDatePart(value: number): string {
    return String(value).padStart(2, '0');
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
