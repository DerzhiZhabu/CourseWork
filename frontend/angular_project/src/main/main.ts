import {TuiButton} from "@taiga-ui/core";
import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {AuthService} from '../app/services/auth.service';
import {TuiBadgeNotification, TuiBadgedContent} from '@taiga-ui/kit';
import {filter} from 'rxjs';

@Component({
  selector: 'app-main',
  imports: [
    TuiButton,
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TuiBadgedContent,
    TuiBadgeNotification,
  ],
  templateUrl: './main.html',
  styleUrl: './main.less'
})
export class Main implements OnInit, OnDestroy {
  private readonly autoRefreshMs = 5 * 60 * 1000;
  private refreshTimerId: ReturnType<typeof setInterval> | null = null;
  isExpanded = false;
  waitingOrdersCount = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  menuItems = [
    { id: 'ordes', icon: '@tui.list', text: 'Заказы', link: '/main/orders'},
    { id: 'services', icon: '@tui.hammer', text: 'Услуги', link: '/main/services' },
    { id: 'workers', icon: '@tui.book-user', text: 'Сотрудники', link: '/main/workers' },
    { id: 'stats', icon: '@tui.chart-bar', text: 'Статистика', link: '/main/stats' },
  ];

  waitingItem = { id: 'waiting', icon: '@tui.clock', text: 'Ожидающие', link: '/main/waiting' };
  profileItem = { id: 'profile', icon: '@tui.user', text: 'Личный кабинет', link: '/main/profile' };
  logoutItem = { id: 'logout', icon: '@tui.log-out', text: 'Выйти' };

  ngOnInit(): void {
    this.refreshWaitingOrdersCount();
    this.startAutoRefresh();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.refreshWaitingOrdersCount();
      });

    this.authService.waitingOrdersChanged$.subscribe(() => {
      this.refreshWaitingOrdersCount();
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  onMenuClick(itemId: string): void {
    if (itemId === 'profile') {
      this.router.navigate(['/main/profile']);
      return;
    }

    if (itemId === 'logout') {
      this.authService.logout();
    }
  }

  private refreshWaitingOrdersCount(): void {
    const token = this.authService.getAccessToken();

    if (token) {
      this.loadWaitingOrdersCount(token);
      return;
    }

    this.authService.refreshToken().subscribe({
      next: (response) => {
        const refreshedToken = response.user.accesToken || this.authService.getAccessToken();

        if (!refreshedToken) {
          this.waitingOrdersCount = 0;
          this.cdr.detectChanges();
          return;
        }

        this.loadWaitingOrdersCount(refreshedToken);
      },
      error: () => {
        this.waitingOrdersCount = 0;
        this.cdr.detectChanges();
      }
    });
  }

  private loadWaitingOrdersCount(token: string): void {
    this.authService.get_orders({
      token,
      page: 0,
      size: 1,
      mode: 'waiting',
    }).subscribe({
      next: (response) => {
        this.waitingOrdersCount = response.user?.total ?? 0;
        this.cdr.detectChanges();
      },
      error: () => {
        this.waitingOrdersCount = 0;
        this.cdr.detectChanges();
      }
    });
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.refreshTimerId = setInterval(() => {
      this.refreshWaitingOrdersCount();
    }, this.autoRefreshMs);
  }

  private stopAutoRefresh(): void {
    if (this.refreshTimerId !== null) {
      clearInterval(this.refreshTimerId);
      this.refreshTimerId = null;
    }
  }
}
