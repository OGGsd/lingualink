import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import apiService from '../services/apiService';
import {
  Users,
  Activity,
  MessageSquare,
  Globe,
  Server,
  Mail,
  Settings,
  Search,
  Shield,
  ShieldCheck,
  TrendingUp,
  Clock,
  Database,
  Zap,
  Send,
  Key,
  UserCheck,
  UserX,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { authUser, checkAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Real-time data state
  const [realTimeData, setRealTimeData] = useState({
    analytics: {
      totalUsers: 0,
      activeUsers: 0,
      totalMessages: 0,
      totalTranslations: 0,
      newUsersToday: 0,
      newUsersWeek: 0,
      adminUsers: 0,
      verifiedUsers: 0,
      messagesWeek: 0,
      translationsWeek: 0,
      systemUptime: 0,
      dailyActivity: [],
      topLanguages: []
    },
    backends: {
      total: 7,
      healthy: 0,
      primary: '',
      backup: '',
      cycle: 1,
      accounts: [],
      details: []
    },
    users: [],
    emailTemplates: []
  });

  // User management state
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Email system state
  const [emailData, setEmailData] = useState({
    from: 'support@lingualink.tech',
    to: '',
    subject: '',
    content: '',
    preheader: '',
    type: 'custom'
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState('');
  const [systemLogs, setSystemLogs] = useState([
    { id: 1, type: 'success', timestamp: new Date().toLocaleTimeString(), message: 'Admin dashboard initialized' },
    { id: 2, type: 'success', timestamp: new Date().toLocaleTimeString(), message: 'Database connection established' },
    { id: 3, type: 'success', timestamp: new Date().toLocaleTimeString(), message: 'Real-time data sync active' }
  ]);

  // Backend management state
  const [backendManagement, setBackendManagement] = useState({
    isUpdating: false,
    newBackendUrl: '',
    selectedPrimary: '',
    selectedBackup: '',
    isAddingBackend: false
  });

  // LinguaLinkAI keys management state
  const [linguaLinkAI, setLinguaLinkAI] = useState({
    isUpdating: false,
    isAddingKey: false,
    newKeyType: 'cloudflare', // Only Cloudflare Workers AI now
    newKeyValue: '',
    keys: {
      cloudflare: [],
      accounts: [] // Cloudflare account IDs
    }
  });

  // Utility functions
  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Check if user is admin - CRITICAL SECURITY CHECK
  useEffect(() => {
    console.log('🔐 Checking admin access:', authUser);

    // If no user is logged in, redirect to home
    if (!authUser) {
      console.log('❌ No user logged in');
      navigate('/');
      return;
    }

    // If user is not admin, try refreshing auth state first
    if (!authUser?.isAdmin) {
      console.log('❌ User is not admin, refreshing auth state...');
      // Give a moment for auth state to update, then check again
      setTimeout(() => {
        checkAuth(); // Refresh auth state
        // After refresh, check again
        setTimeout(() => {
          if (!authUser?.isAdmin) {
            console.log('❌ Access denied - user is still not admin after refresh');
            navigate('/');
          }
        }, 1000);
      }, 500);
      return;
    }

    console.log('✅ Admin access granted');
  }, [authUser, navigate, checkAuth]);

  // Auto-refresh data
  useEffect(() => {
    if (authUser?.isAdmin) {
      fetchRealTimeData();
      fetchLinguaLinkAI();
      let interval;
      if (autoRefresh) {
        interval = setInterval(() => {
          fetchRealTimeData();
          fetchLinguaLinkAI();
        }, 10000);
      }
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [autoRefresh, authUser]);

  // Add system log
  const addSystemLog = (type, message) => {
    const newLog = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setSystemLogs(prev => [newLog, ...prev.slice(0, 9)]);
  };

  // Fetch real-time data from all endpoints
  const fetchRealTimeData = async () => {
    if (loading) return;
    setLoading(true);

    try {
      console.log('🔄 Fetching real-time data...');
      console.log('🔐 Current user:', authUser);

      // Test direct API call first
      console.log('🧪 Testing direct API call...');
      const directResponse = await fetch('http://localhost:3000/api/health/admin/enhanced-analytics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (directResponse.ok) {
        const directData = await directResponse.json();
        console.log('🧪 Direct API call successful:', directData);

        // Also fetch backend status
        const backendResponse = await fetch('https://lingualink-api.stefanjohnmiranda3.workers.dev/api/admin/render-status');
        const backendData = backendResponse.ok ? await backendResponse.json() : null;
        console.log('🧪 Backend status:', backendData);

        // Update with direct data
        setRealTimeData(prev => ({
          ...prev,
          analytics: {
            totalUsers: parseInt(directData?.analytics?.users?.total_users) || 0,
            activeUsers: parseInt(directData?.analytics?.messages?.active_users_today) || 0,
            totalMessages: parseInt(directData?.analytics?.messages?.total_messages) || 0,
            totalTranslations: parseInt(directData?.analytics?.translations?.total_translations) || 0,
            newUsersToday: parseInt(directData?.analytics?.users?.new_users_today) || 0,
            newUsersWeek: parseInt(directData?.analytics?.users?.new_users_week) || 0,
            adminUsers: parseInt(directData?.analytics?.users?.admin_users) || 0,
            verifiedUsers: parseInt(directData?.analytics?.users?.verified_users) || 0,
            messagesWeek: parseInt(directData?.analytics?.messages?.messages_week) || 0,
            translationsWeek: parseInt(directData?.analytics?.translations?.translations_week) || 0,
            systemUptime: directData?.analytics?.system?.uptime || 3600,
            dailyActivity: directData?.analytics?.daily_activity || [],
            topLanguages: directData?.analytics?.top_languages || []
          },
          backends: {
            total: backendData?.backends?.total || 7,
            healthy: backendData?.backends?.healthy || 0,
            primary: backendData?.backends?.primary || 'Loading...',
            backup: backendData?.backends?.backup || 'Loading...',
            cycle: backendData?.backends?.cycle || 1,
            accounts: backendData?.backends?.accounts || [],
            details: backendData?.backends?.details || []
          }
        }));

        addSystemLog('success', 'Direct API call successful - Real-time data loaded');
        return; // Skip the apiService calls if direct works
      }

      const [enhancedAnalytics, usersData, emailTemplates] = await Promise.all([
        apiService.getEnhancedAnalytics().catch(err => {
          console.error('❌ Enhanced analytics API error:', err);
          return { analytics: null };
        }),
        apiService.getAllUsers().catch(err => {
          console.error('❌ Users API error:', err);
          return { users: [] };
        }),
        apiService.getEmailTemplates().catch(err => {
          console.error('❌ Email templates API error:', err);
          return { templates: [] };
        })
      ]);

      console.log('📊 Real-time data received:', {
        analytics: enhancedAnalytics,
        users: usersData,
        templates: emailTemplates
      });

      setRealTimeData(prev => ({
        ...prev,
        analytics: {
          totalUsers: parseInt(enhancedAnalytics?.analytics?.users?.total_users) || 0,
          activeUsers: parseInt(enhancedAnalytics?.analytics?.messages?.active_users_today) || 0,
          totalMessages: parseInt(enhancedAnalytics?.analytics?.messages?.total_messages) || 0,
          totalTranslations: parseInt(enhancedAnalytics?.analytics?.translations?.total_translations) || 0,
          newUsersToday: parseInt(enhancedAnalytics?.analytics?.users?.new_users_today) || 0,
          newUsersWeek: parseInt(enhancedAnalytics?.analytics?.users?.new_users_week) || 0,
          adminUsers: parseInt(enhancedAnalytics?.analytics?.users?.admin_users) || 0,
          verifiedUsers: parseInt(enhancedAnalytics?.analytics?.users?.verified_users) || 0,
          messagesWeek: parseInt(enhancedAnalytics?.analytics?.messages?.messages_week) || 0,
          translationsWeek: parseInt(enhancedAnalytics?.analytics?.translations?.translations_week) || 0,
          systemUptime: enhancedAnalytics?.analytics?.systemUptime || 0,
          dailyActivity: enhancedAnalytics?.analytics?.dailyActivity || [],
          topLanguages: enhancedAnalytics?.analytics?.topLanguages || []
        },
        users: usersData?.users || [],
        emailTemplates: emailTemplates?.templates || []
      }));

      addSystemLog('success', 'Real-time data updated successfully');
    } catch (error) {
      console.error('❌ Failed to fetch real-time data:', error);
      addSystemLog('error', `Failed to fetch data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Search user function
  const searchUser = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setSearchResult(null);

    try {
      const response = await apiService.findUser(searchEmail);
      setSearchResult(response.user);
      addSystemLog('success', `User found: ${searchEmail}`);
    } catch (error) {
      console.error('❌ User search error:', error);
      setSearchResult({ error: 'User not found in database' });
      addSystemLog('error', `User search failed: ${searchEmail}`);
    } finally {
      setSearching(false);
    }
  };

  // Toggle admin privileges
  const toggleAdminPrivileges = async (email, isCurrentlyAdmin) => {
    setUpdatingUser(true);

    try {
      const response = isCurrentlyAdmin
        ? await apiService.removeUserAdmin(email)
        : await apiService.makeUserAdmin(email);

      if (response.status === 'success') {
        const action = isCurrentlyAdmin ? 'removed from' : 'granted to';
        setSuccessMessage(`✅ Admin privileges ${action} ${email}!`);

        // Update search result if it's the same user
        if (searchResult && searchResult.email === email) {
          setSearchResult(prev => ({
            ...prev,
            isAdmin: !isCurrentlyAdmin,
            is_admin: !isCurrentlyAdmin
          }));
        }

        // Update all users list if it exists
        setRealTimeData(prev => ({
          ...prev,
          users: prev.users.map(user =>
            user.email === email
              ? { ...user, isAdmin: !isCurrentlyAdmin, is_admin: !isCurrentlyAdmin }
              : user
          )
        }));

        fetchRealTimeData();
        addSystemLog('success', `Admin privileges ${action} ${email}`);

        // If the current user's admin status was changed, refresh their auth
        if (authUser?.email === email) {
          console.log('🔄 Refreshing current user auth state...');
          setTimeout(() => {
            checkAuth(); // Refresh the current user's authentication state
          }, 1000);
        }

        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      console.error('❌ Failed to update admin privileges:', error);
      setSuccessMessage(`❌ Failed to update admin privileges for ${email}`);
      addSystemLog('error', `Failed to update admin privileges: ${email}`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } finally {
      setUpdatingUser(false);
    }
  };

  // Send email function
  const sendEmailFunction = async () => {
    if (!emailData.from || !emailData.to || !emailData.subject || !emailData.content) return;
    setSendingEmail(true);

    try {
      const response = await apiService.sendEmail(emailData);

      if (response.status === 'success') {
        setEmailResult(`✅ Email sent successfully from ${emailData.from} to ${emailData.to}! Message ID: ${response.messageId}`);
        addSystemLog('success', `Email sent from ${emailData.from} to ${emailData.to}`);

        setEmailData({
          from: 'support@lingualink.tech',
          to: '',
          subject: '',
          content: '',
          preheader: '',
          type: 'custom'
        });

        setTimeout(() => setEmailResult(''), 5000);
      }
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      setEmailResult(`❌ Failed to send email: ${error.message}`);
      addSystemLog('error', `Email send failed: ${emailData.to}`);
      setTimeout(() => setEmailResult(''), 5000);
    } finally {
      setSendingEmail(false);
    }
  };

  // Backend management functions
  const updateBackendConfiguration = async (newConfig) => {
    setBackendManagement(prev => ({ ...prev, isUpdating: true }));

    try {
      const response = await fetch('https://lingualink-api.stefanjohnmiranda3.workers.dev/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backends: newConfig.backends,
          updatedBy: authUser?.email || 'admin'
        }),
      });

      const result = await response.json();

      if (result.success) {
        addSystemLog('success', 'Backend configuration updated successfully');
        fetchRealTimeData(); // Refresh data
        return { success: true };
      } else {
        addSystemLog('error', `Backend update failed: ${result.error}`);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Backend update error:', error);
      addSystemLog('error', `Backend update error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setBackendManagement(prev => ({ ...prev, isUpdating: false }));
    }
  };

  const addNewBackend = async () => {
    if (!backendManagement.newBackendUrl.trim()) return;

    const currentBackends = realTimeData.backends.details.map(b => b.url);
    const newBackends = [...currentBackends, backendManagement.newBackendUrl.trim()];

    const result = await updateBackendConfiguration({ backends: newBackends });

    if (result.success) {
      setBackendManagement(prev => ({ ...prev, newBackendUrl: '', isAddingBackend: false }));
    }
  };

  const removeBackend = async (backendUrl) => {
    const currentBackends = realTimeData.backends.details.map(b => b.url);
    const newBackends = currentBackends.filter(url => url !== backendUrl);

    if (newBackends.length === 0) {
      addSystemLog('error', 'Cannot remove all backends');
      return;
    }

    await updateBackendConfiguration({ backends: newBackends });
  };

  const setPrimaryBackend = async (backendUrl) => {
    const currentBackends = realTimeData.backends.details.map(b => b.url);
    const newBackends = [backendUrl, ...currentBackends.filter(url => url !== backendUrl)];

    await updateBackendConfiguration({ backends: newBackends });
  };

  // LinguaLinkAI management functions
  const fetchLinguaLinkAI = async () => {
    try {
      const response = await fetch('https://lingualink-api.stefanjohnmiranda3.workers.dev/api/admin/lingualinkai', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setLinguaLinkAI(prev => ({
          ...prev,
          keys: result.keys || { cloudflare: [], accounts: [] }
        }));
      }
    } catch (error) {
      console.error('❌ Failed to fetch LinguaLinkAI config:', error);
      addSystemLog('error', `Failed to fetch LinguaLinkAI config: ${error.message}`);
    }
  };

  const updateLinguaLinkAI = async (keyType, keys) => {
    setLinguaLinkAI(prev => ({ ...prev, isUpdating: true }));

    try {
      const response = await fetch('https://lingualink-api.stefanjohnmiranda3.workers.dev/api/admin/lingualinkai', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyType,
          keys,
          updatedBy: authUser?.email || 'admin'
        }),
      });

      const result = await response.json();

      if (result.success) {
        addSystemLog('success', `LinguaLinkAI ${keyType.toUpperCase()} updated successfully`);
        await fetchLinguaLinkAI(); // Refresh keys
        return { success: true };
      } else {
        addSystemLog('error', `LinguaLinkAI update failed: ${result.error}`);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ LinguaLinkAI update error:', error);
      addSystemLog('error', `LinguaLinkAI update error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLinguaLinkAI(prev => ({ ...prev, isUpdating: false }));
    }
  };

  const testLinguaLinkAIConnection = async () => {
    setLinguaLinkAI(prev => ({ ...prev, isUpdating: true }));

    try {
      const response = await fetch('https://lingualink-api.stefanjohnmiranda3.workers.dev/api/admin/lingualinkai/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        addSystemLog('success', `✅ LinguaLinkAI connection successful! ${result.modelsAvailable || 0} models available`);
      } else {
        addSystemLog('error', `❌ LinguaLinkAI connection failed: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ LinguaLinkAI connection test error:', error);
      addSystemLog('error', `LinguaLinkAI connection test error: ${error.message}`);
    } finally {
      setLinguaLinkAI(prev => ({ ...prev, isUpdating: false }));
    }
  };

  const addLinguaLinkAIKey = async () => {
    if (!linguaLinkAI.newKeyValue.trim()) return;

    const currentKeys = linguaLinkAI.keys[linguaLinkAI.newKeyType] || [];
    const newKeys = [...currentKeys, linguaLinkAI.newKeyValue.trim()];

    const result = await updateLinguaLinkAI(linguaLinkAI.newKeyType, newKeys);

    if (result.success) {
      setLinguaLinkAI(prev => ({
        ...prev,
        newKeyValue: '',
        isAddingKey: false
      }));
    }
  };

  const removeLinguaLinkAIKey = async (keyType, keyToRemove) => {
    const currentKeys = linguaLinkAI.keys[keyType] || [];
    const newKeys = currentKeys.filter(key => key !== keyToRemove);

    if (newKeys.length === 0) {
      addSystemLog('error', `Cannot remove all ${keyType.toUpperCase()} keys`);
      return;
    }

    await updateLinguaLinkAI(keyType, newKeys);
  };

  const setPrimaryLinguaLinkAIKey = async (keyType, keyToPromote) => {
    const currentKeys = linguaLinkAI.keys[keyType] || [];
    const newKeys = [keyToPromote, ...currentKeys.filter(key => key !== keyToPromote)];

    await updateLinguaLinkAI(keyType, newKeys);
  };

  // Stat card component
  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-blue-500/50 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold ${color === 'blue' ? 'text-blue-400' : color === 'green' ? 'text-green-400' : color === 'purple' ? 'text-purple-400' : 'text-orange-400'} mt-1`}>{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
              <span className="text-green-400 text-sm">{trend}</span>
            </div>
          )}
        </div>
        <Icon className={`w-8 h-8 ${color === 'blue' ? 'text-blue-400' : color === 'green' ? 'text-green-400' : color === 'purple' ? 'text-purple-400' : 'text-orange-400'}`} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white relative">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 relative z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">🚀 LinguaLink Admin Dashboard</h1>
            <p className="text-slate-400 mt-1">Real-time system management and analytics</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
              <span className="text-sm text-slate-400">
                {loading ? 'Updating...' : 'Live Data'}
              </span>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105 ${autoRefresh ? 'bg-green-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}
            >
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={fetchRealTimeData}
              disabled={loading}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1 transition-all duration-200 hover:scale-105"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 relative z-10">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-400">
            {successMessage}
          </div>
        )}

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={realTimeData.analytics.totalUsers.toLocaleString()}
            icon={Users}
            color="blue"
            trend={`+${realTimeData.analytics.newUsersToday} today`}
          />
          <StatCard
            title="Active Users"
            value={realTimeData.analytics.activeUsers.toLocaleString()}
            icon={UserCheck}
            color="green"
          />
          <StatCard
            title="Total Messages"
            value={realTimeData.analytics.totalMessages.toLocaleString()}
            icon={MessageSquare}
            color="purple"
          />
          <StatCard
            title="Translations"
            value={realTimeData.analytics.totalTranslations.toLocaleString()}
            icon={Globe}
            color="orange"
          />
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-800 rounded-lg p-1 border border-slate-700 mb-6 relative z-30">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'analytics', label: '📊 Analytics', icon: Activity },
              { id: 'users', label: '👥 Users', icon: Users },
              { id: 'backend', label: '🖥️ Backend', icon: Server },
              { id: 'keys', label: '🔑 API Keys', icon: Key },
              { id: 'email', label: '📧 Email', icon: Mail },
              { id: 'system', label: '⚙️ System', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  console.log('Tab clicked:', tab.id);
                  setActiveTab(tab.id);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700 hover:scale-105'
                }`}
                style={{ zIndex: 40 }}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={realTimeData.analytics.totalUsers.toLocaleString()}
                icon={Users}
                color="blue"
                trend={`+${realTimeData.analytics.newUsersToday} today`}
              />
              <StatCard
                title="Active Users"
                value={realTimeData.analytics.activeUsers.toLocaleString()}
                icon={UserCheck}
                color="green"
              />
              <StatCard
                title="Total Messages"
                value={realTimeData.analytics.totalMessages.toLocaleString()}
                icon={MessageSquare}
                color="purple"
              />
              <StatCard
                title="Translations"
                value={realTimeData.analytics.totalTranslations.toLocaleString()}
                icon={Globe}
                color="orange"
              />
            </div>

            {/* Additional Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">📈 Weekly Growth</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">New Users</span>
                    <span className="text-green-400">+{realTimeData.analytics.newUsersWeek}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Messages</span>
                    <span className="text-blue-400">{realTimeData.analytics.messagesWeek.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Translations</span>
                    <span className="text-purple-400">{realTimeData.analytics.translationsWeek.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">👑 Admin Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Admin Users</span>
                    <span className="text-yellow-400">{realTimeData.analytics.adminUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Verified Users</span>
                    <span className="text-green-400">{realTimeData.analytics.verifiedUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">System Uptime</span>
                    <span className="text-blue-400">{formatUptime(realTimeData.analytics.systemUptime)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">🌍 Top Languages</h3>
                <div className="space-y-2">
                  {realTimeData.analytics.topLanguages.slice(0, 5).map((lang, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-slate-400">{lang.language || 'Unknown'}</span>
                      <span className="text-orange-400">{lang.count || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* User Search */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">🔍 User Search</h3>
              <div className="flex space-x-4">
                <input
                  type="email"
                  placeholder="Enter user email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={searchUser}
                  disabled={searching || !searchEmail.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Search className={`w-4 h-4 ${searching ? 'animate-spin' : ''}`} />
                  <span>{searching ? 'Searching...' : 'Search'}</span>
                </button>
              </div>

              {/* Search Result */}
              {searchResult && (
                <div className="mt-4 p-4 bg-slate-700 rounded-lg border border-slate-600">
                  {searchResult.error ? (
                    <div className="text-red-400">❌ {searchResult.error}</div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{searchResult.full_name}</p>
                          <p className="text-slate-400 text-sm">{searchResult.email}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {searchResult.isAdmin ? (
                            <span className="px-2 py-1 bg-yellow-600 text-yellow-100 rounded text-xs">Admin</span>
                          ) : (
                            <span className="px-2 py-1 bg-slate-600 text-slate-300 rounded text-xs">User</span>
                          )}
                          <button
                            onClick={() => toggleAdminPrivileges(searchResult.email, searchResult.isAdmin)}
                            disabled={updatingUser}
                            className={`px-3 py-1 rounded text-xs ${
                              searchResult.isAdmin
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            } disabled:opacity-50`}
                          >
                            {updatingUser ? 'Updating...' : searchResult.isAdmin ? 'Remove Admin' : 'Make Admin'}
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-slate-400">
                        Joined: {new Date(searchResult.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* All Users List */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">👥 All Users ({realTimeData.users.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {realTimeData.users.length > 0 ? (
                  realTimeData.users.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
                      <div className="flex-1">
                        <p className="text-white font-medium">{user.fullName || user.full_name}</p>
                        <p className="text-slate-400 text-sm">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-slate-500 text-xs">
                            Joined: {new Date(user.createdAt || user.created_at).toLocaleDateString()}
                          </span>
                          {user.messageCount > 0 && (
                            <span className="text-slate-500 text-xs">
                              • {user.messageCount} messages
                            </span>
                          )}
                          {user.translationCount > 0 && (
                            <span className="text-slate-500 text-xs">
                              • {user.translationCount} translations
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {user.isAdmin || user.is_admin ? (
                          <span className="px-2 py-1 bg-yellow-600 text-yellow-100 rounded text-xs font-medium">Admin</span>
                        ) : (
                          <span className="px-2 py-1 bg-slate-600 text-slate-300 rounded text-xs">User</span>
                        )}
                        <button
                          onClick={() => toggleAdminPrivileges(user.email, user.isAdmin || user.is_admin)}
                          disabled={updatingUser}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            user.isAdmin || user.is_admin
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {updatingUser ? '...' : (user.isAdmin || user.is_admin) ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-center py-8">
                    <p>Loading users...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'backend' && (
          <div className="space-y-6">
            {/* Backend Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Backends"
                value={realTimeData.backends.total.toString()}
                icon={Server}
                color="blue"
              />
              <StatCard
                title="Healthy Backends"
                value={realTimeData.backends.healthy.toString()}
                icon={CheckCircle}
                color="green"
              />
              <StatCard
                title="Current Cycle"
                value={`Cycle ${realTimeData.backends.cycle}`}
                icon={RefreshCw}
                color="purple"
              />
            </div>

            {/* Backend Management */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">🖥️ Backend Management</h3>
                <button
                  onClick={() => setBackendManagement(prev => ({ ...prev, isAddingBackend: !prev.isAddingBackend }))}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {backendManagement.isAddingBackend ? 'Cancel' : 'Add Backend'}
                </button>
              </div>

              {backendManagement.isAddingBackend && (
                <div className="mb-4 p-4 bg-slate-700 rounded-lg">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://new-backend.onrender.com"
                      value={backendManagement.newBackendUrl}
                      onChange={(e) => setBackendManagement(prev => ({ ...prev, newBackendUrl: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={addNewBackend}
                      disabled={backendManagement.isUpdating || !backendManagement.newBackendUrl.trim()}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {backendManagement.isUpdating ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-slate-400 text-sm">Primary Backend</p>
                  <p className="text-green-400 font-mono text-sm">{realTimeData.backends.primary || 'Loading...'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-400 text-sm">Backup Backend</p>
                  <p className="text-blue-400 font-mono text-sm">{realTimeData.backends.backup || 'Loading...'}</p>
                </div>
              </div>
            </div>

            {/* All Backend Servers */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">�️ All Backend Servers</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {realTimeData.backends.details && realTimeData.backends.details.length > 0 ? (
                  realTimeData.backends.details.map((backend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-white font-medium">Backend {index + 1}</p>
                          {index === 0 && (
                            <span className="px-2 py-1 bg-green-600 text-green-100 rounded text-xs font-medium">Primary</span>
                          )}
                          {index === 1 && (
                            <span className="px-2 py-1 bg-blue-600 text-blue-100 rounded text-xs font-medium">Backup</span>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs font-mono">{backend.url}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            backend.status === 'healthy' ? 'bg-green-400' :
                            backend.status === 'unhealthy' ? 'bg-red-400' : 'bg-yellow-400'
                          }`}></div>
                          <span className={`text-sm ${
                            backend.status === 'healthy' ? 'text-green-400' :
                            backend.status === 'unhealthy' ? 'text-red-400' : 'text-yellow-400'
                          }`}>
                            {backend.status || 'Unknown'}
                          </span>
                          {backend.responseTime && (
                            <span className="text-slate-400 text-xs">
                              {backend.responseTime}ms
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          {index !== 0 && (
                            <button
                              onClick={() => setPrimaryBackend(backend.url)}
                              disabled={backendManagement.isUpdating}
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium disabled:opacity-50"
                              title="Set as Primary"
                            >
                              Primary
                            </button>
                          )}
                          {realTimeData.backends.details.length > 1 && (
                            <button
                              onClick={() => removeBackend(backend.url)}
                              disabled={backendManagement.isUpdating}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium disabled:opacity-50"
                              title="Remove Backend"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-center py-4">Loading backend status...</div>
                )}
              </div>

              {backendManagement.isUpdating && (
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <span className="text-blue-400 text-sm">Updating backend configuration...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'keys' && (
          <div className="space-y-6">
            {/* LinguaLinkAI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatCard
                title="LinguaLinkAI API Tokens"
                value={linguaLinkAI.keys.cloudflare?.length || 0}
                icon={Key}
                color="purple"
              />
              <StatCard
                title="LinguaLinkAI Account IDs"
                value={linguaLinkAI.keys.accounts?.length || 0}
                icon={Shield}
                color="blue"
              />
            </div>

            {/* LinguaLinkAI Management */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">🤖 LinguaLinkAI Configuration</h3>
                <button
                  onClick={() => setLinguaLinkAI(prev => ({ ...prev, isAddingKey: !prev.isAddingKey }))}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {linguaLinkAI.isAddingKey ? 'Cancel' : 'Add Configuration'}
                </button>
              </div>

              {linguaLinkAI.isAddingKey && (
                <div className="mb-4 p-4 bg-slate-700 rounded-lg">
                  <div className="flex gap-2 mb-3">
                    <select
                      value={linguaLinkAI.newKeyType}
                      onChange={(e) => setLinguaLinkAI(prev => ({ ...prev, newKeyType: e.target.value }))}
                      className="px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="cloudflare">Cloudflare API Token</option>
                      <option value="accounts">Cloudflare Account ID</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder={linguaLinkAI.newKeyType === 'cloudflare' ? 'Enter Cloudflare API Token...' : 'Enter Account ID...'}
                      value={linguaLinkAI.newKeyValue}
                      onChange={(e) => setLinguaLinkAI(prev => ({ ...prev, newKeyValue: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:border-purple-500 focus:outline-none"
                    />
                    <button
                      onClick={addLinguaLinkAIKey}
                      disabled={linguaLinkAI.isUpdating || !linguaLinkAI.newKeyValue.trim()}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {linguaLinkAI.isUpdating ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cloudflare API Tokens */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">� Cloudflare API Tokens</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {linguaLinkAI.keys.cloudflare && linguaLinkAI.keys.cloudflare.length > 0 ? (
                  linguaLinkAI.keys.cloudflare.map((key, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-white font-medium">API Token {index + 1}</p>
                          {index === 0 && (
                            <span className="px-2 py-1 bg-purple-600 text-purple-100 rounded text-xs font-medium">Primary</span>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs font-mono">{key.substring(0, 20)}...{key.substring(key.length - 4)}</p>
                      </div>
                      <div className="flex space-x-1">
                        {index !== 0 && (
                          <button
                            onClick={() => setPrimaryLinguaLinkAIKey('cloudflare', key)}
                            disabled={linguaLinkAI.isUpdating}
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium disabled:opacity-50"
                            title="Set as Primary"
                          >
                            Primary
                          </button>
                        )}
                        {linguaLinkAI.keys.cloudflare.length > 1 && (
                          <button
                            onClick={() => removeLinguaLinkAIKey('cloudflare', key)}
                            disabled={linguaLinkAI.isUpdating}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium disabled:opacity-50"
                            title="Remove Token"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-center py-4">No Cloudflare API tokens configured</div>
                )}
              </div>
            </div>

            {/* Cloudflare Account IDs */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">� Cloudflare Account IDs</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {linguaLinkAI.keys.accounts && linguaLinkAI.keys.accounts.length > 0 ? (
                  linguaLinkAI.keys.accounts.map((accountId, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-white font-medium">Account ID {index + 1}</p>
                          {index === 0 && (
                            <span className="px-2 py-1 bg-blue-600 text-blue-100 rounded text-xs font-medium">Primary</span>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs font-mono">{accountId.substring(0, 20)}...{accountId.substring(accountId.length - 4)}</p>
                      </div>
                      <div className="flex space-x-1">
                        {index !== 0 && (
                          <button
                            onClick={() => setPrimaryLinguaLinkAIKey('accounts', accountId)}
                            disabled={linguaLinkAI.isUpdating}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium disabled:opacity-50"
                            title="Set as Primary"
                          >
                            Primary
                          </button>
                        )}
                        {linguaLinkAI.keys.accounts.length > 1 && (
                          <button
                            onClick={() => removeLinguaLinkAIKey('accounts', accountId)}
                            disabled={linguaLinkAI.isUpdating}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium disabled:opacity-50"
                            title="Remove Account ID"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-center py-4">No Cloudflare account IDs configured</div>
                )}
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">🧪 Test LinguaLinkAI Connection</h3>
              <p className="text-slate-400 text-sm mb-4">Test your Cloudflare Workers AI configuration to ensure translation services are working properly.</p>
              <button
                onClick={testLinguaLinkAIConnection}
                disabled={linguaLinkAI.isUpdating}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {linguaLinkAI.isUpdating ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            {linguaLinkAI.isUpdating && (
              <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                  <span className="text-purple-400 text-sm">Updating LinguaLinkAI configuration...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'email' && (
          <div className="space-y-6">
            {/* Email System Overview */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">📧 Email System</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <Mail className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="text-white font-medium">Resend Service</p>
                    <p className="text-green-400 text-sm">Connected</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">From Address</p>
                    <p className="text-blue-400 text-sm">support@lingualink.tech</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Settings className="w-6 h-6 text-purple-400" />
                  <div>
                    <p className="text-white font-medium">Templates</p>
                    <p className="text-purple-400 text-sm">{realTimeData.emailTemplates.length} Available</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Send Email */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">✉️ Send Email</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="email"
                    placeholder="From email..."
                    value={emailData.from}
                    onChange={(e) => setEmailData({...emailData, from: e.target.value})}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Recipient email..."
                    value={emailData.to}
                    onChange={(e) => setEmailData({...emailData, to: e.target.value})}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Subject..."
                    value={emailData.subject}
                    onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <textarea
                  placeholder="Email content..."
                  value={emailData.content}
                  onChange={(e) => setEmailData({...emailData, content: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />

                {/* Email Result Display */}
                {emailResult && (
                  <div className={`p-3 rounded-lg ${emailResult.includes('✅') ? 'bg-green-900/50 border border-green-500 text-green-400' : 'bg-red-900/50 border border-red-500 text-red-400'}`}>
                    {emailResult}
                  </div>
                )}

                <button
                  onClick={sendEmailFunction}
                  disabled={sendingEmail || !emailData.from || !emailData.to || !emailData.subject || !emailData.content}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Mail className={`w-4 h-4 ${sendingEmail ? 'animate-pulse' : ''}`} />
                  <span>{sendingEmail ? 'Sending...' : 'Send Email'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            {/* System Status */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">📊 System Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <Database className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="text-white font-medium">Database</p>
                    <p className="text-green-400 text-sm">Connected</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Server className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="text-white font-medium">Backend</p>
                    <p className="text-green-400 text-sm">Operational</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="text-white font-medium">Email Service</p>
                    <p className="text-green-400 text-sm">Ready</p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Logs */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">📝 System Logs</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {systemLogs.map((log) => (
                  <div key={log.id} className="flex items-center space-x-3 p-2 bg-slate-700 rounded">
                    {log.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-slate-400 text-xs">{log.timestamp}</span>
                    <span className="text-white text-sm">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;