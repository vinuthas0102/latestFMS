import { supabase, validateSession, refreshSession } from '../lib/supabase';
import { UserDTO, LoginCredentials, CreateUserDTO } from '../types';
import { DEMO_MODE } from '../mocks/demoData';

const DEMO_GOVT_OFFICIAL: UserDTO = {
  id: '5f865f74-aeab-4885-a898-80ba3da33ae0',
  email: 'demo@fms.gov',
  fullName: 'Rajan Kumar',
  phone: '9876543210',
  role: 'govt_official',
  govtDepartment: 'NMDC Limited',
  govtEmployeeId: 'EMP-384621',
  projectLocation: 'Bacheli',
  sapId: 'SAP-284719',
  bhkEntitlement: 'Type-II',
  assignedEstateId: 'estate-1',
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEMO_EO_USER: UserDTO = {
  id: 'e0000001-e000-0000-0000-000000000001',
  email: 'eo@fms.gov',
  fullName: 'Shankar',
  phone: '9876541230',
  role: 'manager',
  govtDepartment: 'NMDC Limited',
  govtEmployeeId: 'EMP-572034',
  projectLocation: 'Bacheli',
  sapId: 'SAP-193047',
  assignedEstateId: 'estate-1',
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function getDemoUser(role?: string): UserDTO {
  if (role === 'manager' || role === 'admin') return { ...DEMO_EO_USER, role: role as UserDTO['role'] };
  if (role === 'govt_official') return DEMO_GOVT_OFFICIAL;
  if (role === 'public' || role === 'dept_user') return { ...DEMO_GOVT_OFFICIAL, role: role as UserDTO['role'] };
  return DEMO_GOVT_OFFICIAL;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<{ user: UserDTO; token: string }> => {
    if (DEMO_MODE) return Promise.resolve({ user: getDemoUser(credentials.role), token: 'demo-token' });
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (authError) throw authError;
    if (!authData.user || !authData.session) throw new Error('Login failed');

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (userError) throw userError;
    if (!userData) throw new Error('User data not found');

    if (credentials.role && userData) {
      await supabase
        .from('users')
        .update({ role: credentials.role })
        .eq('id', userData.id);
      userData.role = credentials.role;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const refreshedSession = await refreshSession();
    if (!refreshedSession) {
      throw new Error('Failed to establish session with role claims');
    }

    const validation = await validateSession();
    if (!validation.valid) {
      console.warn('Session validation failed after refresh. This may cause RLS policy errors.');
    }

    const token = refreshedSession.access_token;

    return {
      user: mapUserFromDb(userData),
      token,
    };
  },

  register: async (userData: CreateUserDTO): Promise<{ user: UserDTO; token: string }> => {
    if (DEMO_MODE) return Promise.resolve({ user: getDemoUser(), token: 'demo-token' });
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Registration failed');

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: userData.email,
          full_name: userData.fullName,
          phone: userData.phone,
          role: userData.role,
          govt_department: userData.govtDepartment || '',
          govt_employee_id: userData.govtEmployeeId || '',
        },
      ])
      .select()
      .single();

    if (userError) throw userError;

    await new Promise(resolve => setTimeout(resolve, 500));

    const refreshedSession = await refreshSession();
    if (!refreshedSession) {
      console.warn('Failed to refresh session after registration');
    }

    const token = refreshedSession?.access_token || authData.session?.access_token || '';
    localStorage.setItem('auth_token', token);

    return {
      user: mapUserFromDb(newUser),
      token,
    };
  },

  logout: async (): Promise<void> => {
    if (DEMO_MODE) return Promise.resolve();
    await supabase.auth.signOut();
    localStorage.removeItem('auth_token');
  },

  getCurrentUser: async (): Promise<UserDTO | null> => {
    if (DEMO_MODE) return Promise.resolve(getDemoUser());
    try {
      const validation = await validateSession();

      if (!validation.valid && validation.needsRefresh) {
        console.log('Session needs refresh, attempting to refresh...');
        try {
          await refreshSession();
        } catch (refreshError) {
          console.error('Failed to refresh session:', refreshError);
          await supabase.auth.signOut();
          return null;
        }
      }

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        console.log('No authenticated user found');
        return null;
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (error || !userData) {
        console.error('Failed to fetch user data:', error);
        return null;
      }

      return mapUserFromDb(userData);
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
    }
  },

  updateProfile: async (userId: string, updates: Partial<UserDTO>): Promise<UserDTO> => {
    if (DEMO_MODE) return Promise.resolve({ ...getDemoUser(), ...updates });
    const { data, error } = await supabase
      .from('users')
      .update({
        full_name: updates.fullName,
        phone: updates.phone,
        govt_department: updates.govtDepartment,
        govt_employee_id: updates.govtEmployeeId,
        metadata: updates.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return mapUserFromDb(data);
  },

  switchRole: async (userId: string, newRole: string): Promise<void> => {
    if (DEMO_MODE) return Promise.resolve();
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) throw error;

    await new Promise(resolve => setTimeout(resolve, 500));

    const refreshedSession = await refreshSession();
    if (!refreshedSession) {
      throw new Error('Failed to refresh session after role change');
    }
  },
};

function mapUserFromDb(dbUser: any): UserDTO {
  return {
    id: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.full_name || '',
    phone: dbUser.phone || '',
    role: dbUser.role || 'public',
    govtDepartment: dbUser.govt_department,
    govtEmployeeId: dbUser.govt_employee_id,
    projectLocation: dbUser.project_location ?? undefined,
    sapId: dbUser.sap_id ?? undefined,
    bhkEntitlement: dbUser.bhk_entitlement ?? undefined,
    designationId: dbUser.designation_id ?? undefined,
    assignedEstateId: dbUser.assigned_estate_id,
    metadata: dbUser.metadata || {},
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  };
}
