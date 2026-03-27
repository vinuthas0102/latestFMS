import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Toggle } from '../ui/Toggle';
import { EstateDTO, RegionDTO } from '../../types';

interface EstateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (estate: EstateFormData) => Promise<void>;
  estate?: EstateDTO | null;
  regions: RegionDTO[];
}

export interface EstateFormData {
  regionId: string;
  name: string;
  code: string;
  city: string;
  state: string;
  address?: string;
  pincode?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive?: boolean;
}

export const EstateFormModal: React.FC<EstateFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  estate,
  regions,
}) => {
  const [formData, setFormData] = useState<EstateFormData>({
    regionId: '',
    name: '',
    code: '',
    city: '',
    state: '',
    address: '',
    pincode: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (estate) {
      setFormData({
        regionId: estate.regionId,
        name: estate.name,
        code: estate.code,
        city: estate.city,
        state: estate.state,
        address: estate.address || '',
        pincode: estate.pincode || '',
        contactPerson: estate.contactPerson || '',
        contactEmail: estate.contactEmail || '',
        contactPhone: estate.contactPhone || '',
        isActive: estate.isActive,
      });
    } else {
      setFormData({
        regionId: '',
        name: '',
        code: '',
        city: '',
        state: '',
        address: '',
        pincode: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [estate, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Estate name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Estate code is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.regionId) {
      newErrors.regionId = 'Region is required';
    }

    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email format';
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
      console.error('Failed to save estate:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={estate ? 'Edit Estate' : 'Add Estate'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estate Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter estate name"
              error={errors.name}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estate Code <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Enter estate code"
              error={errors.code}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Region <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.regionId}
              onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
              error={errors.regionId}
            >
              <option value="">Select region</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Enter city"
              error={errors.city}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="Enter state"
              error={errors.state}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pincode
            </label>
            <Input
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              placeholder="Enter pincode"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Enter address"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Person
            </label>
            <Input
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              placeholder="Enter contact person"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <Input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="Enter contact email"
              error={errors.contactEmail}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone
            </label>
            <Input
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              placeholder="Enter contact phone"
            />
          </div>
        </div>

        {estate && (
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
            {loading ? 'Saving...' : estate ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
