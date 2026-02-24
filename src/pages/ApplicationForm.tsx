import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle, Upload, FileText, Building, User } from 'lucide-react';
import clsx from 'clsx';

const STEPS = [
  { id: 1, title: 'Owner Info', icon: User },
  { id: 2, title: 'Business Info', icon: Building },
  { id: 3, title: 'Documents', icon: Upload },
  { id: 4, title: 'Review & Pay', icon: CheckCircle },
];

export default function ApplicationForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    businessName: '',
    businessType: 'Sole Proprietorship',
    address: '',
    idDocument: null as File | null,
    leaseDocument: null as File | null,
    barangayClearance: null as File | null,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      setFormData(prev => ({ ...prev, ownerEmail: u.email }));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = async () => {
    if (!user) return alert('User not logged in');
    setLoading(true);

    try {
      // Send application to your serverless API with online DynamoDB
      const res = await fetch(`/api/applications?userId=${user.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: formData.ownerName,
          ownerPhone: formData.ownerPhone,
          businessName: formData.businessName,
          businessType: formData.businessType,
          address: formData.address,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit application');
      }

      alert('Application submitted successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error submitting application');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">New Application</h1>
          <p className="text-slate-500 mt-2">Complete the steps below to register your business.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 -z-10 transform -translate-y-1/2"></div>
          {STEPS.map(s => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            return (
              <div key={s.id} className="flex flex-col items-center">
                <div
                  className={clsx(
                    "w-12 h-12 rounded-full flex items-center justify-center border-4 border-slate-50 transition-colors",
                    isActive ? "bg-blue-600 text-white" : isCompleted ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                  )}
                >
                  <Icon size={20} />
                </div>
                <span className={clsx(
                  "text-xs font-semibold mt-2",
                  isActive || isCompleted ? "text-slate-800" : "text-slate-400"
                )}>{s.title}</span>
              </div>
            );
          })}
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 border-b pb-4">Owner Information</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Juan Dela Cruz" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input type="email" name="ownerEmail" value={formData.ownerEmail} readOnly className="w-full p-3 border border-slate-200 bg-slate-50 rounded-lg text-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <input type="tel" name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="+63 912 345 6789" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 border-b pb-4">Business Information</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Proposed Business Name</label>
                    <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. Juan's Bakery" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Business Type</label>
                    <select name="businessType" value={formData.businessType} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option>Sole Proprietorship</option>
                      <option>Partnership</option>
                      <option>Corporation</option>
                      <option>Cooperative</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Complete Business Address</label>
                    <textarea name="address" value={formData.address} onChange={handleChange} rows={3} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Street, Barangay, City, Province"></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 border-b pb-4">Required Documents</h2>
                <p className="text-sm text-slate-500 mb-4">Files will be securely uploaded to AWS S3. Max size 5MB per file.</p>
                {/* File Inputs omitted for brevity */}
              </div>
            )}

            {/* Step 4 */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 border-b pb-4">Review & Payment</h2>
                <div className="space-y-3">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    {loading ? 'Processing...' : 'Pay & Submit'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between">
            <button onClick={handlePrev} disabled={step === 1 || loading} className="px-6 py-2.5 text-slate-600 font-medium rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50">
              Back
            </button>
            {step < 4 && (
              <button onClick={handleNext} className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}