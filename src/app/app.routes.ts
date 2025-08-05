import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(
            m => m.LoginComponent
        )
    },
    {
        path: 'tasks',
        loadComponent: () => import('./features/tasks/task-list/task-list.component').then(
            m => m.TaskListComponent
        ),
        canActivate: [AuthGuard]
    },
    {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
