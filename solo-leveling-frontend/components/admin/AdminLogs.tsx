'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Clock, Activity } from 'lucide-react';

export default function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [currentPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/logs', {
        params: { page: currentPage, limit: 20 }
      });
      setLogs(response.data.logs || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('DELETE')) return 'text-red-400';
    if (action.includes('CREATE')) return 'text-green-400';
    if (action.includes('UPDATE')) return 'text-yellow-400';
    if (action.includes('VIEW')) return 'text-blue-400';
    return 'text-gray-400';
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-bold text-gray-200">Admin Activity Logs</h2>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading activity logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No activity logs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.log_id} className="p-4 bg-black/30 rounded-lg hover:bg-black/40 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold ${getActionColor(log.action_type)}`}>
                      {log.action_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-500">by</span>
                    <span className="text-purple-400">{log.admin_username || 'Admin'}</span>
                  </div>
                  {log.action_details && (
                    <p className="text-sm text-gray-400">
                      {typeof log.action_details === 'string' 
                        ? log.action_details 
                        : JSON.stringify(log.action_details)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 
                     rounded transition-all text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 
                     rounded transition-all text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}