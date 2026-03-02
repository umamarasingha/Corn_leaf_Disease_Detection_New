import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  Camera, 
  AlertTriangle, 
  Leaf,
  Activity,
  Calendar,
  BarChart3,
  MessageSquare
} from 'lucide-react';

interface ActivityItem {
  id: number;
  type: string;
  user: string;
  action: string;
  time: string;
  severity: string;
}

interface DiseaseItem {
  name: string;
  count: number;
  percentage: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    {
      title: t('Total Detections'),
      value: '0',
      change: '+0%',
      icon: Camera,
      color: 'bg-green-500',
    },
    {
      title: t('My Posts'),
      value: '0',
      change: '+0%',
      icon: Users,
      color: 'bg-emerald-500',
    },
    {
      title: t('Disease Cases'),
      value: '0',
      change: '-0%',
      icon: AlertTriangle,
      color: 'bg-orange-500',
    },
    {
      title: t('Healthy Plants'),
      value: '0%',
      change: '+0%',
      icon: Leaf,
      color: 'bg-teal-500',
    },
  ]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [diseaseDistribution, setDiseaseDistribution] = useState<DiseaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Mock stats data (replace with real API call when available)
        setStats([
          {
            title: t('My Detections'),
            value: '24',
            change: '+12%',
            icon: Camera,
            color: 'bg-green-500',
          },
          {
            title: t('My Posts'),
            value: '8',
            change: '+5%',
            icon: Users,
            color: 'bg-emerald-500',
          },
          {
            title: t('Disease Cases'),
            value: '5',
            change: '-3%',
            icon: AlertTriangle,
            color: 'bg-orange-500',
          },
          {
            title: t('Healthy Scans'),
            value: '19',
            change: '+8%',
            icon: Leaf,
            color: 'bg-teal-500',
          },
        ]);

        // Mock recent activity - showing user's own activity
        setRecentActivity([
          {
            id: 1,
            type: 'detection',
            user: 'You',
            action: 'detected Northern Leaf Blight',
            time: '2 hours ago',
            severity: 'high',
          },
          {
            id: 2,
            type: 'post',
            user: 'You',
            action: 'posted about treatment success',
            time: '1 day ago',
            severity: 'low',
          },
          {
            id: 3,
            type: 'detection',
            user: 'You',
            action: 'detected Healthy Plant',
            time: '2 days ago',
            severity: 'low',
          },
        ]);

        // Mock disease distribution
        setDiseaseDistribution([
          { name: 'Northern Leaf Blight', count: 34, percentage: 38 },
          { name: 'Gray Leaf Spot', count: 28, percentage: 31 },
          { name: 'Common Rust', count: 18, percentage: 20 },
          { name: 'Healthy', count: 11, percentage: 11 },
        ]);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="w-full max-w-full space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100">{t('My Dashboard')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1 text-xs sm:text-sm">
            {t('Welcome back')}, {user?.name}! {t("Here's your activity overview.")}
          </p>
        </div>
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <button className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center space-x-1 text-xs sm:text-sm whitespace-nowrap">
            <Calendar className="h-4 w-4" />
            <span>{t('Last 30 Days')}</span>
          </button>
          <button className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1 text-xs sm:text-sm whitespace-nowrap">
            <BarChart3 className="h-4 w-4" />
            <span>{t('View Reports')}</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600 truncate">{stat.title}</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-800 mt-1 truncate">{stat.value}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                    <span className="text-xs text-green-600 truncate">{stat.change}</span>
                  </div>
                </div>
                <div className={`${stat.color} p-2 rounded-lg ml-2 flex-shrink-0`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-200 p-3 sm:p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('Recent Activity')}</h2>
          <div className="space-y-2 sm:space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  activity.severity === 'high' ? 'bg-red-100' :
                  activity.severity === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  <Activity className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    activity.severity === 'high' ? 'text-red-600' :
                    activity.severity === 'medium' ? 'text-yellow-600' : 'text-green-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    <span className="font-semibold">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disease Distribution */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-3 sm:p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('Disease Distribution')}</h2>
          <div className="space-y-2 sm:space-y-3">
            {diseaseDistribution.map((disease, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{disease.name}</span>
                  <span className="text-xs sm:text-sm text-gray-500 ml-2">{disease.count} {t('cases')}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                  <div
                    className="bg-green-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                    style={{ width: `${disease.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-3 sm:p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('Quick Actions')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          <button 
            onClick={() => navigate('/detect')}
            className="p-3 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mb-1 sm:mb-2" />
            <h3 className="font-medium text-gray-800 group-hover:text-green-600 text-sm">{t('New Detection')}</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Upload or capture an image</p>
          </button>
          <button 
            onClick={() => navigate('/feed')}
            className="p-3 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mb-1 sm:mb-2" />
            <h3 className="font-medium text-gray-800 group-hover:text-green-600 text-sm">{t('Community Feed')}</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">See what others are sharing</p>
          </button>
          <button 
            onClick={() => navigate('/chatbot')}
            className="p-3 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mb-1 sm:mb-2" />
            <h3 className="font-medium text-gray-800 group-hover:text-green-600 text-sm">{t('AI Assistant')}</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Get help from AI chatbot</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
