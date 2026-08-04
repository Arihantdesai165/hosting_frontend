import API from './api';

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  ipAddress: string;
  details: any;
  createdAt: string;
}

const settingsService = {
  getAuditLogs: async (): Promise<{ success: boolean; data: AuditLog[] }> => {
    const res = await API.get('/admin/logs');
    return res.data;
  },

  getSettings: async () => {
    const res = await API.get('/admin/settings');
    return res.data;
  },

  updateSettings: async (settings: any) => {
    const res = await API.put('/admin/settings', settings);
    return res.data;
  }
};

export default settingsService;
