import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Toggle } from '../ui/Toggle';
import { AssetTypeDTO, ModuleDTO } from '../../types';

interface AssetTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assetType: AssetTypeFormData) => Promise<void>;
  assetType?: AssetTypeDTO | null;
  modules: ModuleDTO[];
}

export interface AssetTypeFormData {
  name: string;
  subtype: string;
  category: string;
  description?: string;
  moduleId?: string;
  isActive?: boolean;
}

export const AssetTypeFormModal: React.FC<AssetTypeFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  assetType,
  modules,
}) => {
  const [formData, setFormData] = useState<AssetTypeFormData>({
    name: '',
    subtype: '',
    category: '',
    description: '',
    moduleId: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (assetType) {
      setFormData({
        name: assetType.name,
        subtype: assetType.subtype,
        category: assetType.category,
        description: assetType.description || '',
        moduleId: assetType.moduleId || '',
        isActive: assetType.isActive,
      });
    } else {
      setFormData({
        name: '',
        subtype: '',
        category: '',
        description: '',
        moduleId: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [assetType, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Asset type name is required';
    }

    if (!formData.subtype.trim()) {
      newErrors.subtype = 'Subtype is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save asset type:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={assetType ? 'Edit Asset Type' : 'Add Asset Type'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Asset Type Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter asset type name"
            error={errors.name}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subtype <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.subtype}
              onChange={(e) => setFormData({ ...formData, subtype: e.target.value })}
              placeholder="Enter subtype"
              error={errors.subtype}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Enter category"
              error={errors.category}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Module
          </label>
          <Select
            value={formData.moduleId || ''}
            onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
          >
            <option value="">Select module (optional)</option>
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter description"
          />
        </div>

        {assetType && (
          <div className="flex items-center gap-2">
            <Toggle
              checked={formData.isActive}
              onChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <label className="text-sm font-medium text-gray-700">Active</label>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : assetType ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
