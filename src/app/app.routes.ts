import { Routes } from '@angular/router';

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
        )
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
