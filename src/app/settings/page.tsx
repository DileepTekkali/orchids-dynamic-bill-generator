"use client";

import { useState, useEffect } from 'react';
import { useBusiness } from '@/hooks/useBillData';
import { ImageUpload } from '@/components/ImageUpload';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Building2, MapPin, FileText, Stamp, RefreshCw, Trash2, User, Phone } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { BusinessDetails } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { generateStamp } from '@/lib/stampGenerator';

export default function SettingsPage() {
  const { business, updateBusiness, isLoaded } = useBusiness();
  const [formData, setFormData] = useState<BusinessDetails>(business);
  const [isSaving, setIsSaving] = useState(false);
  const [stampPreview, setStampPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) {
      setFormData(business);
      if (business.generatedStampImage) {
        setStampPreview(business.generatedStampImage);
      }
    }
  }, [isLoaded, business]);

  useEffect(() => {
    if (formData.useAutoStamp && formData.generatedStampImage) {
      setStampPreview(formData.generatedStampImage);
    } else if (!formData.useAutoStamp) {
      setStampPreview(null);
    }
  }, [formData.useAutoStamp, formData.generatedStampImage]);

  const handleGenerateStamp = () => {
    const nameForStamp = formData.stampBusinessName?.trim() || formData.shopName;
    const locationForStamp = formData.stampLocation?.trim() || 'CITY';
    
    if (!nameForStamp) {
      toast.error('Please enter a business name for the stamp');
      return;
    }
    if (!locationForStamp) {
      toast.error('Please enter a location for the stamp');
      return;
    }
    
    const newStamp = generateStamp(nameForStamp, locationForStamp);
    setStampPreview(newStamp);
    setFormData(prev => ({ ...prev, generatedStampImage: newStamp }));
    toast.success('Stamp generated! Click "Save Stamp" to apply it to your bills.');
  };

  const handleSaveStamp = () => {
    if (!stampPreview) {
      toast.error('Please generate a stamp first');
      return;
    }
    updateBusiness({ ...formData, generatedStampImage: stampPreview, useAutoStamp: true });
    toast.success('Stamp saved and will appear on your bills!');
  };

  const handleDeleteStamp = () => {
    setStampPreview(null);
    const updated = { 
      ...formData, 
      generatedStampImage: undefined,
      stampBusinessName: '',
      stampLocation: ''
    };
    setFormData(updated);
    updateBusiness(updated);
    toast.success('Stamp deleted');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSave = async () => {
    if (!formData.shopName.trim()) {
      toast.error('Shop name is required');
      return;
    }
    if (!(formData.holderName || '').trim()) {
      toast.error('Business holder name is required');
      return;
    }
    if (!(formData.mobile || '').trim()) {
      toast.error('Mobile number is required');
      return;
    }
    if (!formData.shopAddress.trim()) {
      toast.error('Shop address is required');
      return;
    }
    
    setIsSaving(true);
    try {
      updateBusiness(formData);
      toast.success('Business details saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save. Images may be too large.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-amber-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Business Settings</h1>
            <p className="text-slate-500 text-sm mt-1">Configure your shop details</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-600 font-semibold">
                <Building2 className="w-5 h-5" />
                <span>Basic Information</span>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <span>Shop Name</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.shopName}
                    onChange={(e) => setFormData(prev => ({ ...prev, shopName: e.target.value }))}
                    placeholder="Enter your shop name"
                    className="h-12 rounded-xl border-slate-200 focus:border-amber-400 focus:ring-amber-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Business Holder Name</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.holderName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, holderName: e.target.value }))}
                      placeholder="Enter owner name"
                      className="h-12 rounded-xl border-slate-200 focus:border-amber-400 focus:ring-amber-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>Mobile Number</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.mobile || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                      placeholder="Enter mobile number"
                      className="h-12 rounded-xl border-slate-200 focus:border-amber-400 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>Shop Address</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-400 mb-1">Format: Shop No, Landmark, Town/City/Village, Pincode, District, State</p>
                  <textarea
                    value={formData.shopAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, shopAddress: e.target.value }))}
                    placeholder="Shop No. 12, Near Bus Stand
Tiruppur
641601
Tiruppur District
Tamil Nadu"
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none resize-none text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>GST Number</span>
                    <span className="text-slate-400 text-xs">(Optional - shown only when GST is enabled in bill)</span>
                  </label>
                  <Input
                    value={formData.gstNumber || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, gstNumber: e.target.value }))}
                    placeholder="e.g., 22AAAAA0000A1Z5"
                    className="h-12 rounded-xl border-slate-200 focus:border-amber-400 focus:ring-amber-400"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <div className="flex items-center gap-2 text-amber-600 font-semibold mb-4">
                <Stamp className="w-5 h-5" />
                <span>Branding & Signatures</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ImageUpload
                  value={formData.logo}
                  onChange={(val) => setFormData(prev => ({ ...prev, logo: val }))}
                  label="Business Logo"
                />
                {!formData.useAutoStamp && (
                  <ImageUpload
                    value={formData.stampImage}
                    onChange={(val) => setFormData(prev => ({ ...prev, stampImage: val }))}
                    label="Stamp Image"
                  />
                )}
              </div>

              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Auto-generate Stamp</p>
                    <p className="text-xs text-slate-500">Create a professional stamp automatically</p>
                  </div>
                  <Switch 
                    checked={formData.useAutoStamp} 
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, useAutoStamp: checked }))} 
                  />
                </div>
                
                {formData.useAutoStamp && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">Business Name on Stamp</label>
                        <Input
                          value={formData.stampBusinessName || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, stampBusinessName: e.target.value }))}
                          placeholder={formData.shopName || "Enter business name"}
                          className="h-10 rounded-lg border-slate-200 focus:border-amber-400 focus:ring-amber-400 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">Location (City/Town/Village)</label>
                        <Input
                          value={formData.stampLocation || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, stampLocation: e.target.value }))}
                          placeholder="e.g., Tiruppur"
                          className="h-10 rounded-lg border-slate-200 focus:border-amber-400 focus:ring-amber-400 text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleGenerateStamp}
                        variant="outline"
                        className="flex-1 h-9 border-amber-300 text-amber-700 hover:bg-amber-50 text-sm rounded-lg"
                      >
                        <RefreshCw className="w-4 h-4 mr-1.5" />
                        {stampPreview ? 'Regenerate' : 'Generate Stamp'}
                      </Button>
                      {stampPreview && (
                        <>
                          <Button
                            type="button"
                            onClick={handleSaveStamp}
                            className="flex-1 h-9 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg"
                          >
                            <Save className="w-4 h-4 mr-1.5" />
                            Save Stamp
                          </Button>
                          <Button
                            type="button"
                            onClick={handleDeleteStamp}
                            variant="outline"
                            className="h-9 px-3 border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {stampPreview && (
                      <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-slate-200">
                        <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Preview</p>
                        <img src={stampPreview} alt="Generated Stamp" className="w-32 h-32 object-contain" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <ImageUpload
                  value={formData.signatureImage}
                  onChange={(val) => setFormData(prev => ({ ...prev, signatureImage: val }))}
                  label="Signature Image"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-100">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Business Details
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
