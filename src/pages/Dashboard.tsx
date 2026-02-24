import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, XCircle, Download } from 'lucide-react';
import clsx from 'clsx';

export default function Dashboard() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      fetchApplications(u.id);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchApplications = async (userId: number) => {
    try {
      const res = await fetch(`/api/applications?userId=${userId}`);
      const data = await res.json();
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle size={16} className="mr-1.5" />;
      case 'Rejected': return <XCircle size={16} className="mr-1.5" />;
      default: return <Clock size={16} className="mr-1.5" />;
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">My Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage your business applications</p>
          </div>
          <Link 
            to="/apply" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors shadow-sm"
          >
            + New Application
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No applications yet</h3>
            <p className="text-slate-500 mb-6">You haven't submitted any business permit applications.</p>
            <Link to="/apply" className="text-blue-600 font-medium hover:underline">Start your first application &rarr;</Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-800">{app.businessName}</h3>
                      <span className={clsx("px-2.5 py-1 rounded-full text-xs font-bold border flex items-center", getStatusColor(app.status))}>
                        {getStatusIcon(app.status)}
                        {app.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500 flex flex-col sm:flex-row sm:gap-4">
                      <span><strong>Type:</strong> {app.businessType}</span>
                      <span className="hidden sm:inline">&bull;</span>
                      <span><strong>Submitted:</strong> {new Date(app.createdAt).toLocaleDateString()}</span>
                      <span className="hidden sm:inline">&bull;</span>
                      <span><strong>Ref:</strong> APP-{app.id.toString().padStart(6, '0')}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {app.status === 'Approved' && (
                      <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-medium text-sm transition-colors border border-emerald-200">
                        <Download size={16} />
                        Download Permit
                      </button>
                    )}
                    <button className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors border border-slate-200">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
