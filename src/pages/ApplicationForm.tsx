import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Upload, FileText, Building, User } from 'lucide-react';
import clsx from 'clsx';
import { QRCodeCanvas } from 'qrcode.react';

const STEPS = [
  { id: 1, title: 'Owner Info', icon: User },
  { id: 2, title: 'Business Info', icon: Building },
  { id: 3, title: 'Documents', icon: Upload },
  { id: 4, title: 'Review & Submit', icon: CheckCircle },
];

export default function ApplicationForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);

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
    if (!storedUser) {
      navigate('/login');
      return;
    }

    const u = JSON.parse(storedUser);
    setUser(u);
    setFormData(prev => ({ ...prev, ownerEmail: u.email }));
  }, [navigate]);

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: any) => {
    const { name, files } = e.target;
    if (files?.length) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  // Upload file via backend API
  const uploadFile = async (file: File) => {
    const form = new FormData();
    form.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: form,
    });

    if (!res.ok) throw new Error('Upload failed');

    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const fileUrls: Record<string, string> = {};

      if (formData.idDocument)
        fileUrls.idDocument = await uploadFile(formData.idDocument);

      if (formData.leaseDocument)
        fileUrls.leaseDocument = await uploadFile(formData.leaseDocument);

      if (formData.barangayClearance)
        fileUrls.barangayClearance = await uploadFile(formData.barangayClearance);

      // Save application
      const res = await fetch(`/api/applications?userId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: formData.ownerName,
          ownerPhone: formData.ownerPhone,
          businessName: formData.businessName,
          businessType: formData.businessType,
          address: formData.address,
          files: fileUrls,
        }),
      });

      if (!res.ok) throw new Error('Submission failed');

      const data = await res.json();
      const review = `${window.location.origin}/review/${data.id}?userId=${user.id}`;

      setApplicationId(data.id);
      setReviewUrl(review);
      setSubmitted(true);
      setStep(4);
    } catch (err) {
      console.error(err);
      alert('Error submitting application');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border p-6">

          <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {!submitted && step === 1 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Owner Information</h2>
                <input name="ownerName" placeholder="Full Name"
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="w-full p-3 border rounded mb-3" />

                <input name="ownerPhone" placeholder="Phone"
                  value={formData.ownerPhone}
                  onChange={handleChange}
                  className="w-full p-3 border rounded mb-3" />
              </div>
            )}

            {!submitted && step === 2 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Business Info</h2>
                <input name="businessName" placeholder="Business Name"
                  value={formData.businessName}
                  onChange={handleChange}
                  className="w-full p-3 border rounded mb-3" />
              </div>
            )}

            {!submitted && step === 3 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Upload Documents</h2>
                <input type="file" name="idDocument" onChange={handleFileChange} />
                <input type="file" name="leaseDocument" onChange={handleFileChange} />
                <input type="file" name="barangayClearance" onChange={handleFileChange} />
              </div>
            )}

            {submitted && reviewUrl && (
              <div className="text-center">
                <h2 className="text-xl font-bold text-emerald-600">
                  Application Submitted ✅
                </h2>

                <p className="mt-4">Scan QR to review your application</p>

                <div className="mt-4 inline-block p-4 bg-white rounded-xl shadow">
                  <QRCodeCanvas value={reviewUrl} size={200} />
                </div>

                <p className="mt-4 text-sm break-all">{reviewUrl}</p>
              </div>
            )}
          </motion.div>

          {!submitted && (
            <div className="flex justify-between mt-6">
              <button onClick={handlePrev} disabled={step === 1}>
                Back
              </button>

              {step < 4 ? (
                <button onClick={handleNext}>Next</button>
              ) : (
                <button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Processing...' : 'Submit'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}