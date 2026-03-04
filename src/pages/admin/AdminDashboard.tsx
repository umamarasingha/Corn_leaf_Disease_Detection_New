import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  Camera, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  Activity,
  Calendar,
  Settings,
  Brain,
  Database,
  PieChart,
  LineChart,
  Crown,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';

interface AdminStats {
  totalUsers: number;
  totalDetections: number;
  totalPosts: number;
  activeUsers: number;
  modelAccuracy: number;
  dataPoints: number;
}

interface RecentActivity {
  id: string;
  type: 'detection' | 'registration' | 'post' | 'training';
  user: string;
  action: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high';
}

interface DiseaseData {
  name: string;
  value: number;
  color: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalDetections: 0,
    totalPosts: 0,
    activeUsers: 0,
    modelAccuracy: 0,
    dataPoints: 0,
  });
  const [loading, setLoading] = useState(true);

  const recentActivity: RecentActivity[] = [
    {
      id: '1',
      type: 'detection',
      user: 'John Farmer',
      action: 'Detected Northern Leaf Blight',
      timestamp: '2 minutes ago',
      severity: 'high',
    },
    {
      id: '2',
      type: 'registration',
      user: 'Mary Agriculture',
      action: 'New user registered',
      timestamp: '15 minutes ago',
    },
    {
      id: '3',
      type: 'post',
      user: 'Bob Fields',
      action: 'Posted treatment success story',
      timestamp: '1 hour ago',
    },
    {
      id: '4',
      type: 'training',
      user: 'System',
      action: 'Model training completed',
      timestamp: '2 hours ago',
    },
    {
      id: '5',
      type: 'detection',
      user: 'Sarah Green',
      action: 'Detected Gray Leaf Spot',
      timestamp: '3 hours ago',
      severity: 'medium',
    },
  ];

  const diseaseData: DiseaseData[] = [
    { name: 'Northern Leaf Blight', value: 35, color: '#dc2626' },
    { name: 'Gray Leaf Spot', value: 28, color: '#ea580c' },
    { name: 'Common Rust', value: 22, color: '#ca8a04' },
    { name: 'Healthy', value: 15, color: '#16a34a' },
  ];

  const chartData: ChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Detections',
        data: [45, 52, 38, 65, 48, 72, 58],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
      },
      {
        label: 'New Users',
        data: [12, 19, 15, 25, 18, 32, 28],
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
      },
    ],
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const dashboardStats = await apiService.getAdminStats();
        // Map DashboardStats to AdminStats interface
        setStats({
          totalUsers: dashboardStats.totalUsers,
          totalDetections: dashboardStats.totalDetections,
          totalPosts: dashboardStats.totalPosts,
          activeUsers: dashboardStats.activeUsers,
          modelAccuracy: 94.7, // Default value - could be added to API
          dataPoints: 15420, // Default value - could be added to API
        });
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        // Fallback to mock data
        setStats({
          totalUsers: 1247,
          totalDetections: 5623,
          totalPosts: 892,
          activeUsers: 234,
          modelAccuracy: 94.7,
          dataPoints: 15420,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedPeriod]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'detection': return Camera;
      case 'registration': return Users;
      case 'post': return FileText;
      case 'training': return Brain;
      default: return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  const quickActions = [
    { 
      icon: Brain, 
      label: 'Train Model', 
      description: 'Improve AI accuracy with new data',
      action: () => navigate('/admin/training')
    },
    { 
      icon: Database, 
      label: 'Manage Data', 
      description: 'View and manage training dataset',
      action: () => navigate('/admin/data')
    },
    { 
      icon: Users, 
      label: 'User Management', 
      description: 'Manage user accounts and permissions',
      action: () => navigate('/admin/users')
    },
    { 
      icon: Settings, 
      label: 'System Settings', 
      description: 'Configure system parameters',
      action: () => console.log('Navigate to settings')
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Welcome Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold">Welcome back, {user?.name || 'Admin'}</h1>
                <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full flex items-center space-x-1">
                  <Crown className="h-3 w-3" />
                  <span>ADMIN</span>
                </span>
              </div>
              <p className="text-green-100 mt-1">
                System is running smoothly • All services operational
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="24h" className="text-gray-800">Last 24 Hours</option>
              <option value="7d" className="text-gray-800">Last 7 Days</option>
              <option value="30d" className="text-gray-800">Last 30 Days</option>
              <option value="90d" className="text-gray-800">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm text-green-600 font-medium">+12%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.totalUsers.toLocaleString()}</h3>
          <p className="text-gray-600 text-sm mt-1">Total Users</p>
          <div className="mt-3 text-xs text-gray-500">
            {stats.activeUsers} active today
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Camera className="h-6 w-6 text-emerald-600" />
            </div>
            <span className="text-sm text-green-600 font-medium">+23%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.totalDetections.toLocaleString()}</h3>
          <p className="text-gray-600 text-sm mt-1">Total Detections</p>
          <div className="mt-3 text-xs text-gray-500">
            156 today
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <Brain className="h-6 w-6 text-teal-600" />
            </div>
            <span className="text-sm text-green-600 font-medium">+2.3%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.modelAccuracy}%</h3>
          <p className="text-gray-600 text-sm mt-1">Model Accuracy</p>
          <div className="mt-3 text-xs text-gray-500">
            {stats.dataPoints.toLocaleString()} training points
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-lime-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-lime-600" />
            </div>
            <span className="text-sm text-green-600 font-medium">+8%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.totalPosts.toLocaleString()}</h3>
          <p className="text-gray-600 text-sm mt-1">Community Posts</p>
          <div className="mt-3 text-xs text-gray-500">
            42 new this week
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disease Distribution Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Disease Distribution</h2>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {diseaseData.map((disease, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: disease.color }}
                  ></div>
                  <span className="text-sm text-gray-700">{disease.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${disease.value}%`,
                        backgroundColor: disease.color 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-800">{disease.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Trend Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Weekly Activity Trends</h2>
            <LineChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {chartData.datasets.map((dataset, datasetIndex) => (
              <div key={datasetIndex}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{dataset.label}</span>
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: dataset.borderColor }}
                  ></div>
                </div>
                <div className="flex items-end space-x-1 h-16">
                  {dataset.data.map((value, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t"
                      style={{ 
                        height: `${(value / Math.max(...dataset.data)) * 100}%`,
                        backgroundColor: dataset.backgroundColor,
                        borderTop: `2px solid ${dataset.borderColor}`
                      }}
                      title={`${chartData.labels[index]}: ${value}`}
                    ></div>
                  ))}
                </div>
                <div className="flex space-x-1 mt-1">
                  {chartData.labels.map((label, index) => (
                    <div key={index} className="flex-1 text-xs text-gray-500 text-center">
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className="flex flex-col items-center space-y-3 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Icon className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-gray-800 text-sm">{action.label}</h3>
                  <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
          <button className="text-sm text-green-600 hover:text-green-700 font-medium">
            View All
          </button>
        </div>
        <div className="space-y-3">
          {recentActivity.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <div
                key={activity.id}
                className={`p-4 rounded-lg border-l-4 transition-colors ${getSeverityColor(activity.severity)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800">
                        {activity.user}
                      </p>
                      <span className="text-xs text-gray-500">{activity.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{activity.action}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
