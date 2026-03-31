import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, MapPin, Calendar, Camera, Filter, CheckCircle, Clock } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { HorizontalSlider } from '../components/ui/HorizontalSlider';
import { usePropertyStore } from '../stores/propertyStore';
import { useAuthStore } from '../stores/authStore';
import { canManageProperties } from '../utils/permissions';
import { SkeletonCard } from '../components/ui/Loading';
import { ImageCarousel } from '../components/ui/ImageCarousel';
import { PropertyQuickViewModal } from '../components/property/PropertyQuickViewModal';
import { PropertyDTO } from '../types';
import { ROUTES } from '../constants/routes';
import { FadeIn } from '../components/animations/FadeIn';

export const PropertiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { properties, loading, fetchProperties } = usePropertyStore();
  const [selectedProperty, setSelectedProperty] = useState<PropertyDTO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchProperties();
  }, []);

  const canManage = user && canManageProperties(user.role);
  const canBook = user && ['govt_official', 'manager', 'dept_user', 'admin'].includes(user.role);

  const handleCardClick = (property: PropertyDTO) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

  const handleBookingClick = (e: React.MouseEvent, propertyId: string) => {
    e.stopPropagation();
    navigate(`/properties/${propertyId}`);
  };

  const filterItems = [
    { id: 'all', label: 'All Properties', icon: <Building2 size={14} />, color: 'blue' },
    { id: 'PUBLISHED', label: 'Published', icon: <CheckCircle size={14} />, color: 'green' },
    { id: 'DRAFT', label: 'Draft', icon: <Clock size={14} />, color: 'yellow' },
  ];

  const filteredProperties = filterStatus === 'all'
    ? properties
    : properties.filter(p => p.status === filterStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/20">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FadeIn delay={0}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl shadow-lg">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                Property Management
              </h1>
              <p className="text-gray-600">Manage all facilities and assets</p>
            </div>
            {canManage && (
              <Button onClick={() => navigate(ROUTES.PROPERTY_CREATE)} icon={<Plus size={20} />}>
                New Property
              </Button>
            )}
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-white/80 p-4 mb-6">
            <HorizontalSlider
              items={filterItems}
              selectedId={filterStatus}
              onSelect={setFilterStatus}
            />
          </div>
        </FadeIn>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <Building2 className="mx-auto text-gray-400 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties yet</h3>
                <p className="text-gray-600 mb-6">Create your first property to get started</p>
                {canManage && (
                  <Button onClick={() => navigate('/properties/create')}>Create Property</Button>
                )}
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProperties.map((property, index) => {
                const getGradientClass = () => {
                  if (property.status === 'PUBLISHED') return 'pastel-green-gradient';
                  if (property.status === 'DRAFT') return 'pastel-yellow-gradient';
                  return 'pastel-blue-gradient';
                };

                return (
                  <FadeIn key={property.id} delay={index * 60}>
                    <div
                      onClick={() => handleCardClick(property)}
                      className={`${getGradientClass()} rounded-xl overflow-hidden cursor-pointer`}
                    >
                      <div className="h-40 relative overflow-hidden">
                        {property.images.length > 0 ? (
                          <>
                            <ImageCarousel
                              images={property.images}
                              alt={property.name}
                              className="h-40"
                              autoPlay={true}
                              autoPlayInterval={3000}
                            />
                            {property.images.length > 1 && (
                              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                                <Camera className="w-3 h-3 text-white" />
                                <span className="text-white text-xs font-medium">{property.images.length}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className={`${getGradientClass()} flex items-center justify-center h-full`}>
                            <Building2 size={40} className="text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge variant={property.status === 'PUBLISHED' ? 'success' : 'warning'} className="text-xs">
                            {property.status}
                          </Badge>
                        </div>
                        {canBook && (
                          <button
                            onClick={(e) => handleBookingClick(e, property.id)}
                            className="absolute bottom-2 right-2 bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                            title="Book this property"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="p-4 bg-white">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {property.module && (
                            <Badge variant="default" className="text-xs">
                              {property.module.name}
                            </Badge>
                          )}
                          {property.propertyType && (
                            <Badge variant="success" className="text-xs">
                              {property.propertyType.name}
                            </Badge>
                          )}
                          {property.module?.code === 'OTHER_FAC' && (
                            <Badge variant="success" className="text-xs bg-green-100 text-green-800">
                              Instant Booking
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-2">{property.name}</h3>
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                          {property.description || 'No description available'}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-white/50 rounded-md p-2">
                          <MapPin size={14} className="text-gray-400" />
                          <span className="truncate">{property.estate?.city || property.address}</span>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>

            {selectedProperty && (
              <PropertyQuickViewModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                property={selectedProperty}
                canBook={canBook}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
