export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}