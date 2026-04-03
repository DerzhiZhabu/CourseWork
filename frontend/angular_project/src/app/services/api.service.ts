import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ILoginSend,
  ILoginReceive,
  IRegisterSend,
  IRegisterReceive,
  IAccessTokenSend,
  IOrdersReceive,
  INewOrderReceive,
  INewOrderSend,
  IServicesReceive,
  INewServiceSend,
  INewServiceReceive,
  IUpdateServiceSend,
  IUpdateServiceReceive,
  INewWorkerReceive,
  INewWorkerSend,
  IUpdateWorkerReceive,
  IUpdateWorkerSend,
  IUpdateOrderSend,
  IUpdateOrdersReceive,
  IServicesInOrderSend,
  IServicesInOrderReceive,
  IAddServicesInOrderLoadReceive,
  IAddServicesInOrderLoadSend,
  IAddServiceSend,
  IAddServiceResieve,
  ICompleteOrderServiceSend,
  ICompleteOrderServiceReceive,
  IUndoOrderServiceSend,
  IUndoOrderServiceReceive,
  IDeleteOrderServiceSend,
  IDeleteOrderServiceReceive,
  ILoadWorkersSend,
  ILoadWorkersReceive,
  ILoadWorkerServiceSend,
  ILoadWorkerServicesReceive,
  IProfileReceive,
  IChangePasswordSend,
  IChangePasswordReceive,
  IDeleteChildUserSend,
  IDeleteChildUserReceive,
  ILoadChildUsersReceive,
  INewChildUserSend,
  INewChildUserReceive,
  IOrdersSend,
  IStatsReceive,
  IStatsSend
} from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  login(data: ILoginSend): Observable<ILoginReceive> {
    return this.http.post<ILoginReceive>(`${this.apiUrl}/login`, data, {
      withCredentials: true
    });
  }

  profile(data: IAccessTokenSend): Observable<IProfileReceive> {
    return this.http.post<IProfileReceive>(`${this.apiUrl}/profile`, data, {
      withCredentials: true
    });
  }

  change_password(data: IChangePasswordSend): Observable<IChangePasswordReceive> {
    return this.http.post<IChangePasswordReceive>(`${this.apiUrl}/changepassword`, data, {
      withCredentials: true
    });
  }

  load_child_users(data: IAccessTokenSend): Observable<ILoadChildUsersReceive> {
    return this.http.post<ILoadChildUsersReceive>(`${this.apiUrl}/childusers`, data, {
      withCredentials: true
    });
  }

  new_child_user(data: INewChildUserSend): Observable<INewChildUserReceive> {
    return this.http.post<INewChildUserReceive>(`${this.apiUrl}/newchilduser`, data, {
      withCredentials: true
    });
  }

  delete_child_user(data: IDeleteChildUserSend): Observable<IDeleteChildUserReceive> {
    return this.http.post<IDeleteChildUserReceive>(`${this.apiUrl}/deletechilduser`, data, {
      withCredentials: true
    });
  }

  new_order(data: INewOrderSend): Observable<INewOrderReceive> {
    return this.http.post<INewOrderReceive>(`${this.apiUrl}/neworder`, data, {
      withCredentials: true
    });
  }

  add_service(data: IAddServiceSend): Observable<IAddServiceResieve> {
    return this.http.post<IAddServiceResieve>(`${this.apiUrl}/addservice`, data, {
      withCredentials: true
    });
  }

  complete_order_service(data: ICompleteOrderServiceSend): Observable<ICompleteOrderServiceReceive> {
    return this.http.post<ICompleteOrderServiceReceive>(`${this.apiUrl}/completeorderservice`, data, {
      withCredentials: true
    });
  }

  undo_order_service(data: IUndoOrderServiceSend): Observable<IUndoOrderServiceReceive> {
    return this.http.post<IUndoOrderServiceReceive>(`${this.apiUrl}/undoorderservice`, data, {
      withCredentials: true
    });
  }

  delete_order_service(data: IDeleteOrderServiceSend): Observable<IDeleteOrderServiceReceive> {
    return this.http.post<IDeleteOrderServiceReceive>(`${this.apiUrl}/deleteorderservice`, data, {
      withCredentials: true
    });
  }

  services_in_order(data: IServicesInOrderSend): Observable<IServicesInOrderReceive> {
    return this.http.post<IServicesInOrderReceive>(`${this.apiUrl}/servicesinorder`, data, {
      withCredentials: true
    });
  }

  add_services_in_order_load(data: IAddServicesInOrderLoadSend): Observable<IAddServicesInOrderLoadReceive> {
    return this.http.post<IAddServicesInOrderLoadReceive>(`${this.apiUrl}/addservicesinorderload`, data, {
      withCredentials: true
    });
  }

  update_order(data: IUpdateOrderSend): Observable<IUpdateOrdersReceive> {
    return this.http.post<IUpdateOrdersReceive>(`${this.apiUrl}/updateorder`, data, {
      withCredentials: true
    });
  }

  update_worker(data: IUpdateWorkerSend): Observable<IUpdateWorkerReceive> {
    return this.http.post<IUpdateWorkerReceive>(`${this.apiUrl}/updateworker`, data, {
      withCredentials: true
    });
  }

  new_service(data: INewServiceSend): Observable<INewServiceReceive> {
    return this.http.post<INewServiceReceive>(`${this.apiUrl}/newservice`, data, {
      withCredentials: true
    });
  }

  update_service(data: IUpdateServiceSend): Observable<IUpdateServiceReceive> {
    return this.http.post<IUpdateServiceReceive>(`${this.apiUrl}/updateservice`, data, {
      withCredentials: true
    });
  }

  new_worker(data: INewWorkerSend): Observable<INewWorkerReceive> {
    return this.http.post<INewWorkerReceive>(`${this.apiUrl}/newworker`, data, {
      withCredentials: true
    });
  }

  load_services(data: IAccessTokenSend): Observable<IServicesReceive> {
    return this.http.post<IServicesReceive>(`${this.apiUrl}/userservices`, data, {
      withCredentials: true
    });
  }

  load_worker_services(data: ILoadWorkerServiceSend): Observable<ILoadWorkerServicesReceive> {
    return this.http.post<ILoadWorkerServicesReceive>(`${this.apiUrl}/loadworkerservices`, data, {
      withCredentials: true
    });
  }

  stats(data: IStatsSend): Observable<IStatsReceive> {
    return this.http.post<IStatsReceive>(`${this.apiUrl}/stats`, data, {
      withCredentials: true
    });
  }

  print_worker_services(data: ILoadWorkerServiceSend): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/printworkerservices`, data, {
      withCredentials: true,
      responseType: 'blob'
    });
  }

  load_workers(data: ILoadWorkersSend): Observable<ILoadWorkersReceive> {
    return this.http.post<ILoadWorkersReceive>(`${this.apiUrl}/loadworkers`, data, {
      withCredentials: true
    });
  }

  loginWithRefresh(): Observable<ILoginReceive> {
    return this.http.post<ILoginReceive>(`${this.apiUrl}/loginwithrefr`,{}, {
      withCredentials: true
    });
  }

  get_orders(data: IOrdersSend): Observable<IOrdersReceive> {
    return this.http.post<IOrdersReceive>(`${this.apiUrl}/orders`, data, {
      withCredentials: true
    });
  }

  refreshToken(): Observable<ILoginReceive> {
    return this.http.post<ILoginReceive>(`${this.apiUrl}/refresh`, {}, {
      withCredentials: true
    });
  }

  register(data: IRegisterSend): Observable<IRegisterReceive> {
    return this.http.post<IRegisterReceive>(`${this.apiUrl}/register`, data, {
      withCredentials: true
    });
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {}, {
      withCredentials: true
    });
  }
}
