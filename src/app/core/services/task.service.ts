import { Injectable } from '@angular/core';
import { Task } from '../../interfaces/task.interface';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaskService {
    private url = environment.apiUrl;
    
    constructor(
        private http: HttpClient
    ) {}

    getUserTasks(email: string): Observable<any> {
        const apiUrl = `${this.url}/tasks/${email}`;
        return this.http.get<any>(apiUrl).pipe(
            catchError(error => {
                if (error.status === 404) {
                    console.error('Tasks not found for user:', email);
                    return of({data: []});
                }
                return throwError(() => new Error('An error occurred while fetching tasks'));
            })
        )
    }

    createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Observable<any> {
        const apiUrl = `${this.url}/tasks`;
        return this.http.post<any>(apiUrl, task).pipe(
            catchError(error => {
                console.error('Error creating task:', error);
                return throwError(() => new Error('An error occurred while creating the task'));
            })
        );
    }

    updateTask(id: string, task: Partial<Task>): Observable<any> {
        const apiUrl = `${this.url}/tasks/${id}`;
        return this.http.put<any>(apiUrl, task).pipe(
            catchError(error => {
                console.error('Error updating task:', error);
                return throwError(() => new Error('An error occurred while updating the task'));
            })
        );
    }

    deleteTask(taskId: string): Observable<void> {
        const apiUrl = `${this.url}/tasks/${taskId}`;
        return this.http.delete<void>(apiUrl).pipe(
            catchError(error => {
                console.error('Error deleting task:', error);
                return throwError(() => new Error('An error occurred while deleting the task'));
            })
        );
    }

    completeTask(taskId: string): Observable<any> {
        const apiUrl = `${this.url}/tasks/${taskId}/complete`;
        return this.http.post<any>(apiUrl, {}).pipe(
            catchError(error => {
                console.error('Error completing task:', error);
                return throwError(() => new Error('An error occurred while completing the task'));
            })
        );
    }
}