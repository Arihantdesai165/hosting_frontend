import React, { useState, useEffect } from 'react';
import { Bell, Search, Plus, Filter, Send, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import officeService, { Notification } from '../../../services/office.service';

export const AdminNotificationsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await officeService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    return n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.audience.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'WARNING': return <AlertCircle className="text-amber-500" size={16} />;
      case 'SUCCESS': return <CheckCircle2 className="text-emerald-500" size={16} />;
      default: return <Info className="text-blue-500" size={16} />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Push Notifications</h2>
          <p className="text-sm text-neutral-500">Send alerts and system notifications to users.</p>
        </div>
        
        <button className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all">
          <Send size={16} /> Compose Notification
        </button>
      </div>

      <div className="glass-panel rounded-2xl shadow-ambient p-4 border border-neutral-200/50">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text" 
              placeholder="Search notifications..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="text-neutral-400" size={18} />
            <select className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-violet-500 w-full md:w-auto">
              <option value="ALL">All Status</option>
              <option value="SENT">Sent</option>
              <option value="SCHEDULED">Scheduled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200/60 dark:border-neutral-700/60">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Audience</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-transparent">
                {filteredNotifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(notif.type)}
                        <span className="font-bold text-neutral-900 dark:text-neutral-200">{notif.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-300">
                      {notif.audience}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                        notif.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {notif.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
