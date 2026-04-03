import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, catchError, tap, throwError } from 'rxjs';
import {
  IAccessTokenSend,
  IAddServiceResieve,
  IAddServiceSend,
  IAddServicesInOrderLoadReceive,
  IAddServicesInOrderLoadSend,
  IChangePasswordReceive,
  IChangePasswordSend,
  IChildUser,
  ICompleteOrderServiceReceive,
  ICompleteOrderServiceSend,
  IDeleteChildUserReceive,
  IDeleteChildUserSend,
  IDeleteOrderServiceReceive,
  IDeleteOrderServiceSend,
  IUndoOrderServiceReceive,
  IUndoOrderServiceSend,
  ILoadChildUsersReceive,
  ILoadWorkerServiceSend,
  ILoadWorkerServicesReceive,
  ILoadWorkersReceive,
  ILoadWorkersSend,
  ILoginReceive,
  ILoginSend,
  INewOrderReceive,
  INewOrderSend,
  INewServiceReceive,
  INewServiceSend,
  INewWorkerReceive,
  INewWorkerSend,
  IOrdersReceive,
  IProfileReceive,
  IRegisterReceive,
  IRegisterSend,
  INewChildUserReceive,
  INewChildUserSend,
  IOrdersSend,
  IStatsReceive,
  IStatsSend,
  IServicesInOrderReceive,
  IServicesInOrderSend,
  IServicesReceive,
  IUpdateOrderSend,
  IUpdateOrdersReceive,
  IUpdateServiceReceive,
  IUpdateServiceSend,
  IUpdateWorkerReceive,
  IUpdateWorkerSend,
} from '../interfaces/auth.interface';
import { ApiService } from './api.service';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private waitingOrdersChangedSubject = new Subject<void>();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public waitingOrdersChanged$ = this.waitingOrdersChangedSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private tokenService: TokenService,
    private router: Router
  ) {
    const hasToken = this.tokenService.hasValidToken();
    this.isAuthenticatedSubject.next(hasToken);
  }

  login(credentials: ILoginSend): Observable<ILoginReceive> {
    return this.apiService.login(credentials).pipe(
      tap(response => {
        if (response.user.accesToken) {
          this.tokenService.setAccessToken(response.user.accesToken);
          this.isAuthenticatedSubject.next(true);
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  refreshToken(): Observable<ILoginReceive> {
    return this.apiService.loginWithRefresh().pipe(
      tap(response => {
        if (response.user.accesToken) {
          this.tokenService.setAccessToken(response.user.accesToken);
          this.isAuthenticatedSubject.next(true);
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  profile(credentials: IAccessTokenSend): Observable<IProfileReceive> {
    return this.apiService.profile(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  change_password(credentials: IChangePasswordSend): Observable<IChangePasswordReceive> {
    return this.apiService.change_password(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  load_child_users(credentials: IAccessTokenSend): Observable<ILoadChildUsersReceive> {
    return this.apiService.load_child_users(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  new_child_user(credentials: INewChildUserSend): Observable<INewChildUserReceive> {
    return this.apiService.new_child_user(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  delete_child_user(credentials: IDeleteChildUserSend): Observable<IDeleteChildUserReceive> {
    return this.apiService.delete_child_user(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  get_orders(credentials: IOrdersSend): Observable<IOrdersReceive> {
    return this.apiService.get_orders(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  load_services(credentials: IAccessTokenSend): Observable<IServicesReceive> {
    return this.apiService.load_services(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  load_worker_services(credentials: ILoadWorkerServiceSend): Observable<ILoadWorkerServicesReceive> {
    return this.apiService.load_worker_services(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  stats(credentials: IStatsSend): Observable<IStatsReceive> {
    return this.apiService.stats(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  print_worker_services(credentials: ILoadWorkerServiceSend): Observable<Blob> {
    return this.apiService.print_worker_services(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  load_workers(credentials: ILoadWorkersSend): Observable<ILoadWorkersReceive> {
    return this.apiService.load_workers(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  new_order(credentials: INewOrderSend): Observable<INewOrderReceive> {
    return this.apiService.new_order(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  add_service(credentials: IAddServiceSend): Observable<IAddServiceResieve> {
    return this.apiService.add_service(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  complete_order_service(credentials: ICompleteOrderServiceSend): Observable<ICompleteOrderServiceReceive> {
    return this.apiService.complete_order_service(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  undo_order_service(credentials: IUndoOrderServiceSend): Observable<IUndoOrderServiceReceive> {
    return this.apiService.undo_order_service(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  delete_order_service(credentials: IDeleteOrderServiceSend): Observable<IDeleteOrderServiceReceive> {
    return this.apiService.delete_order_service(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  services_in_order(credentials: IServicesInOrderSend): Observable<IServicesInOrderReceive> {
    return this.apiService.services_in_order(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  add_services_in_order_load(credentials: IAddServicesInOrderLoadSend): Observable<IAddServicesInOrderLoadReceive> {
    return this.apiService.add_services_in_order_load(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  update_order(credentials: IUpdateOrderSend): Observable<IUpdateOrdersReceive> {
    return this.apiService.update_order(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  update_worker(credentials: IUpdateWorkerSend): Observable<IUpdateWorkerReceive> {
    return this.apiService.update_worker(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  new_service(credentials: INewServiceSend): Observable<INewServiceReceive> {
    return this.apiService.new_service(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  update_service(credentials: IUpdateServiceSend): Observable<IUpdateServiceReceive> {
    return this.apiService.update_service(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  new_worker(credentials: INewWorkerSend): Observable<INewWorkerReceive> {
    return this.apiService.new_worker(credentials).pipe(
      catchError(error => throwError(() => error))
    );
  }

  register(userData: IRegisterSend): Observable<IRegisterReceive> {
    return this.apiService.register(userData).pipe(
      tap(response => {
        if (response.user.acces_token) {
          this.tokenService.setAccessToken(response.user.acces_token);
          this.isAuthenticatedSubject.next(true);
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  logout(): void {
    this.apiService.logout().subscribe({
      next: () => {
        this.tokenService.clearAccessToken();
        this.isAuthenticatedSubject.next(false);
        this.router.navigate(['/']);
      },
      error: () => {
        this.tokenService.clearAccessToken();
        this.isAuthenticatedSubject.next(false);
        this.router.navigate(['/']);
      }
    });
  }

  isAuthenticated(): boolean {
    return this.tokenService.hasValidToken();
  }

  getAccessToken(): string | null {
    return this.tokenService.getAccessToken();
  }

  notifyWaitingOrdersChanged(): void {
    this.waitingOrdersChangedSubject.next();
  }
}
