// File: frontend/components/admin/FeatureFlags.tsx
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminSettingsAPI, FeatureFlag } from '@/lib/adminSettings';
import { 
  Plus, Edit, Trash2, Users, Percent, 
  CheckCircle, Clock, AlertCircle, Eye, Settings
} from 'lucide-react';

interface FeatureFlagModalProps {
  flag?: FeatureFlag;
  isOpen: boolean;
  onClose: () => void;
  onSave: (flag: FeatureFlag) => void;
}

const FeatureFlagModal: React.FC<FeatureFlagModalProps> = ({ 
  flag, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    flag_key: '',
    flag_name: '',
    description: '',
    is_enabled: false,
    rollout_percentage: 0,
    target_user_types: [] as string[]
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (flag) {
      setFormData({
        flag_key: flag.flag_key,
        flag_name: flag.flag_name,
        description: flag.description || '',
        is_enabled: flag.is_enabled,
        rollout_percentage: flag.rollout_percentage,
        target_user_types: flag.target_user_types || []
      });
    } else {
      setFormData({
        flag_key: '',
        flag_name: '',
        description: '',
        is_enabled: false,
        rollout_percentage: 0,
        target_user_types: []
      });
    }
  }, [flag, isOpen]);

  const handleSave = async () => {
    if (!formData.flag_key || !formData.flag_name) {
      toast.error('Flag key and name are required');
      return;
    }

    setSaving(true);
    try {
      let savedFlag;
      if (flag) {
        savedFlag = await adminSettingsAPI.updateFeatureFlag(flag.flag_id, formData);
      } else {
        savedFlag = await adminSettingsAPI.createFeatureFlag(formData);
      }
      
      onSave(savedFlag);
      toast.success(`Feature flag ${flag ? 'updated' : 'created'} successfully!`);
      onClose();
    } catch (error) {
      console.error('Error saving feature flag:', error);
      toast.error('Failed to save feature flag');
    } finally {
      setSaving(false);
    }
  };

  const toggleUserType = (userType: string) => {
    setFormData(prev => ({
      ...prev,
      target_user_types: prev.target_user_types.includes(userType)
        ? prev.target_user_types.filter(t => t !== userType)
        : [...prev.target_user_types, userType]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-purple-500/20 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-purple-500/20">
          <h2 className="text-xl font-bold text-white">
            {flag ? 'Edit Feature Flag' : 'Create Feature Flag'}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Configure feature flags for A/B testing and gradual rollouts
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Flag Key *
              </label>
              <input
                type="text"
                value={formData.flag_key}
                onChange={(e) => setFormData(prev => ({ ...prev, flag_key: e.target.value }))}
                placeholder="new_feature_enabled"
                className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                disabled={!!flag} // Can't edit key of existing flag
              />
              <p className="text-gray-500 text-xs mt-1">
                Unique identifier for this flag (lowercase, underscores only)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                value={formData.flag_name}
                onChange={(e) => setFormData(prev => ({ ...prev, flag_name: e.target.value }))}
                placeholder="New Feature Toggle"
                className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this feature flag controls..."
              rows={3}
              className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Flag Status
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, is_enabled: !prev.is_enabled }))}
                  className={`relative w-12 h-6 rounded-full transition-all ${
                    formData.is_enabled ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                      formData.is_enabled ? 'left-6' : 'left-0.5'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-300">
                  {formData.is_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rollout Percentage
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.rollout_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, rollout_percentage: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">0%</span>
                  <div className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded font-medium">
                    {formData.rollout_percentage}%
                  </div>
                  <span className="text-gray-400">100%</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Target User Types
            </label>
            <div className="flex flex-wrap gap-2">
              {['adventurer', 'coach', 'admin'].map(userType => (
                <button
                  key={userType}
                  onClick={() => toggleUserType(userType)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    formData.target_user_types.includes(userType)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {userType.charAt(0).toUpperCase() + userType.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Leave empty to target all user types
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-purple-500/20 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:border-gray-500 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {flag ? 'Update Flag' : 'Create Flag'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function FeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalFlag, setModalFlag] = useState<FeatureFlag | undefined>();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const flagsData = await adminSettingsAPI.getFeatureFlags();
      setFlags(flagsData);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      toast.error('Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = async (flag: FeatureFlag) => {
    try {
      const updatedFlag = await adminSettingsAPI.updateFeatureFlag(flag.flag_id, {
        is_enabled: !flag.is_enabled
      });
      
      setFlags(prev => prev.map(f => f.flag_id === flag.flag_id ? updatedFlag : f));
      toast.success(`Flag ${updatedFlag.is_enabled ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error('Error toggling flag:', error);
      toast.error('Failed to toggle flag');
    }
  };

  const handleDeleteFlag = async (flag: FeatureFlag) => {
    if (!confirm(`Are you sure you want to delete the "${flag.flag_name}" feature flag?`)) {
      return;
    }

    try {
      await adminSettingsAPI.deleteFeatureFlag(flag.flag_id);
      setFlags(prev => prev.filter(f => f.flag_id !== flag.flag_id));
      toast.success('Feature flag deleted successfully!');
    } catch (error) {
      console.error('Error deleting flag:', error);
      toast.error('Failed to delete flag');
    }
  };

  const handleEditFlag = (flag: FeatureFlag) => {
    setModalFlag(flag);
    setShowModal(true);
  };

  const handleCreateFlag = () => {
    setModalFlag(undefined);
    setShowModal(true);
  };

  const handleSaveFlag = (savedFlag: FeatureFlag) => {
    if (modalFlag) {
      // Update existing
      setFlags(prev => prev.map(f => f.flag_id === savedFlag.flag_id ? savedFlag : f));
    } else {
      // Add new
      setFlags(prev => [savedFlag, ...prev]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Feature Flags</h3>
          <p className="text-gray-400 text-sm">
            Manage A/B testing and gradual feature rollouts
          </p>
        </div>
        <button
          onClick={handleCreateFlag}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Flag
        </button>
      </div>

      {flags.length === 0 ? (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No feature flags created yet</p>
          <button
            onClick={handleCreateFlag}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
          >
            Create Your First Flag
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {flags.map((flag) => (
            <div
              key={flag.flag_id}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-white font-medium">{flag.flag_name}</h4>
                    <div className="flex items-center gap-2">
                      {flag.is_enabled ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-xs">
                          <CheckCircle className="w-3 h-3" />
                          Enabled
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 rounded-md text-xs">
                          <Clock className="w-3 h-3" />
                          Disabled
                        </div>
                      )}
                      
                      {flag.rollout_percentage < 100 && flag.is_enabled && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-md text-xs">
                          <Percent className="w-3 h-3" />
                          {flag.rollout_percentage}%
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-2">{flag.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Key: {flag.flag_key}</span>
                    {flag.target_user_types && flag.target_user_types.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {flag.target_user_types.join(', ')}
                      </div>
                    )}
                    {flag.creator && (
                      <span>Created by: {flag.creator.username}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFlag(flag)}
                    className={`relative w-10 h-5 rounded-full transition-all ${
                      flag.is_enabled ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                        flag.is_enabled ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                  
                  <button
                    onClick={() => handleEditFlag(flag)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteFlag(flag)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FeatureFlagModal
        flag={modalFlag}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveFlag}
      />
    </div>
  );
}