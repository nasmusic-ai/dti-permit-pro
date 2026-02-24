import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle, Upload, FileText, Building, User } from 'lucide-react';
import clsx from 'clsx';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode.react';

const STEPS = [
  { id: 1, title: 'Owner Info', icon: User },
  { id: 2, title: 'Business Info', icon: Building },
  { id: 3, title: 'Documents', icon: Upload },
  { id: 4, title: 'Review & Pay', icon: CheckCircle },
];

// AWS S3 setup
const s3Client = new S3Client({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID!,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY!,
  },
});

export default function ApplicationForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
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

  const uploadFile = async (file: File, folder: string) => {
    const key = `${folder}/${uuidv4()}-${file.name}`;
    const command = new PutObjectCommand({
      Bucket: import.meta.env.VITE_AWS_S3_BUCKET!,
      Key: key,
      Body: file,
      ACL: 'public-read',
    });
    await s3Client.send(command);
    return `https://${import.meta.env.VITE_AWS_S3_BUCKET}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${key}`;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Upload each file to S3
      const urls: Record<string, string> = {};
      if (formData.idDocument) urls.idDocument = await uploadFile(formData.idDocument, user.id);
      if (formData.leaseDocument) urls.leaseDocument = await uploadFile(formData.leaseDocument, user.id);
      if (formData.barangayClearance) urls.barangayClearance = await uploadFile(formData.barangayClearance, user.id);
      setFileUrls(urls);

      // Submit to backend DynamoDB
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ownerName: formData.ownerName,
          ownerPhone: formData.ownerPhone,
          businessName: formData.businessName,
          businessType: formData.businessType,
          address: formData.address,
          files: urls,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit application');
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">New Application</h1>
          <p className="text-slate-500 mt-2">Complete the steps below to register your business.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 -z-10 transform -translate-y-1/2"></div>
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isCompleted = step > s.id || submitted;
            return (
              <div key={s.id} className="flex flex-col items-center">
                <div 
                  className={clsx(
                    "w-12 h-12 rounded-full flex items-center justify-center border-4 border-slate-50 transition-colors",
                    isActive ? "bg-blue-600 text-white" : 
                    isCompleted ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                  )}
                >
                  <Icon size={20} />
                </div>
                <span className={clsx(
                  "text-xs font-semibold mt-2",
                  isActive || isCompleted ? "text-slate-800" : "text-slate-400"
                )}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form / Review */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {!submitted && step === 1 && (
              <div className="space-y-6">
                {/* Owner Info */}
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

            {!submitted && step === 2 && (
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

            {!submitted && step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 border-b pb-4">Required Documents</h2>
                <p className="text-sm text-slate-500 mb-4">Files will be securely uploaded to AWS S3. Max size 5MB per file.</p>
                {['idDocument', 'leaseDocument', 'barangayClearance'].map(fileName => (
                  <div key={fileName} className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
                    <FileText className="mx-auto text-slate-400 mb-2" size={32} />
                    <label className="block text-sm font-medium text-slate-700 mb-1">{fileName}</label>
                    <input type="file" name={fileName} onChange={handleFileChange} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                ))}
              </div>
            )}

            {submitted && (
              <div className="space-y-6 text-center">
                <h2 className="text-xl font-bold text-emerald-600 border-b pb-4">Application Submitted!</h2>
                <p className="text-slate-700">Here are your uploaded files:</p>
                <ul className="space-y-2 text-left">
                  {Object.entries(fileUrls).map(([key, url]) => (
                    <li key={key}>
                      <a href={url} target="_blank" className="text-blue-600 hover:underline">{key}</a>
                    </li>
                  ))}
                </ul>

                <p className="mt-6 text-slate-700 font-medium">Scan this QR code to access your files:</p>
                <div className="mt-4 inline-block p-4 bg-white rounded-xl shadow-lg">
                  <QRCode value={JSON.stringify(fileUrls)} size={180} />
                </div>
              </div>
            )}
          </motion.div>

          {/* Navigation Buttons */}
          {!submitted && (
            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between">
              <button
                onClick={handlePrev}
                disabled={step === 1 || loading}
                className="px-6 py-2.5 text-slate-600 font-medium rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              
              {step < 4 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  {loading ? 'Processing...' : 'Pay & Submit'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}