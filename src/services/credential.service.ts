import api from './api';

export interface PendingCredential {
  id: string; // Student ID
  enrollmentNumber: string;
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  }
}

class CredentialService {
  async getPendingCredentials(): Promise<{ success: boolean; data: PendingCredential[] }> {
    const response = await api.get('/admin/credentials/pending');
    return response.data;
  }

  async dispatchSingleCredential(userId: string, username?: string, password?: string) {
    const response = await api.post('/admin/credentials/dispatch', { userId, username, password });
    return response.data;
  }

  async bulkDispatchCredentials(studentIds: string[]) {
    const response = await api.post('/admin/credentials/bulk-dispatch', { studentIds });
    return response.data;
  }
}

export default new CredentialService();
