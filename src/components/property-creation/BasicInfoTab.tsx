import React, { useEffect, useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { propertyService } from '../../services/propertyService';
import { AssetTypeDTO, ModuleDTO, PropertyTypeDTO } from '../../types';
import { Toggle } from '../ui/Toggle';
import { FormLoadingSkeleton } from '../ui/LoadingSkeleton';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface BasicInfoTabProps {
  formData: {
    name: string;
    code: string;
    moduleId: string | null;
    propertyTypeId: string | null;
    assetTypeId: string | null;
    isExempt: boolean;
    description: string;
  };
  updateFormData: (updates: any) => void;
}

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ formData, updateFormData }) => {
  const [modules, setModules] = useState<ModuleDTO[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeDTO[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetTypeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPropertyTypes, setLoadingPropertyTypes] = useState(false);
  const [error, setError] = useState<string>('');
  const [codeValidation, setCodeValidation] = useState<{ checking: boolean; exists: boolean; error: string }>({
    checking: false,
    exists: false,
    error: '',
  });
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.moduleId) {
      loadPropertyTypes(formData.moduleId);
    } else {
      setPropertyTypes([]);
    }
  }, [formData.moduleId]);

  const loadInitialData = async () => {
    try {
      setError('');
      const [modulesData, assetTypesData] = await Promise.all([
        propertyService.getModules(),
        propertyService.getAssetTypes(),
      ]);
      setModules(modulesData);
      setAssetTypes(assetTypesData);
    } catch (error: any) {
      console.error('Failed to load initial data:', error);
      setError(error.message || 'Failed to load initial data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const loadPropertyTypes = async (moduleId: string) => {
    try {
      setLoadingPropertyTypes(true);
      const types = await propertyService.getPropertyTypes(moduleId);
      setPropertyTypes(types);
    } catch (error: any) {
      console.error('Failed to load property types:', error);
      setError(error.message || 'Failed to load property types.');
    } finally {
      setLoadingPropertyTypes(false);
    }
  };

  const handleModuleChange = (moduleId: string) => {
    updateFormData({
      moduleId: moduleId || null,
      propertyTypeId: null,
    });
  };

  const handleBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const showValidationError = (field: string, value: any) => {
    return touchedFields[field] && !value;
  };

  useEffect(() => {
    if (!formData.code || formData.code.length < 2) {
      setCodeValidation({ checking: false, exists: false, error: '' });
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCodeValidation({ checking: true, exists: false, error: '' });
      try {
        const exists = await propertyService.checkPropertyCodeExists(formData.code);
        setCodeValidation({ checking: false, exists, error: '' });
      } catch (error: any) {
        setCodeValidation({ checking: false, exists: false, error: 'Failed to validate code' });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.code]);

  if (loading) {
    return <FormLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Property Information</h3>
        <p className="text-sm text-gray-600 mb-6">
          Enter the fundamental details about this property. All fields marked with * are required.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={loadInitialData}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Module *
          </label>
          <Select
            value={formData.moduleId || ''}
            onChange={(e) => handleModuleChange(e.target.value)}
            onBlur={() => handleBlur('moduleId')}
            disabled={loading}
            className={showValidationError('moduleId', formData.moduleId) ? 'border-red-300 focus:ring-red-500' : ''}
          >
            <option value="">Select module...</option>
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.name}
              </option>
            ))}
          </Select>
          {showValidationError('moduleId', formData.moduleId) ? (
            <p className="text-xs text-red-600 mt-1">Module is required</p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">Choose the category of facility</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Type *
          </label>
          <Select
            value={formData.propertyTypeId || ''}
            onChange={(e) => updateFormData({ propertyTypeId: e.target.value || null })}
            onBlur={() => handleBlur('propertyTypeId')}
            disabled={loading || !formData.moduleId || loadingPropertyTypes}
            className={showValidationError('propertyTypeId', formData.propertyTypeId) ? 'border-red-300 focus:ring-red-500' : ''}
          >
            <option value="">
              {!formData.moduleId ? 'Select module first...' : 'Select property type...'}
            </option>
            {propertyTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </Select>
          {showValidationError('propertyTypeId', formData.propertyTypeId) ? (
            <p className="text-xs text-red-600 mt-1">Property type is required</p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              {loadingPropertyTypes ? 'Loading property types...' : 'Select module first to load property types'}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Code *
          </label>
          <div className="relative">
            <Input
              type="text"
              value={formData.code}
              onChange={(e) => updateFormData({ code: e.target.value.toUpperCase() })}
              onBlur={() => handleBlur('code')}
              placeholder="e.g., DCH001"
              required
              className={
                codeValidation.exists || showValidationError('code', formData.code)
                  ? 'border-red-300 focus:ring-red-500'
                  : formData.code && !codeValidation.checking && !codeValidation.exists
                  ? 'border-green-300 focus:ring-green-500'
                  : ''
              }
            />
            {codeValidation.checking && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            )}
            {!codeValidation.checking && formData.code && !codeValidation.exists && (
              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
            )}
            {!codeValidation.checking && codeValidation.exists && (
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
            )}
          </div>
          {codeValidation.exists ? (
            <p className="text-xs text-red-600 mt-1">This property code already exists</p>
          ) : showValidationError('code', formData.code) ? (
            <p className="text-xs text-red-600 mt-1">Property code is required</p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">Unique identifier for this property</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Name *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            onBlur={() => handleBlur('name')}
            placeholder="e.g., Delhi Circuit House"
            required
            className={showValidationError('name', formData.name) ? 'border-red-300 focus:ring-red-500' : ''}
          />
          {showValidationError('name', formData.name) ? (
            <p className="text-xs text-red-600 mt-1">Property name is required</p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">Full name of the property</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Asset Type *
        </label>
        <Select
          value={formData.assetTypeId || ''}
          onChange={(e) => updateFormData({ assetTypeId: e.target.value || null })}
          onBlur={() => handleBlur('assetTypeId')}
          disabled={loading}
          className={showValidationError('assetTypeId', formData.assetTypeId) ? 'border-red-300 focus:ring-red-500' : ''}
        >
          <option value="">Select asset type...</option>
          {assetTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name} - {type.subtype} ({type.category})
            </option>
          ))}
        </Select>
        {showValidationError('assetTypeId', formData.assetTypeId) ? (
          <p className="text-xs text-red-600 mt-1">Asset type is required</p>
        ) : (
          <p className="text-xs text-gray-500 mt-1">Legacy field for reference</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Provide a detailed description of the property..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-900">Exempt from Booking Rules</p>
          <p className="text-xs text-gray-600 mt-1">
            Enable this if the property should bypass standard booking restrictions
          </p>
        </div>
        <Toggle
          checked={formData.isExempt}
          onChange={(checked) => updateFormData({ isExempt: checked })}
        />
      </div>
    </div>
  );
};
