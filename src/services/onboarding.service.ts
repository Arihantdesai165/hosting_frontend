import api from './api';

export interface USNRegistryResponse {
  total: number;
  valid: number;
  invalid: number;
  errors: string[];
}

export interface BulkUploadResponse {
  readyToCreate: number;
  rejected: number;
  errors: Array<{ usn: string; name: string; reason: string }>;
  validStudents?: any[]; // for preview
  created?: number;
}

class OnboardingService {
  async uploadUSNRegistry(file: File): Promise<{ success: boolean; message: string; data?: USNRegistryResponse }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/admin/onboarding/usn-registry', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getUSNRegistry(filters?: { semester?: string; department?: string; status?: string }): Promise<any> {
    const response = await api.get('/admin/onboarding/usn-registry', { params: filters });
    return response.data;
  }

  async bulkUploadStudents(file: File, preview: boolean): Promise<{ success: boolean; message: string; data?: BulkUploadResponse }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('preview', String(preview));

    const response = await api.post('/admin/onboarding/students/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export default new OnboardingService();
