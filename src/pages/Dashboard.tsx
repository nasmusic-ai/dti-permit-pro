import React, { useEffect, useState } from 'react';

export default function Dashboard() {
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return (window.location.href = '/login');

    const parsed = JSON.parse(storedUser);
    setUser(parsed);

    async function fetchApplications() {
      setLoading(true);
      try {
        const res = await fetch(`/api/applications?userId=${parsed.email}`);
        if (!res.ok) throw new Error('Failed to fetch applications');
        const data = await res.json();
        setApplications(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchApplications();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      {user && <p>Welcome, {user.email} ({user.role})</p>}
      {loading && <p>Loading applications...</p>}
      {!loading && applications.length === 0 && <p>No applications yet.</p>}
      <ul className="mt-4 space-y-2">
        {applications.map((app: any) => (
          <li key={app.id.S} className="border p-2 rounded">
            <pre>{JSON.stringify(JSON.parse(app.data.S), null, 2)}</pre>
            <p className="text-xs text-gray-500">Created at: {app.createdAt.S}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}