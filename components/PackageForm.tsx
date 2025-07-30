import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, Loader2, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Bell } from 'lucide-react';

interface PackageFormProps {
  onPackageAdded: () => void;
}

export default function PackageForm({ onPackageAdded }: PackageFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    trackingNumber: '',
    carrier: '',
    description: '',
    telegramChatId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const carriers = [
    { 
      value: 'temu', 
      label: 'Temu', 
      logo: (
        <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
          T
        </div>
      )
    },
    { 
      value: 'shein', 
      label: 'SHEIN', 
      logo: (
        <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-xs">
          S
        </div>
      )
    },
    { 
      value: 'aliexpress', 
      label: 'AliExpress', 
      logo: (
        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-xs">
          A
        </div>
      )
    },
    { 
      value: 'dhl', 
      label: 'DHL', 
      logo: (
        <div className="w-6 h-6 rounded bg-yellow-500 flex items-center justify-center text-white font-bold text-[10px]">
          DHL
        </div>
      )
    },
    { 
      value: 'fedex', 
      label: 'FedEx', 
      logo: (
        <div className="w-6 h-6 rounded bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
          Ex
        </div>
      )
    },
    { 
      value: 'ups', 
      label: 'UPS', 
      logo: (
        <div className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold text-xs">
          U
        </div>
      )
    },
    { 
      value: 'usps', 
      label: 'USPS', 
      logo: (
        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
          US
        </div>
      )
    },
    { 
      value: 'amazon', 
      label: 'Amazon', 
      logo: (
        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
          A
        </div>
      )
    },
    { 
      value: 'china_post', 
      label: 'China Post', 
      logo: (
        <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xs">
          中
        </div>
      )
    },
    { 
      value: 'singapore_post', 
      label: 'Singapore Post', 
      logo: (
        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-xs">
          SG
        </div>
      )
    }
  ];

  const validateTrackingNumber = (trackingNumber: string, carrier: string): boolean => {
    const patterns = {
      temu: /^[A-Z0-9]{10,20}$/i,
      shein: /^[A-Z0-9]{10,25}$/i,
      aliexpress: /^[A-Z]{2}[0-9]{9}[A-Z]{2}$/i,
      dhl: /^[0-9]{10,11}$/,
      fedex: /^[0-9]{12,14}$/,
      ups: /^1Z[A-Z0-9]{16}$/i,
      usps: /^[0-9]{20,22}$/,
      amazon: /^TBA[0-9]{12}$/i,
      china_post: /^[A-Z]{2}[0-9]{9}[A-Z]{2}$/i,
      singapore_post: /^[A-Z]{2}[0-9]{9}[A-Z]{2}$/i
    };

    const pattern = patterns[carrier as keyof typeof patterns];
    return pattern ? pattern.test(trackingNumber) : trackingNumber.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!formData.trackingNumber.trim()) {
      setError('Tracking number is required');
      setIsLoading(false);
      return;
    }

    if (!formData.carrier) {
      setError('Please select a carrier');
      setIsLoading(false);
      return;
    }

    if (!validateTrackingNumber(formData.trackingNumber.trim(), formData.carrier)) {
      setError('Invalid tracking number format for selected carrier');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          trackingNumber: formData.trackingNumber.trim().toUpperCase(),
          description: formData.description.trim() || undefined,
          telegramChatId: formData.telegramChatId.trim() || undefined
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Package added successfully! 🎉');
        setFormData({
          trackingNumber: '',
          carrier: '',
          description: '',
          telegramChatId: ''
        });
        
        setTimeout(() => {
          onPackageAdded();
          setSuccess('');
        }, 1500);
      } else {
        setError(result.error || 'Failed to add package');
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error occurred. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleTrackingNumberChange = (value: string) => {
    const formatted = value.replace(/\s+/g, '').toUpperCase();
    handleInputChange('trackingNumber', formatted);
  };

  const getCarrierExample = (carrier: string): string => {
    const examples = {
      temu: 'e.g., TM123456789',
      shein: 'e.g., SH123456789ABC',
      aliexpress: 'e.g., LP123456789CN',
      dhl: 'e.g., 1234567890',
      fedex: 'e.g., 123456789012',
      ups: 'e.g., 1Z123ABC1234567890',
      usps: 'e.g., 12345678901234567890',
      amazon: 'e.g., TBA123456789012',
      china_post: 'e.g., RR123456789CN',
      singapore_post: 'e.g., RA123456789SG'
    };
    return examples[carrier as keyof typeof examples] || 'Enter tracking number';
  };

  const canProceedToStep2 = formData.trackingNumber.trim() && formData.carrier && 
    validateTrackingNumber(formData.trackingNumber.trim(), formData.carrier);

  const selectedCarrier = carriers.find(c => c.value === formData.carrier);

  const nextStep = () => {
    if (canProceedToStep2) {
      setCurrentStep(2);
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  return (
    <div className="w-full mx-auto max-h-[70vh] overflow-hidden">
      {/* Progress Bar */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold transition-all duration-300 ${
              currentStep >= 1 
                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="hidden sm:block">
              <p className={`text-sm font-medium ${currentStep >= 1 ? 'text-teal-600' : 'text-gray-500'}`}>
                Package Details
              </p>
            </div>
          </div>
          
          <div className={`flex-1 h-2 mx-2 sm:mx-4 rounded-full bg-gray-200 overflow-hidden`}>
            <div 
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-600 transition-all duration-500 ease-out"
              style={{ width: currentStep === 1 ? '50%' : '100%' }}
            />
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold transition-all duration-300 ${
              currentStep >= 2 
                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="hidden sm:block">
              <p className={`text-sm font-medium ${currentStep >= 2 ? 'text-teal-600' : 'text-gray-500'}`}>
                Optional Details
              </p>
            </div>
          </div>
        </div>
        
        {/* Mobile Step Indicator */}
        <div className="sm:hidden mt-3 text-center">
          <p className="text-sm font-medium text-gray-600">
            Step {currentStep} of 2: {currentStep === 1 ? 'Package Details' : 'Optional Details'}
          </p>
        </div>
      </div>

      {/* Form Content */}
      <div className="min-h-[400px] sm:min-h-[450px]">
        {currentStep === 1 && (
          <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-right-5 duration-300">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 mb-3 sm:mb-4 shadow-lg">
                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Package Information</h2>
              <p className="text-sm sm:text-base text-gray-600">Enter your tracking details to get started</p>
            </div>

            {/* Tracking Number Input */}
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="trackingNumber" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full"></span>
                Tracking Number
              </Label>
              <div className="relative">
                <Input
                  id="trackingNumber"
                  placeholder={formData.carrier ? getCarrierExample(formData.carrier) : "Enter your tracking number"}
                  value={formData.trackingNumber}
                  onChange={(e) => handleTrackingNumberChange(e.target.value)}
                  className="h-12 sm:h-14 text-base sm:text-lg font-mono pl-4 pr-12 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-0 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                  required
                />
                {formData.trackingNumber && formData.carrier && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    {validateTrackingNumber(formData.trackingNumber, formData.carrier) ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                    )}
                  </div>
                )}
              </div>
              {formData.trackingNumber && formData.carrier && (
                <div className="text-xs flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100">
                  {validateTrackingNumber(formData.trackingNumber, formData.carrier) ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-700">Valid format for {selectedCarrier?.label}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 text-orange-500" />
                      <span className="text-orange-700">Please check format for {selectedCarrier?.label}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Carrier Selection */}
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="carrier" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full"></span>
                Shipping Carrier
              </Label>
              <Select 
                value={formData.carrier} 
                onValueChange={(value) => handleInputChange('carrier', value)}
                required
              >
                <SelectTrigger className="h-12 sm:h-14 text-base sm:text-lg rounded-xl border-2 border-gray-200 focus:border-teal-500 bg-white/70 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    {selectedCarrier && selectedCarrier.logo}
                    <SelectValue placeholder="Choose your shipping carrier" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-60 rounded-xl border border-gray-200 bg-white/95 backdrop-blur-xl">
                  {carriers.map((carrier) => (
                    <SelectItem 
                      key={carrier.value} 
                      value={carrier.value} 
                      className="cursor-pointer h-12 rounded-lg hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 focus:bg-gradient-to-r focus:from-teal-50 focus:to-cyan-50 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-teal-50 data-[state=checked]:to-cyan-50"
                    >
                      <div className="flex items-center gap-3">
                        {carrier.logo}
                        <span className="font-medium">{carrier.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Next Button */}
            <div className="pt-4 sm:pt-6">
              <Button 
                onClick={nextStep}
                disabled={!canProceedToStep2}
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg" 
              >
                <span>Continue</span>
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-right-5 duration-300">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 mb-3 sm:mb-4 shadow-lg">
                <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Additional Details</h2>
              <p className="text-sm sm:text-base text-gray-600">Customize your tracking experience</p>
            </div>

            {/* Description Input */}
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full"></span>
                Package Description
                <span className="text-gray-400 font-normal text-xs">(Optional)</span>
              </Label>
              <div className="relative">
                <Input
                  id="description"
                  placeholder="What's in this package? e.g., Nike shoes, Phone case..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="h-12 sm:h-14 text-base sm:text-lg rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-0 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                  maxLength={100}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                  {formData.description.length}/100
                </div>
              </div>
            </div>

            {/* Telegram Chat ID Input */}
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="telegramChatId" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full"></span>
                Telegram Notifications
                <span className="text-gray-400 font-normal text-xs">(Optional)</span>
              </Label>
              <Input
                id="telegramChatId"
                placeholder="Chat ID or @username for instant updates"
                value={formData.telegramChatId}
                onChange={(e) => handleInputChange('telegramChatId', e.target.value)}
                className="h-12 sm:h-14 text-base sm:text-lg rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-0 transition-all duration-200 bg-white/70 backdrop-blur-sm"
              />
              <div className="text-xs text-gray-500 flex items-center gap-1 px-3">
                💡 Get your Chat ID from @userinfobot on Telegram
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="p-3 sm:p-4 rounded-xl bg-red-50 border border-red-200 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                  </div>
                  <p className="text-xs sm:text-sm text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="p-3 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-200 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500" />
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-800 font-medium">{success}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
              <Button 
                onClick={prevStep}
                variant="outline"
                className="order-2 sm:order-1 h-12 sm:h-14 text-base sm:text-lg font-semibold rounded-xl border-2 border-gray-300 hover:border-teal-500 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 transition-all duration-300"
              >
                <ArrowLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span>Back</span>  
              </Button>
              
              <Button 
                onClick={handleSubmit}
                className="order-1 sm:order-2 flex-1 h-12 sm:h-14 text-base sm:text-lg font-semibold rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span>Adding...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Add Package</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}