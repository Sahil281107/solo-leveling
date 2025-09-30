// File: frontend/components/admin/SystemMonitoring.tsx
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminSettingsAPI, SystemHealth, AnalyticsData } from '@/lib/adminSettings';
import { 
  Activity, Database, Users, Clock, AlertTriangle, 
  CheckCircle, TrendingUp, BarChart3, Zap, Globe,
  RefreshCw, Download, Calendar
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  trend 
}) => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-purple-500/30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className={`text-xs font-medium ${
            trend === 'up' ? 'text-green-400' : 
            trend === 'down' ? 'text-red-400' : 
            'text-gray-400'
          }`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
        <p className="text-gray-400 text-sm">{title}</p>
        {subtitle && (
          <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

interface PerformanceChartProps {
  metrics: Array<{
    log_id: number;
    endpoint: string;
    method: string;
    response_time_ms: number;
    status_code: number;
    created_at: string;
  }>;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ metrics }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');

  // Group metrics by time intervals
  const groupMetricsByTime = (timeframe: string) => {
    const now = new Date();
    const intervals: { [key: string]: number[] } = {};
    
    metrics.forEach(metric => {
      const metricTime = new Date(metric.created_at);
      let intervalKey: string;
      
      if (timeframe === '1h') {
        // Group by 5-minute intervals
        const minutes = Math.floor(metricTime.getMinutes() / 5) * 5;
        intervalKey = `${metricTime.getHours()}:${minutes.toString().padStart(2, '0')}`;
      } else {
        // Group by hours
        intervalKey = `${metricTime.getHours()}:00`;
      }
      
      if (!intervals[intervalKey]) {
        intervals[intervalKey] = [];
      }
      intervals[intervalKey].push(metric.response_time_ms);
    });

    // Calculate averages
    return Object.entries(intervals)
      .map(([time, responseTimes]) => ({
        time,
        avg: Math.round(responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length),
        max: Math.max(...responseTimes),
        count: responseTimes.length
      }))
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(-12); // Show last 12 data points
  };

  const chartData = groupMetricsByTime(selectedTimeframe);
  const maxValue = Math.max(...chartData.map(d => d.max), 1);

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Response Time Trends</h3>
        <div className="flex items-center gap-2">
          {['1h', '6h', '24h'].map(timeframe => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-3 py-1 rounded text-sm transition-all ${
                selectedTimeframe === timeframe
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 flex items-end justify-between gap-1">
        {chartData.map((data, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="w-full flex flex-col justify-end h-48 gap-1">
              {/* Max response time bar */}
              <div
                className="w-full bg-red-500/30 rounded-t"
                style={{ height: `${(data.max / maxValue) * 100}%`, minHeight: '2px' }}
                title={`Max: ${data.max}ms`}
              />
              {/* Average response time bar */}
              <div
                className="w-full bg-gradient-to-t from-purple-600 to-blue-500 rounded-t"
                style={{ height: `${(data.avg / maxValue) * 100}%`, minHeight: '4px' }}
                title={`Avg: ${data.avg}ms, Requests: ${data.count}`}
              />
            </div>
            <div className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-top">
              {data.time}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-2 bg-gradient-to-r from-purple-600 to-blue-500 rounded"></div>
          <span className="text-gray-400">Average Response Time</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-2 bg-red-500/30 rounded"></div>
          <span className="text-gray-400">Maximum Response Time</span>
        </div>
      </div>
    </div>
  );
};

export default function SystemMonitoring() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    fetchMonitoringData();
  }, [analyticsTimeframe]);

  const fetchMonitoringData = async () => {
    setRefreshing(true);
    try {
      const [healthData, analyticsData] = await Promise.all([
        adminSettingsAPI.getSystemHealth(),
        adminSettingsAPI.getAnalytics(analyticsTimeframe)
      ]);
      
      setSystemHealth(healthData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      toast.error('Failed to load monitoring data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exportAnalytics = async () => {
    try {
      const data = {
        system_health: systemHealth,
        analytics: analytics,
        exported_at: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `system-monitoring-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Monitoring data exported successfully!');
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast.error('Failed to export monitoring data');
    }
  };

  if (loading && !systemHealth) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">System Monitoring</h3>
          <p className="text-gray-400 text-sm">
            Real-time system health and performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={exportAnalytics}
            className="flex items-center gap-2 px-3 py-2 border border-purple-500/30 text-purple-300 rounded-lg hover:border-purple-500/50 transition-all"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          <button
            onClick={fetchMonitoringData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Database Status"
          value={systemHealth?.database === 'healthy' ? 'Healthy' : 'Unhealthy'}
          icon={Database}
          color={systemHealth?.database === 'healthy' ? 'from-green-600 to-green-500' : 'from-red-600 to-red-500'}
          trend={systemHealth?.database === 'healthy' ? 'neutral' : 'down'}
        />
        
        <MetricCard
          title="Avg Response Time"
          value={`${systemHealth?.average_response_time || 0}ms`}
          subtitle="Last 24 hours"
          icon={Zap}
          color={
            (systemHealth?.average_response_time || 0) < 200 ? 'from-green-600 to-green-500' :
            (systemHealth?.average_response_time || 0) < 500 ? 'from-yellow-600 to-yellow-500' :
            'from-red-600 to-red-500'
          }
          trend={
            (systemHealth?.average_response_time || 0) < 200 ? 'up' :
            (systemHealth?.average_response_time || 0) < 500 ? 'neutral' : 'down'
          }
        />
        
        <MetricCard
          title="Active Users"
          value={systemHealth?.active_users || 0}
          subtitle="Current sessions"
          icon={Users}
          color="from-blue-600 to-blue-500"
          trend="neutral"
        />
        
        <MetricCard
          title="Error Rate"
          value={`${Object.values(systemHealth?.error_counts || {}).reduce((sum, count) => sum + count, 0)}`}
          subtitle="Last 24 hours"
          icon={AlertTriangle}
          color="from-orange-600 to-orange-500"
          trend="down"
        />
      </div>

      {/* Performance Chart */}
      {systemHealth?.performance_metrics && systemHealth.performance_metrics.length > 0 && (
        <PerformanceChart metrics={systemHealth.performance_metrics} />
      )}

      {/* Error Summary */}
      {systemHealth?.error_counts && Object.keys(systemHealth.error_counts).length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Error Summary (24h)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(systemHealth.error_counts).map(([level, count]) => (
              <div key={level} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    level === 'critical' ? 'bg-red-500' :
                    level === 'error' ? 'bg-orange-500' :
                    level === 'warn' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                  <span className="text-gray-300 capitalize">{level}</span>
                </div>
                <span className="text-white font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">User Analytics</h3>
          <div className="flex items-center gap-2">
            {(['24h', '7d', '30d'] as const).map(timeframe => (
              <button
                key={timeframe}
                onClick={() => setAnalyticsTimeframe(timeframe)}
                className={`px-3 py-1 rounded text-sm transition-all ${
                  analyticsTimeframe === timeframe
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {timeframe === '24h' ? '24 Hours' : timeframe === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Unique Users"
            value={analytics?.unique_users || 0}
            subtitle={`In last ${analyticsTimeframe}`}
            icon={Users}
            color="from-purple-600 to-purple-500"
          />
          
          <MetricCard
            title="Total Events"
            value={analytics?.total_events || 0}
            subtitle="All user interactions"
            icon={Activity}
            color="from-blue-600 to-blue-500"
          />
          
          <MetricCard
            title="Page Views"
            value={analytics?.event_counts?.pageview || 0}
            subtitle="Navigation events"
            icon={Globe}
            color="from-green-600 to-green-500"
          />
        </div>

        {/* Event Breakdown */}
        {analytics?.event_counts && Object.keys(analytics.event_counts).length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Event Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(analytics.event_counts)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .map(([eventType, count]) => (
                <div key={eventType} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300 capitalize">
                    {eventType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-white font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Page Views Chart */}
        {analytics?.page_views_by_day && Object.keys(analytics.page_views_by_day).length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Daily Page Views</h4>
            <div className="h-48 flex items-end justify-between gap-2">
              {Object.entries(analytics.page_views_by_day)
                .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                .slice(-14) // Show last 14 days
                .map(([date, views], index) => {
                  const maxViews = Math.max(...Object.values(analytics.page_views_by_day));
                  const height = maxViews > 0 ? (views / maxViews) * 100 : 0;
                  
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-purple-600 to-blue-500 rounded-t min-h-[4px] transition-all hover:from-purple-500 hover:to-blue-400"
                        style={{ height: `${height}%` }}
                        title={`${date}: ${views} views`}
                      />
                      <div className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-top">
                        {new Date(date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {analytics?.recent_events && analytics.recent_events.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Recent Activity</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {analytics.recent_events.slice(0, 20).map((event) => (
                <div key={event.analytics_id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      event.event_type === 'pageview' ? 'bg-blue-500' :
                      event.event_type === 'quest_complete' ? 'bg-green-500' :
                      event.event_type === 'level_up' ? 'bg-yellow-500' :
                      'bg-purple-500'
                    }`} />
                    <div>
                      <span className="text-white text-sm capitalize">
                        {event.event_type.replace(/_/g, ' ')}
                      </span>
                      {event.page_url && (
                        <p className="text-gray-400 text-xs">{event.page_url}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-gray-400 text-xs">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* System Status Footer */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-gray-300">System Status: All services operational</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Clock className="w-4 h-4" />
            Last updated: {systemHealth?.timestamp ? 
              new Date(systemHealth.timestamp).toLocaleString() : 
              'Never'
            }
          </div>
        </div>
      </div>
    </div>
  );
}