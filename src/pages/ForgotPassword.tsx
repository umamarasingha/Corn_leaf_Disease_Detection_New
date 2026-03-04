import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { authAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const ForgotPassword: React.FC = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError(t('New password must be at least 6 characters.'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('Passwords do not match.'));
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.resetPassword(email, newPassword);
      setSuccess(t('Password reset successful. You can now sign in with your new password.'));
      setEmail('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Reset password error:', err);
      if (err?.response?.status === 400) {
        setError(err.response.data?.error || t('Unable to reset password. Please try again.'));
      } else if (err?.request) {
        setError(t('Network error. Please check your connection and try again.'));
      } else {
        setError(t('Failed to reset password. Please try again.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4 relative">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Leaf className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center">{t('Forgot Password')}</h1>
          <p className="text-center text-white/80 mt-2">
            {t('Enter your new password')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('Email Address')}
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder={t('Enter your email')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('New Password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="input-field pl-10 pr-10"
                placeholder={t('Enter new password')}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('Confirm New Password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="input-field pl-10 pr-10"
                placeholder={t('Confirm new password')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('Resetting...') : t('Reset Password')}
          </button>
        </form>

        <div className="px-6 pb-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('Back to Sign In')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;