export type ServiceType = 'video' | 'marketing' | 'social_media' | 'advertising' | 'branding' | 'other';
export type ProjectStatus = 'active' | 'archived' | 'deleted';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type FinanceType = 'income' | 'expense';
export type FinanceStatus = 'paid' | 'pending';
export type AgencyManagementType = 'goal' | 'idea' | 'content_plan' | 'note';

export interface Client {
  id?: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  socialMedia?: string;
  notes?: string;
  createdAt: string;
}

export interface Project {
  id?: string;
  name: string;
  clientId: string;
  serviceType: ServiceType;
  briefing?: string;
  startDate: string;
  deadline: string;
  responsible: string;
  status: ProjectStatus;
  createdAt: string;
}

export interface Task {
  id?: string;
  title: string;
  description?: string;
  clientId?: string;
  projectId?: string;
  date: string;
  time?: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
}

export interface FinanceRecord {
  id?: string;
  type: FinanceType;
  description: string;
  amount: number;
  date: string;
  status: FinanceStatus;
  clientId?: string;
  category?: string;
  createdAt: string;
}

export interface AgencyManagement {
  id?: string;
  type: AgencyManagementType;
  content: string;
  targetDate?: string;
  status?: string;
  createdAt: string;
}
