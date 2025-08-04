import { Component } from '@angular/core';
import { Task } from '../../../models/task.model';
import { Subscription } from 'rxjs';
import { SessionState } from '../../../core/states/sessionState';
import { TaskService } from '../../../core/services/task.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent {
  // Propiedades del componente
  tasks: Task[] = [];
  showCompleted: boolean = false;
  isLoading: boolean = false;
  isUpdating: boolean = false;
  errorMessage: string = '';
  
  // Subscripciones
  private subscriptions = new Subscription();

  constructor(
    private sessionState: SessionState,
    private taskService: TaskService // Tu servicio de tareas - ajusta según tu implementación
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Inicialización del componente
  private initializeComponent(): void {
    // Verificar si el usuario está autenticado
    // if (!this.sessionState.isAuthenticated) {
    //   console.log('Usuario no autenticado, redirigiendo al login');
    //   // this.router.navigate(['/login']);
    //   return;
    // }

    // Suscribirse a cambios en la sesión
    const sessionSub = this.sessionState.session$.subscribe(session => {
      if (!session.isAuthenticated) {
        console.log('Sesión terminada, redirigiendo al login');
        // this.router.navigate(['/login']);
      }
    });

    this.subscriptions.add(sessionSub);

    // Cargar tareas iniciales
    this.loadTasks();
  }

  // Cargar tareas desde el servicio
  loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const currentUser = this.sessionState.currentUser;
    if (!currentUser) {
      this.errorMessage = 'Usuario no encontrado';
      this.isLoading = false;
      return;
    }

    // Determinar qué tareas cargar basado en el estado actual
    const loadCompletedTasks = this.showCompleted;
    
    // Llamada al servicio - ajusta según tu implementación
    const taskSub = this.taskService.getUserTasks(
      currentUser.email
    ).subscribe({
      next: (tasks: Task[]) => {
        // Filtrar tareas según el estado requerido
        this.tasks = this.filterTasks(tasks);
        this.isLoading = false;
        
        // Registrar actividad del usuario
        this.sessionState.updateActivity();
      },
      error: (error: any) => {
        console.error('Error al cargar tareas:', error);
        this.errorMessage = 'No se pudieron cargar las tareas. Inténtalo de nuevo.';
        this.isLoading = false;
      }
    });

    this.subscriptions.add(taskSub);
  }

  // Filtrar tareas según el estado actual de vista
  private filterTasks(tasks: Task[]): Task[] {
    return tasks.filter(task => {
      // Solo mostrar tareas activas
      if (!task.isActive) return false;
      
      // Filtrar por completadas o pendientes
      return this.showCompleted ? task.isCompleted : !task.isCompleted;
    });
  }

  // Alternar vista entre completadas y pendientes
  toggleView(): void {
    this.showCompleted = !this.showCompleted;
    this.loadTasks();
  }

  // Marcar/desmarcar tarea como completada
  toggleTaskCompletion(task: Task): void {
    // Prevenir múltiples actualizaciones simultáneas
    if (this.isUpdating) return;
    
    // Solo permitir completar tareas pendientes
    if (task.isCompleted) return;

    this.isUpdating = true;

    // Crear objeto actualizado
    const updatedTask: Partial<Task> = {
      ...task,
      isCompleted: true,
      updatedAt: new Date()
    };

    // Llamada al servicio para actualizar la tarea
    const updateSub = this.taskService.updateTask(task.id, updatedTask).subscribe({
      next: (result: Task) => {
        console.log('Tarea actualizada exitosamente:', result);
        
        // Actualizar la tarea en el array local
        const taskIndex = this.tasks.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
          this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updatedTask } as Task;
        }

        // Si estamos viendo pendientes, remover la tarea completada de la vista
        if (!this.showCompleted) {
          this.tasks = this.tasks.filter(t => t.id !== task.id);
        }

        this.isUpdating = false;
        
        // Registrar actividad
        this.sessionState.updateActivity();
      },
      error: (error: any) => {
        console.error('Error al actualizar tarea:', error);
        this.errorMessage = 'No se pudo completar la tarea. Inténtalo de nuevo.';
        this.isUpdating = false;
        
        // Revertir el checkbox visualmente si es necesario
        // El checkbox se actualizará automáticamente al no cambiar task.isCompleted
      }
    });

    this.subscriptions.add(updateSub);
  }

  // Crear nueva tarea
  createNewTask(): void {
    // No permitir crear tareas cuando se están viendo las completadas
    if (this.showCompleted) {
      return;
    }

    console.log('Navegando a crear nueva tarea');
    
    // Registrar actividad del usuario
    this.sessionState.updateActivity();
    
    // Por ahora, solo log para demostración
    console.log('Usuario actual:', this.currentUserEmail);
  }

  logout(): void {
    // Limpiar sesión
    this.sessionState.clearSession();
    
    // Limpiar datos locales
    this.tasks = [];
    this.showCompleted = false;
    this.errorMessage = '';
    
    console.log('Sesión cerrada exitosamente');
    
    // Redirigir al login
    // this.router.navigate(['/login']);
  }

  // TrackBy function para mejorar performance en *ngFor
  trackByTaskId(index: number, task: Task): string {
    return task.id || index.toString();
  }

  // Métodos adicionales de utilidad

  // Obtener estadísticas de tareas
  getTaskStats(): { total: number, completed: number, pending: number } {
    // Esto podría venir del servicio o calcularse localmente
    return {
      total: this.tasks.length,
      completed: this.tasks.filter(t => t.isCompleted).length,
      pending: this.tasks.filter(t => !t.isCompleted).length
    };
  }

  // Verificar si hay tareas
  get hasTasks(): boolean {
    return this.tasks.length > 0;
  }

  // Obtener mensaje de estado vacío personalizado
  get emptyStateMessage(): string {
    if (this.showCompleted) {
      return 'No tienes tareas completadas aún. Completa algunas tareas para verlas aquí.';
    } else {
      return '¡Excelente! Has completado todas tus tareas pendientes.';
    }
  }

  // Manejar reintentos de carga
  retryLoadTasks(): void {
    this.errorMessage = '';
    this.loadTasks();
  }

  // Obtener información del usuario actual
  get currentUserEmail(): string {
    return this.sessionState.userEmail || 'Usuario';
  }

  // Verificar si la sesión está por expirar
  get sessionTimeRemaining(): number {
    return this.sessionState.getSessionTimeRemaining();
  }
}
