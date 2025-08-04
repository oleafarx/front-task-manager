import { Component } from '@angular/core';
import { Task } from '../../../models/task.model';
import { TaskService } from '../../../core/services/task.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionData } from '../../../models/session.model';
import { SessionState } from '../../../core/states/sessionState';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent {
  // Propiedades del componente
  tasksList: Task[] = [];
  showCompleted: boolean = false;
  isLoading: boolean = false;
  isUpdating: boolean = false;
  isError: boolean = false;
  errorMessage: string = '';
  showCreateModal: boolean = false;
  isCreatingTask: boolean = false;
  showEditModal: boolean = false;
  isEditingTask: boolean = false;
  editTaskForm: FormGroup;
  currentEditingTask: Task | null = null;
  taskForm: FormGroup;

  private session: SessionData;

  constructor(private sessionState: SessionState,
              private taskService: TaskService,
              private fb: FormBuilder,
              private router: Router) {

    this.session = this.sessionState.currentSession;
    this.taskForm = this.fb.group({
      title: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      description: ['', [
        Validators.maxLength(500)
      ]]
    });

    // Formulario para editar tareas
    this.editTaskForm = this.fb.group({
      title: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      description: ['', [
        Validators.maxLength(500)
      ]]
    });
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

    const emailUser = this.session.user ? this.session.user.email : '';
    console.log('USER: ', emailUser);
    this.taskService.getUserTasks(
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
        this.isError = true;
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

    this.taskService.completeTask(task.id).subscribe({
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
        this.isError = true;
        this.errorMessage = 'No se pudo completar la tarea. Inténtalo de nuevo.';
        this.isUpdating = false;
      }
    });
  }

  // Crear tarea
  onCreateTask(): void {
    if (this.taskForm.invalid || this.isCreatingTask) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.isCreatingTask = true;

    // Crear objeto de nueva tarea
    const userId = this.session.user ? this.session.user.email : 'default';
    const newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: userId,
      title: this.taskForm.get('title')?.value.trim(),
      description: this.taskForm.get('description')?.value?.trim() || '',
      isCompleted: false,
      isActive: true
    };

    console.log('Creando nueva tarea:', newTask);

    // Llamada al servicio para crear la tarea
    const createSub = this.taskService.createTask(newTask).subscribe({
      next: () => {
        this.isCreatingTask = false;
        this.closeCreateModal();
        this.loadTasks();
      },
      error: (error: any) => {
        console.error('Error al crear tarea:', error);
        this.isCreatingTask = false;
        alert('No se pudo crear la tarea. Inténtalo de nuevo.');
      }
    });
  }

  logout(): void {
    this.sessionState.clearSession();

    this.tasksList = [];
    this.showCompleted = false;
    this.errorMessage = '';
    this.isError = false;

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
    this.isError = false;
    this.errorMessage = '';
    this.loadTasks();
  }

  openCreateTaskModal(): void {
    this.showCreateModal = true;
    this.resetTaskForm();
  }

  // Cerrar modal de creación
  closeCreateModal(): void {
    if (this.isCreatingTask) {
      return; // No permitir cerrar mientras se está creando
    }

    this.showCreateModal = false;
    this.resetTaskForm();
  }

   // Nuevos métodos para editar tareas
  openEditTaskModal(task: Task): void {
    if (task.isCompleted) return;
    
    this.currentEditingTask = task;
    this.showEditModal = true;
    
    // Precargar los datos del formulario
    this.editTaskForm.patchValue({
      title: task.title,
      description: task.description
    });
  }

  closeEditModal(): void {
    if (this.isEditingTask) {
      return; // No permitir cerrar mientras se está editando
    }

    this.showEditModal = false;
    this.currentEditingTask = null;
    this.resetEditTaskForm();
  }

  onEditTask(): void {
    if (this.editTaskForm.invalid || this.isEditingTask || !this.currentEditingTask) {
      this.editTaskForm.markAllAsTouched();
      return;
    }

    this.isEditingTask = true;

    const updatedTaskData = {
      title: this.editTaskForm.get('title')?.value.trim(),
      description: this.editTaskForm.get('description')?.value?.trim() || ''
    };

    console.log('Editando tarea:', updatedTaskData);

    // Aquí llamarás al servicio para editar la tarea
    // Por ahora simulo la llamada al servicio
    // this.taskService.editTask(this.currentEditingTask.id, updatedTaskData).subscribe({
    //   next: () => {
    //     this.isEditingTask = false;
    //     this.closeEditModal();
    //     this.loadTasks();
    //   },
    //   error: (error: any) => {
    //     console.error('Error al editar tarea:', error);
    //     this.isEditingTask = false;
    //     alert('No se pudo editar la tarea. Inténtalo de nuevo.');
    //   }
    // });

    // Simulación temporal - reemplazar con la llamada real al servicio
    setTimeout(() => {
      console.log('Tarea editada simulada');
      this.isEditingTask = false;
      this.closeEditModal();
      // Actualizar la tarea localmente (temporal)
      const taskIndex = this.tasksList.findIndex(t => t.id === this.currentEditingTask?.id);
      if (taskIndex !== -1) {
        this.tasksList[taskIndex] = {
          ...this.tasksList[taskIndex],
          ...updatedTaskData,
          updatedAt: new Date()
        };
      }
    }, 1000);
  }

  // Método para eliminar tarea
  deleteTask(task: Task): void {
    const confirmDelete = confirm(`¿Estás seguro de que quieres eliminar la tarea "${task.title}"?`);
    
    if (!confirmDelete) return;

    console.log('Eliminando tarea:', task);

    // Aquí llamarás al servicio para eliminar la tarea
    // this.taskService.deleteTask(task.id).subscribe({
    //   next: () => {
    //     console.log('Tarea eliminada exitosamente');
    //     this.loadTasks();
    //   },
    //   error: (error: any) => {
    //     console.error('Error al eliminar tarea:', error);
    //     alert('No se pudo eliminar la tarea. Inténtalo de nuevo.');
    //   }
    // });

    // Simulación temporal - reemplazar con la llamada real al servicio
    setTimeout(() => {
      console.log('Tarea eliminada simulada');
      this.tasksList = this.tasksList.filter(t => t.id !== task.id);
    }, 500);
  }

  get title() {
    return this.taskForm.get('title');
  }

  get description() {
    return this.taskForm.get('description');
  }

  get editTitle() {
    return this.editTaskForm.get('title');
  }

  get editDescription() {
    return this.editTaskForm.get('description');
  }

  // Resetear formulario
  private resetTaskForm(): void {
    this.taskForm.reset();
    this.taskForm.markAsUntouched();
  }

  private resetEditTaskForm(): void {
    this.editTaskForm.reset();
    this.editTaskForm.markAsUntouched();
  }
}
