import { Routes } from '@angular/router';
import { Home } from '../home/home';
import { Main } from '../main/main';
import { Orders } from '../main/orders/orders';
import { Profile } from '../main/profile/profile';
import { Stats } from '../main/stats/stats';
import { UserServices } from '../main/user_services/services';
import { Waiting } from '../main/waiting/waiting';
import { Workers } from '../main/workers/workers';

export const routes: Routes = [
  {
    path: 'main',
    component: Main,
    children: [
      {
        path: '',
        redirectTo: 'orders',
        pathMatch: 'full'
      },
      {
        path: 'orders',
        component: Orders,
        data: { title: 'Заказы' }
      },
      {
        path: 'services',
        component: UserServices,
        data: { title: 'Услуги' }
      },
      {
        path: 'workers',
        component: Workers,
        data: { title: 'Сотрудники' }
      },
      {
        path: 'stats',
        component: Stats,
        data: { title: 'Статистика' }
      },
      {
        path: 'waiting',
        component: Waiting,
        data: { title: 'Ожидающие' }
      },
      {
        path: 'profile',
        component: Profile,
        data: { title: 'Личный кабинет' }
      },
    ],
  },
  {
    path: '',
    component: Home,
  },
];
