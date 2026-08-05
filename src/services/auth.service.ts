import API from './api';

export interface UserSession {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'HOD' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'PRINCIPAL';
  name: string;
  profileImage: string;
  mustChangePassword?: boolean;
  system?: 'ERP' | 'ADMISSION';
  firstName?: string;
  lastName?: string;
  phone?: string;
}

class AuthService {
  async login(email: string, password: string): Promise<UserSession> {
    console.log("API Base URL:", API.defaults.baseURL);
    const response = await API.post('/auth/login', { email, password });
    const { token, user } = response.data.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  }

  async loginDirect(data: any): Promise<any> {
    console.log("API Base URL:", API.defaults.baseURL);
    return await API.post('/auth/login', data);
  }

  async register(data: any): Promise<any> {
    console.log("API Base URL:", API.defaults.baseURL);
    return await API.post('/auth/register', data);
  }

  async checkPhone(phone: string): Promise<any> {
    console.log("API Base URL:", API.defaults.baseURL);
    return await API.post('/auth/check-phone', { phone });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<UserSession> {
    console.log("API Base URL:", API.defaults.baseURL);
    const response = await API.post('/auth/change-password', { oldPassword, newPassword });
    const { token, user } = response.data.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  }

  async logout(): Promise<void> {
    try {
      console.log("API Base URL:", API.defaults.baseURL);
      await API.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  getCurrentUser(): UserSession | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as UserSession;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export default new AuthService();
