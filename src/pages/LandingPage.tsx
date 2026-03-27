import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, Calendar, CheckCircle, MapPin, Shield, Users, Star, TrendingUp, Award, ChevronRight, GraduationCap } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { BookingFormWidget } from '../components/landing/BookingFormWidget';
import { ROUTES } from '../constants/routes';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleSections((prev) => new Set(prev).add(entry.target.id));
            }
          });
        },
        { threshold: 0.1 }
      );

      document.querySelectorAll('[data-animate]').forEach((el) => {
        observer.observe(el);
      });

      return () => observer.disconnect();
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBooking = () => {
    document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white shadow-md' : 'bg-white/90 backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(ROUTES.LANDING)}>
              <div className="bg-gradient-to-br from-blue-600 to-teal-600 p-2 rounded-lg">
                <GraduationCap className="text-white" size={28} />
              </div>
              <span className="text-2xl font-bold text-gray-900">GovBook</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button className="text-gray-700 hover:text-blue-600 transition-colors font-medium relative group">
                Services
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button className="text-gray-700 hover:text-blue-600 transition-colors font-medium relative group">
                Destinations
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button className="text-gray-700 hover:text-blue-600 transition-colors font-medium relative group">
                FAQs
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button className="text-gray-700 hover:text-blue-600 transition-colors font-medium relative group">
                Contact Us
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate(ROUTES.LOGIN)}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                Login / Register
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-20 pb-32 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
        <div className="absolute inset-0">
          <svg className="absolute top-0 right-0 w-1/2 h-full opacity-10" viewBox="0 0 400 800">
            <path
              d="M 0,400 Q 200,200 400,400 T 400,800"
              fill="none"
              stroke="url(#gradient1)"
              strokeWidth="2"
            />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#14B8A6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slideInLeft">
              <div className="inline-block mb-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold animate-slideDown">
                Trusted by Government Departments
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                GOVERNMENT FACILITIES
                <span className="block mt-2 bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                  & BOOKING SYSTEM
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Book Government Guest Houses, Conference Halls, Conventions, & Parks seamlessly.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  onClick={scrollToBooking}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 transform hover:scale-105 transition-all shadow-lg"
                  icon={<Search size={20} />}
                >
                  Book Now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate(ROUTES.BOOKING_TRACKING)}
                  className="border-2 hover:bg-gray-50 transform hover:scale-105 transition-all"
                >
                  Track Booking
                </Button>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-1">500+</div>
                  <div className="text-sm text-gray-600">Facilities</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-teal-600 mb-1">50K+</div>
                  <div className="text-sm text-gray-600">Bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-1">200+</div>
                  <div className="text-sm text-gray-600">Cities</div>
                </div>
              </div>
            </div>

            <div className="relative animate-zoomIn" style={{ animationDelay: '0.2s' }}>
              <div className="absolute -top-6 -left-6 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
              <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '1s' }}></div>

              <div className="relative grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl group">
                    <img
                      src="/hero-conference-hall.webp"
                      alt="Conference Hall"
                      className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 text-white">
                        <div className="font-semibold">Conference Halls</div>
                      </div>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl group">
                    <img
                      src="/hero-convention-center.webp"
                      alt="Convention Center"
                      className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 text-white">
                        <div className="font-semibold">Convention Centers</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-8">
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl group">
                    <img
                      src="/hero-guest-house.webp"
                      alt="Guest House"
                      className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 text-white">
                        <div className="font-semibold">Guest Houses</div>
                      </div>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl group">
                    <img
                      src="/hero-park.webp"
                      alt="Parks & Recreation"
                      className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 text-white">
                        <div className="font-semibold">Parks & Recreation</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      <section id="booking-form" className="relative -mt-20 px-4 sm:px-6 lg:px-8 pb-20" data-animate>
        <div className="max-w-4xl mx-auto">
          <BookingFormWidget className={`${visibleSections.has('booking-form') ? 'animate-slideUpBig' : 'opacity-0'}`} />
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" data-animate id="features">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 ${visibleSections.has('features') ? 'animate-fadeIn' : 'opacity-0'}`}>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Explore Our Facilities</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose from a wide range of government facilities across the country
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Building2 size={48} />,
                title: 'Government Guest Houses',
                features: ['Government guest houses', 'Details find details'],
                gradient: 'from-blue-500 to-blue-600',
                delay: '0s',
              },
              {
                icon: <Users size={48} />,
                title: 'Conference Halls',
                features: ['Podiums halls', 'Meeting Room'],
                gradient: 'from-teal-500 to-teal-600',
                delay: '0.1s',
              },
              {
                icon: <Award size={48} />,
                title: 'Convention Centers',
                features: ['Exhibition hall', 'Exhibition and stage'],
                gradient: 'from-blue-600 to-teal-600',
                delay: '0.2s',
              },
              {
                icon: <MapPin size={48} />,
                title: 'Parks & Recreation',
                features: ['Trees & public ravation', 'Park & Recreation'],
                gradient: 'from-green-500 to-green-600',
                delay: '0.3s',
              },
            ].map((facility, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2 border border-gray-100 ${
                  visibleSections.has('features') ? 'animate-slideUp' : 'opacity-0'
                }`}
                style={{ animationDelay: facility.delay }}
              >
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${facility.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {facility.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{facility.title}</h3>
                <ul className="space-y-2 mb-6">
                  {facility.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-600">
                      <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate(ROUTES.SEARCH)}
                  className={`w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r ${facility.gradient} hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
                >
                  Check Availability
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50" data-animate id="how-it-works">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 ${visibleSections.has('how-it-works') ? 'animate-fadeIn' : 'opacity-0'}`}>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Simple, transparent booking process in 4 easy steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-teal-200 to-green-200"></div>

            {[
              {
                icon: <Search size={48} />,
                title: 'Search',
                description: 'Browse available facilities by location and dates',
                color: 'blue',
              },
              {
                icon: <Calendar size={48} />,
                title: 'Select',
                description: 'Choose your preferred facility type and dates',
                color: 'teal',
              },
              {
                icon: <CheckCircle size={48} />,
                title: 'Confirm',
                description: 'Complete booking and receive instant confirmation',
                color: 'green',
              },
              {
                icon: <Shield size={48} />,
                title: 'Check-In',
                description: 'Arrive and verify with your secure OTP code',
                color: 'blue',
              },
            ].map((step, index) => (
              <div
                key={index}
                className={`relative text-center group ${
                  visibleSections.has('how-it-works') ? 'animate-scaleIn' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className={`inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-${step.color}-100 to-${step.color}-200 rounded-2xl mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg relative z-10`}>
                  <div className={`text-${step.color}-600`}>{step.icon}</div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-gray-900 shadow-md">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" data-animate id="why-choose">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 ${visibleSections.has('why-choose') ? 'animate-fadeIn' : 'opacity-0'}`}>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Why Choose GovBook?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The most trusted platform for government facility bookings
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield size={40} />,
                title: 'Secure & Verified',
                description: 'Government-verified platform with secure payment processing and data protection',
                color: 'blue',
              },
              {
                icon: <TrendingUp size={40} />,
                title: 'Real-Time Availability',
                description: 'Instant availability updates and confirmations for all facilities',
                color: 'teal',
              },
              {
                icon: <Star size={40} />,
                title: 'Premium Support',
                description: '24/7 customer support to assist you throughout your booking journey',
                color: 'green',
              },
            ].map((benefit, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br from-gray-50 to-${benefit.color}-50 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 group ${
                  visibleSections.has('why-choose') ? 'animate-slideUp' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br from-${benefit.color}-500 to-${benefit.color}-600 text-white mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:rotate-3`}>
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-teal-600 to-blue-700 text-white relative overflow-hidden" data-animate id="cta">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className={`max-w-4xl mx-auto text-center relative z-10 ${visibleSections.has('cta') ? 'animate-zoomIn' : 'opacity-0'}`}>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-blue-100 leading-relaxed">
            Join thousands of satisfied users managing facility bookings efficiently and securely
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 transform hover:scale-105 transition-all shadow-xl"
              onClick={() => navigate(ROUTES.SEARCH)}
              icon={<Search size={20} />}
            >
              Start Booking Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 transform hover:scale-105 transition-all"
              onClick={() => navigate(ROUTES.LOGIN)}
              icon={<ChevronRight size={20} />}
            >
              Access Dashboard
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-gray-300 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-blue-600 to-teal-600 p-2 rounded-lg">
                  <GraduationCap className="text-white" size={24} />
                </div>
                <span className="text-2xl font-bold text-white">GovBook</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                Professional facilities management for government and public use. Trusted, secure, and efficient.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Shield size={16} className="text-green-400" />
                <span className="text-green-400 font-semibold">SSL Secure</span>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 text-lg">Quick Links</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <button
                    onClick={() => navigate(ROUTES.SEARCH)}
                    className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200"
                  >
                    Search Facilities
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate(ROUTES.BOOKING_TRACKING)}
                    className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200"
                  >
                    Track Booking
                  </button>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                    Facilities
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                    About Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 text-lg">Support</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                    FAQs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 text-lg">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                    Refund Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-400">
                GOVERNMENT OF [Country Name] - Dept. of Public Works
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
                  <Shield size={20} className="text-green-400" />
                  <span className="text-sm font-semibold text-gray-300">SSL SECURE</span>
                </div>
              </div>
            </div>
            <div className="mt-6 text-center text-sm text-gray-500">
              © 2026 Facilities Management System. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
