import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'pantry',
        loadComponent: () =>
          import('../pages/pantry/pantry.page').then((m) => m.PantryPage),
      },
      {
        path: 'reservations',
        loadComponent: () =>
          import('../pages/my-reservations/my-reservations.page').then((m) => m.MyReservationsPage),
      },
      {
        path: '',
        redirectTo: 'pantry',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/pantry',
    pathMatch: 'full',
  },
];
