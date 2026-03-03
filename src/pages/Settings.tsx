import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { 
  User, 
  Mail, 
  Camera, 
  Bell, 
  Shield, 
  Globe,
  Palette,
  Save,
  Upload,
  Eye,
  EyeOff,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Users,
  Trash2,
  X
} from 'lucide-react';

interface UserSettings {
  profile: {
    name: string;
    email: string;
    bio: string;
    location: string;
    phone: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    diseaseAlerts: boolean;
    communityUpdates: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    showEmail: boolean;
    showLocation: boolean;
    allowDataCollection: boolean;
  };
  preferences: {
    language: string;
    theme: 'light' | 'dark' | 'system';
    timezone: string;
    dateFormat: string;
  };
}

const Settings: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'preferences'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || '',
      location: user?.location || '',
      phone: user?.phone || '',
    },
    notifications: {
      email: true,
      push: true,
      diseaseAlerts: true,
      communityUpdates: false,
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showLocation: true,
      allowDataCollection: true,
    },
    preferences: {
      language: 'en',
      theme: 'system',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
    },
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Update user profile via API
      if (user) {
        const formData = new FormData();
        formData.append('name', settings.profile.name);
        formData.append('phone', settings.profile.phone);
        formData.append('location', settings.profile.location);
        formData.append('bio', settings.profile.bio);
        if (avatarPreview) {
          const response = await fetch(avatarPreview);
          const blob = await response.blob();
          formData.append('image', blob as File);
        }
        
        const response = await apiService.updateProfile(formData);
        const updatedUser = response?.user || response;
        updateUser({
          name: updatedUser?.name ?? settings.profile.name,
          avatar: updatedUser?.avatar,
          phone: updatedUser?.phone ?? settings.profile.phone,
          location: updatedUser?.location ?? settings.profile.location,
          bio: updatedUser?.bio ?? settings.profile.bio,
        });
      }
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    setIsLoading(true);
    try {
      // Call real API for password change
      await apiService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    setIsLoading(true);
    try {
      await apiService.deleteAccount();
      // Logout and redirect after successful deletion
      logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account. Please try again.');
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setAvatarError(null);
    
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const fileType = file.type.toLowerCase();
      
      if (!validTypes.includes(fileType)) {
        setAvatarError('Invalid file type. Please upload only JPG or PNG images.');
        event.target.value = ''; // Reset the input
        return;
      }
      
      // Validate file size (max 5MB for avatar)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        setAvatarError('File size too large. Please upload an image smaller than 5MB.');
        event.target.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Palette },
  ];

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Information</h3>
        
        <div className="flex items-center space-x-6 mb-6">
          <div className="relative">
            <div className="h-20 w-20 bg-primary-500 rounded-full flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-white" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-1 rounded-full cursor-pointer hover:bg-primary-700">
              <Upload className="h-4 w-4" />
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-800">{settings.profile.name}</h4>
            <p className="text-sm text-gray-600">{settings.profile.email}</p>
            <p className="text-xs text-gray-500 mt-1">Member since {new Date(user?.createdAt || '').toLocaleDateString()}</p>
            <p className="text-xs text-gray-500 mt-1">Avatar: JPG or PNG (Max 5MB)</p>
          </div>
        </div>
        
        {avatarError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {avatarError}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={settings.profile.name}
              onChange={(e) => setSettings({ ...settings, profile: { ...settings.profile, name: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={settings.profile.email}
              onChange={(e) => setSettings({ ...settings, profile: { ...settings.profile, email: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Contact admin to change email</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={settings.profile.phone}
              onChange={(e) => setSettings({ ...settings, profile: { ...settings.profile, phone: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={settings.profile.location}
              onChange={(e) => setSettings({ ...settings, profile: { ...settings.profile, location: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            value={settings.profile.bio}
            onChange={(e) => setSettings({ ...settings, profile: { ...settings.profile, bio: e.target.value } })}
            rows={3}
            placeholder="Tell us about yourself..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <button
            onClick={handlePasswordChange}
            disabled={isLoading || !passwordForm.currentPassword || !passwordForm.newPassword}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            Update Password
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg border-2 border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
        <p className="text-sm text-gray-600 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={() => setShowDeleteConfirmation(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete Account</span>
        </button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Preferences</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <h4 className="text-sm font-medium text-gray-800">Email Notifications</h4>
                <p className="text-xs text-gray-500">Receive updates via email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, email: e.target.checked } })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-gray-400" />
              <div>
                <h4 className="text-sm font-medium text-gray-800">Push Notifications</h4>
                <p className="text-xs text-gray-500">Receive push notifications on mobile</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.push}
                onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, push: e.target.checked } })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-gray-400" />
              <div>
                <h4 className="text-sm font-medium text-gray-800">Disease Alerts</h4>
                <p className="text-xs text-gray-500">Get notified about disease outbreaks</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.diseaseAlerts}
                onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, diseaseAlerts: e.target.checked } })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <h4 className="text-sm font-medium text-gray-800">Community Updates</h4>
                <p className="text-xs text-gray-500">Updates from community feed</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.communityUpdates}
                onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, communityUpdates: e.target.checked } })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Privacy Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Visibility
            </label>
            <select
              value={settings.privacy.profileVisibility}
              onChange={(e) => setSettings({ ...settings, privacy: { ...settings.privacy, profileVisibility: e.target.value as 'public' | 'private' } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {settings.privacy.profileVisibility === 'public' 
                ? 'Anyone can view your profile' 
                : 'Only you can view your profile'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="showEmail"
                checked={settings.privacy.showEmail}
                onChange={(e) => setSettings({ ...settings, privacy: { ...settings.privacy, showEmail: e.target.checked } })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="showEmail" className="text-sm text-gray-700">
                Show email address on public profile
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="showLocation"
                checked={settings.privacy.showLocation}
                onChange={(e) => setSettings({ ...settings, privacy: { ...settings.privacy, showLocation: e.target.checked } })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="showLocation" className="text-sm text-gray-700">
                Show location on public profile
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="allowDataCollection"
                checked={settings.privacy.allowDataCollection}
                onChange={(e) => setSettings({ ...settings, privacy: { ...settings.privacy, allowDataCollection: e.target.checked } })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="allowDataCollection" className="text-sm text-gray-700">
                Allow data collection for research purposes
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Management</h3>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Your Data</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Detection history: 124 records</li>
              <li>• Community posts: 8 posts</li>
              <li>• Comments: 23 comments</li>
              <li>• Account created: {new Date(user?.createdAt || '').toLocaleDateString()}</li>
            </ul>
          </div>

          <div className="flex space-x-4">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Download My Data
            </button>
            <button 
              onClick={() => setShowDeleteConfirmation(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreferencesSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Application Preferences</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={settings.preferences.language}
              onChange={(e) => setSettings({ ...settings, preferences: { ...settings.preferences, language: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="pt">Portuguese</option>
              <option value="hi">Hindi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              value={settings.preferences.theme}
              onChange={(e) => setSettings({ ...settings, preferences: { ...settings.preferences, theme: e.target.value as 'light' | 'dark' | 'system' } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={settings.preferences.timezone}
              onChange={(e) => setSettings({ ...settings, preferences: { ...settings.preferences, timezone: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="UTC">UTC</option>
              <option value="EST">Eastern Time</option>
              <option value="CST">Central Time</option>
              <option value="MST">Mountain Time</option>
              <option value="PST">Pacific Time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Format
            </label>
            <select
              value={settings.preferences.dateFormat}
              onChange={(e) => setSettings({ ...settings, preferences: { ...settings.preferences, dateFormat: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Status Alert */}
      {saveStatus !== 'idle' && (
        <div className={`mb-6 rounded-lg p-4 flex items-center space-x-3 ${
          saveStatus === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {saveStatus === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">
            {saveStatus === 'success' ? 'Settings saved successfully!' : 'Failed to save settings'}
          </span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-wrap border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mb-6">
        {activeTab === 'profile' && renderProfileSettings()}
        {activeTab === 'notifications' && renderNotificationSettings()}
        {activeTab === 'privacy' && renderPrivacySettings()}
        {activeTab === 'preferences' && renderPreferencesSettings()}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Delete Account</h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setDeleteConfirmText('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
              </p>
              <p className="text-gray-700 mb-4">
                Your data that will be deleted:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 mb-4 ml-4">
                <li>• Profile information</li>
                <li>• Detection history</li>
                <li>• Community posts and comments</li>
                <li>• All settings and preferences</li>
              </ul>
              <p className="text-gray-700 font-medium mb-2">
                Please type <span className="font-bold text-red-600">DELETE</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Type DELETE to confirm"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
