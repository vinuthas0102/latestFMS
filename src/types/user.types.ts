import { UserRole } from './common.types';

export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  govtDepartment?: string;
  govtEmployeeId?: string;
  bhkEntitlement?: string;
  assignedEstateId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: UserRole;
  govtDepartment?: string;
  govtEmployeeId?: string;
}

export interface UpdateUserDTO {
  fullName?: string;
  phone?: string;
  govtDepartment?: string;
  govtEmployeeId?: string;
  metadata?: Record<string, any>;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role?: UserRole;
}

export interface AuthState {
  user: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
