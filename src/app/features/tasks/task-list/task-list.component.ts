import { Component } from '@angular/core';
import { Task } from '../../../models/task.model';
import { Subscription } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionData } from '../../../models/session.model';
import { SessionState } from '../../../core/states/sessionState';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent {
  // Propiedades del componente
  tasksList: Task[] = [];
  showCompleted: boolean = false;
  isLoading: boolean = false;
  isUpdating: boolean = false;
  errorMessage: string = '';

  private session: SessionData;
  
  constructor(private sessionState: SessionState,
              private taskService: TaskService,
              private router: Router) {

    this.session = this.sessionState.currentSession;
    console.log("SESION ", this.session);
  }

  ngOnInit(): void {
    this.initializeComponent();
  }

  // Inicialización del componente
  private initializeComponent(): void {
    // Verificar si el usuario está autenticado
    // if (!this.sessionState.isAuthenticated) {
    //   console.log('Usuario no autenticado, redirigiendo al login');
    //   // this.router.navigate(['/login']);
    //   return;
    // }

    // // Suscribirse a cambios en la sesión
    // const sessionSub = this.sessionState.session$.subscribe(session => {
    //   if (!session.isAuthenticated) {
    //     console.log('Sesión terminada, redirigiendo al login');
    //     // this.router.navigate(['/login']);
    //   }
    // });
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    
    //const currentUser = this.sessionState.currentUser;
    // if (!currentUser) {
    //   this.errorMessage = 'Usuario no encontrado';
    //   this.isLoading = false;
    //   return;
    // }

    const emailUser = this.session.user ? this.session.user.email : '';
    console.log('USER: ', emailUser);
    const taskSub = this.taskService.getUserTasks(
      emailUser
    ).subscribe({
      next: (resp) => {
        const tasks = resp.data;
        console.log("TASKS: ", tasks);
        this.tasksList = this.filterTasks(tasks);
        console.log("TASK AFTER FILTER: ", this.tasksList)
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar tareas:', error);
        this.errorMessage = 'No se pudieron cargar las tareas. Inténtalo de nuevo.';
        this.isLoading = false;
      }
    });
  }

  private filterTasks(tasks: Task[]): Task[] {
    console.log("TASKS: ", tasks);
    const taskFiltered = tasks.filter(task => {
      console.log("TASK", task);
      if (!task.isActive) return false;
      return this.showCompleted ? task.isCompleted : !task.isCompleted;
    })
    return taskFiltered;
  }

  // Alternar vista entre completadas y pendientes
  toggleView(): void {
    this.showCompleted = !this.showCompleted;
    this.loadTasks();
  }

  toggleTaskCompletion(task: Task): void {
    if (this.isUpdating) return;
    
    if (task.isCompleted) return;

    this.isUpdating = true;

    const updatedTask: Partial<Task> = {
      ...task,
      isCompleted: true,
      updatedAt: new Date()
    };

    const updateSub = this.taskService.completeTask(task.id).subscribe({
      next: (result: Task) => {
        console.log('Tarea actualizada exitosamente:', result);
        
        // Actualizar la tarea en el array local
        const taskIndex = this.tasksList.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
          this.tasksList[taskIndex] = { ...this.tasksList[taskIndex], ...updatedTask } as Task;
        }

        // Si estamos viendo pendientes, remover la tarea completada de la vista
        if (!this.showCompleted) {
          this.tasksList = this.tasksList.filter(t => t.id !== task.id);
        }

        this.isUpdating = false;
      },
      error: (error: any) => {
        console.error('Error al actualizar tarea:', error);
        this.errorMessage = 'No se pudo completar la tarea. Inténtalo de nuevo.';
        this.isUpdating = false;
      }
    });
  }

  createNewTask(): void {
    if (this.showCompleted) {
      return;
    }

    console.log('Navegando a crear nueva tarea');
    
    console.log('Usuario actual:', this.session.user);
  }

  logout(): void {
    this.sessionState.clearSession();
    
    this.tasksList = [];
    this.showCompleted = false;
    this.errorMessage = '';
    
    console.log('Sesión cerrada exitosamente');
    
    // Redirigir al login
    this.router.navigate(['/login']);
  }

  // Verificar si hay tareas
  get hasTasks(): boolean {
    return this.tasksList.length > 0;
  }

  // Manejar reintentos de carga
  retryLoadTasks(): void {
    this.errorMessage = '';
    this.loadTasks();
  }
}
