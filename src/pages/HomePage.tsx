import { motion } from 'motion/react';
import { ArrowRight, FileText, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="bg-blue-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
          >
            Register Your Business <br className="hidden md:block" />
            Fast and Secure Online
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-blue-100 text-lg md:text-xl mb-8 max-w-2xl mx-auto"
          >
            The official portal for DTI Business Name Registration and Local Business Permits. Apply, track, and manage your permits in one place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/apply" className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-bold py-3 px-8 rounded-full transition-colors flex items-center justify-center gap-2">
              Start Application <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="bg-blue-800 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full transition-colors flex items-center justify-center">
              Track Status
            </Link>
          </motion.div>
        </div>
      </section>

      {/* News & Announcements */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Latest Announcements</h2>
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Updated Today</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl hover:shadow-md transition-shadow">
              <div className="text-sm text-slate-500 mb-2">October 15, 2023</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">New Streamlined Process for Micro-Enterprises</h3>
              <p className="text-slate-600 mb-4">
                Starting next month, micro-enterprises can enjoy a faster 1-day processing time for business name registrations with fewer document requirements.
              </p>
              <a href="#" className="text-blue-600 font-medium hover:underline text-sm">Read more &rarr;</a>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl hover:shadow-md transition-shadow">
              <div className="text-sm text-slate-500 mb-2">October 10, 2023</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Scheduled System Maintenance</h3>
              <p className="text-slate-600 mb-4">
                The portal will undergo scheduled maintenance on October 20 from 12:00 AM to 4:00 AM. Please save your applications before this time.
              </p>
              <a href="#" className="text-blue-600 font-medium hover:underline text-sm">Read more &rarr;</a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-slate-200 z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white rounded-full shadow-sm border-4 border-slate-50 flex items-center justify-center mb-6 text-blue-600">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">1. Fill Form</h3>
              <p className="text-slate-600">Complete the online application form and upload required documents securely.</p>
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white rounded-full shadow-sm border-4 border-slate-50 flex items-center justify-center mb-6 text-yellow-500">
                <Clock size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">2. Pay & Wait</h3>
              <p className="text-slate-600">Pay fees securely via GCash or Card. Wait for our officers to review your application.</p>
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white rounded-full shadow-sm border-4 border-slate-50 flex items-center justify-center mb-6 text-emerald-500">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">3. Get Permit</h3>
              <p className="text-slate-600">Once approved, download your official DTI certificate and business permit instantly.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
