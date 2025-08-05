import { Component } from '@angular/core';
import { Task } from '../../../interfaces/task.interface';
import { TaskService } from '../../../core/services/task.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionData } from '../../../interfaces/session.interface';
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
  }

  ngOnInit(): void {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    if (!this.sessionState.isAuthenticated) {
      console.log('Usuario no autenticado, redirigiendo al login');
      this.router.navigate(['/login']);
      return;
    }

    const sessionSub = this.sessionState.session$.subscribe(session => {
      if (!session.isAuthenticated) {
        console.log('Sesión terminada, redirigiendo al login');
        this.router.navigate(['/login']);
      }
    });
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const emailUser = this.session.user ? this.session.user.email : '';
    this.taskService.getUserTasks(
      emailUser
    ).subscribe({
      next: (resp) => {
        const tasks = resp.data;
        this.tasksList = this.filterTasks(tasks);
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
    const taskFiltered = tasks.filter(task => {
      if (!task.isActive) return false;
      return this.showCompleted ? task.isCompleted : !task.isCompleted;
    })
    return taskFiltered;
  }

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

        const taskIndex = this.tasksList.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
          this.tasksList[taskIndex] = { ...this.tasksList[taskIndex], ...updatedTask } as Task;
        }

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

  onCreateTask(): void {
    if (this.taskForm.invalid || this.isCreatingTask) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.isCreatingTask = true;

    const userId = this.session.user ? this.session.user.email : 'default';
    const newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: userId,
      title: this.taskForm.get('title')?.value.trim(),
      description: this.taskForm.get('description')?.value?.trim() || '',
      isCompleted: false,
      isActive: true
    };

    console.log('Creando nueva tarea:', newTask);

    this.taskService.createTask(newTask).subscribe({
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

    this.router.navigate(['/login']);
  }

  get hasTasks(): boolean {
    return this.tasksList.length > 0;
  }

  retryLoadTasks(): void {
    this.isError = false;
    this.errorMessage = '';
    this.loadTasks();
  }

  openCreateTaskModal(): void {
    this.showCreateModal = true;
    this.resetTaskForm();
  }

  closeCreateModal(): void {
    if (this.isCreatingTask) {
      return;
    }

    this.showCreateModal = false;
    this.resetTaskForm();
  }

  openEditTaskModal(task: Task): void {
    if (task.isCompleted) return;
    
    this.currentEditingTask = task;
    this.showEditModal = true;
    
    this.editTaskForm.patchValue({
      title: task.title,
      description: task.description
    });
  }

  closeEditModal(): void {
    if (this.isEditingTask) {
      return;
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

    const taskId = this.currentEditingTask.id;
    this.taskService.updateTask(taskId, updatedTaskData).subscribe({
      next: () => {
        this.isEditingTask = false;
        this.closeEditModal();
        this.loadTasks();
      },
      error: (error: any) => {
        console.error('Error al editar tarea', error);
        this.isEditingTask = false;
        alert('No se pudo editar la tarea. Inténtalo de nuevo.');
      }
    })
  }

  deleteTask(task: Task): void {
    const confirmDelete = confirm(`¿Estás seguro de que quieres eliminar la tarea "${task.title}"?`);
    
    if (!confirmDelete) return;

    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: (error: any) => {
        console.error("Error eliminando la tarea: ", error);
        alert('No se pudo eliminar la tarea. Inténtelo de nuevo');
      }
    })
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

  private resetTaskForm(): void {
    this.taskForm.reset();
    this.taskForm.markAsUntouched();
  }

  private resetEditTaskForm(): void {
    this.editTaskForm.reset();
    this.editTaskForm.markAsUntouched();
  }
}
