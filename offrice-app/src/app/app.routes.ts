import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth.page').then( m => m.AuthPage)
  },
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
    canActivate: [authGuard]
  },
  {
    path: 'add-item',
    loadComponent: () => import('./pages/add-item/add-item.page').then( m => m.AddItemPage),
    canActivate: [authGuard]
  },
  {
    path: 'item-detail',
    loadComponent: () => import('./pages/item-detail/item-detail.page').then( m => m.ItemDetailPage),
    canActivate: [authGuard]
  },
  {
    path: 'my-reservations',
    loadComponent: () => import('./pages/my-reservations/my-reservations.page').then( m => m.MyReservationsPage),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/tabs/pantry',
    pathMatch: 'full'
  }
];
