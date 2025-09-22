import React, { useState, useEffect } from 'react';
import { RefreshCw, Server, Activity, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import backendManager from '../services/backendManager.js';
import apiService from '../services/apiService.js';

const BackendStatusDashboard = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState('health_based');

  useEffect(() => {
    if (isOpen) {
      refreshStatus();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval;
    if (autoRefresh && isOpen) {
      interval = setInterval(refreshStatus, 5000); // Refresh every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, isOpen]);

  const refreshStatus = async () => {
    setLoading(true);
    try {
      const statusData = await apiService.getStatus();
      setStatus(statusData);
    } catch (error) {
      console.error('Failed to get status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStrategyChange = async (strategy) => {
    try {
      const success = await apiService.setLoadBalancingStrategy(strategy);
      if (success) {
        setSelectedStrategy(strategy);
        await refreshStatus();
      }
    } catch (error) {
      console.error('Failed to change strategy:', error);
    }
  };

  const forceBackendSwitch = async (backendId) => {
    try {
      const success = await apiService.forceBackendSwitch(backendId);
      if (success) {
        await refreshStatus();
      }
    } catch (error) {
      console.error('Failed to switch backend:', error);
    }
  };

  const getHealthIcon = (isHealthy) => {
    return isHealthy ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getHealthColor = (isHealthy) => {
    return isHealthy ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300';
  };

  const formatUptime = (uptime) => {
    if (!uptime) return 'Unknown';
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Server className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Backend Status Dashboard</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={refreshStatus}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {status ? (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Mode</p>
                      <p className="text-2xl font-bold text-blue-900">{status.mode}</p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                {status.backendManager && (
                  <>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Healthy Backends</p>
                          <p className="text-2xl font-bold text-green-900">
                            {status.backendManager.healthyCount}/{status.backendManager.totalCount}
                          </p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Total Requests</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {status.backendManager.stats.totalRequests}
                          </p>
                        </div>
                        <Activity className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">Backend Switches</p>
                          <p className="text-2xl font-bold text-orange-900">
                            {status.backendManager.stats.backendSwitches}
                          </p>
                        </div>
                        <RefreshCw className="w-8 h-8 text-orange-600" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Load Balancing Strategy */}
              {status.backendManager && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Load Balancing Strategy</h3>
                  <div className="flex flex-wrap gap-2">
                    {apiService.getLoadBalancingStrategies().map((strategy) => (
                      <button
                        key={strategy}
                        onClick={() => handleStrategyChange(strategy)}
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          selectedStrategy === strategy
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {strategy.replace('_', ' ').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Backend Instances */}
              {status.backendManager && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Backend Instances</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {status.backendManager.backends.map((backend) => (
                      <div
                        key={backend.id}
                        className={`p-4 rounded-lg border-2 ${getHealthColor(backend.isHealthy)}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {getHealthIcon(backend.isHealthy)}
                            <span className="font-semibold">Backend {backend.id}</span>
                          </div>
                          <button
                            onClick={() => forceBackendSwitch(backend.id)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Use This
                          </button>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">URL:</span>
                            <span className="ml-2 text-gray-600">{backend.url}</span>
                          </div>
                          <div>
                            <span className="font-medium">Email:</span>
                            <span className="ml-2 text-gray-600">{backend.email}</span>
                          </div>
                          {backend.responseTime && (
                            <div>
                              <span className="font-medium">Response Time:</span>
                              <span className="ml-2 text-gray-600">{backend.responseTime}ms</span>
                            </div>
                          )}
                          {backend.uptime && (
                            <div>
                              <span className="font-medium">Uptime:</span>
                              <span className="ml-2 text-gray-600">{formatUptime(backend.uptime)}</span>
                            </div>
                          )}
                          {backend.consecutiveFailures > 0 && (
                            <div className="flex items-center space-x-1 text-red-600">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="text-xs">
                                {backend.consecutiveFailures} consecutive failures
                              </span>
                            </div>
                          )}
                          {backend.lastCheck && (
                            <div className="flex items-center space-x-1 text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span className="text-xs">
                                Last check: {new Date(backend.lastCheck).toLocaleTimeString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Auto Refresh Toggle */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoRefresh"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="autoRefresh" className="text-sm text-gray-700">
                    Auto-refresh every 5 seconds
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading backend status...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackendStatusDashboard;
