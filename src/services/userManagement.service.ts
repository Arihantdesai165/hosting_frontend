import API from './api';

export interface UserManagementStats {
  total: number;
  active: number;
  inactive: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
  stats: UserManagementStats;
}

export interface BaseUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  profileImage?: string;
  username?: string;
  createdAt?: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  enrollmentNumber: string;
  semester: number;
  departmentId: string;
  department: {
    name: string;
    code: string;
  };
  user: BaseUser;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  departmentId: string;
  department: {
    name: string;
    code: string;
  };
  user: BaseUser;
}

const userManagementService = {
  getStudents: async (params?: { page?: number; limit?: number; search?: string; departmentId?: string; semester?: string; status?: string }): Promise<PaginatedResponse<StudentProfile>> => {
    const res = await API.get('/admin/users/students', { params });
    return res.data;
  },

  getTeachers: async (params?: { page?: number; limit?: number; search?: string; departmentId?: string; status?: string }): Promise<PaginatedResponse<TeacherProfile>> => {
    const res = await API.get('/admin/users/teachers', { params });
    return res.data;
  },

  getHODs: async (): Promise<{ success: boolean; data: any[] }> => {
    const res = await API.get('/admin/users/hods');
    return res.data;
  },

  getPrincipals: async (): Promise<{ success: boolean; data: any[] }> => {
    const res = await API.get('/admin/users/principals');
    return res.data;
  },

  getParents: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<any>> => {
    const res = await API.get('/admin/users/parents', { params });
    return res.data;
  },

  updateStudent: async (id: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    status?: string;
    semester?: number;
    address?: string;
  }): Promise<{ success: boolean; data: StudentProfile }> => {
    const res = await API.put(`/admin/users/students/${id}`, data);
    return res.data;
  },

  updateTeacher: async (id: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    status?: string;
    departmentId?: string;
  }): Promise<{ success: boolean; data: TeacherProfile }> => {
    const res = await API.put(`/admin/users/teachers/${id}`, data);
    return res.data;
  },
};

export default userManagementService;
