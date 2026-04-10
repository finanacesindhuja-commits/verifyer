import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Query() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5006';
      const res = await axios.get(`${apiUrl}/api/loans`);
      setLoans(res.data);
    } catch (err) {
      console.error('Failed to fetch loans:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Query Interface</h1>
          <p className="text-gray-500 font-medium mt-1">Review and manage specific loan queries.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </header>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-indigo-50 border-b border-indigo-100 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  <th className="p-4">Applicant Name</th>
                  <th className="p-4">Center / Staff</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500 font-medium animate-pulse">Loading queries...</td>
                  </tr>
                ) : loans.filter(l => l.status?.toUpperCase() === 'QUERY').length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500 font-bold py-12">No active queries found.</td>
                  </tr>
                ) : (
                  loans.filter(l => l.status?.toUpperCase() === 'QUERY').map(loan => (
                    <tr key={loan.id} className="hover:bg-indigo-50/50 transition">
                      <td className="p-4">
                        <p className="font-black text-gray-900">{loan.person_name || loan.member_name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{loan.aadhar_no || 'N/A'}</p>
                      </td>
                      <td className="p-4 text-gray-600 text-sm font-medium">
                        {loan.center_name || 'N/A'}<br />
                        <span className="text-[10px] text-indigo-400 font-black uppercase tracking-tighter">{loan.staff_name || 'N/A'}</span>
                      </td>
                      <td className="p-4">
                        <div className="bg-amber-50 text-amber-600 border border-amber-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-center">
                            {loan.status || 'Query'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => navigate(`/application/${loan.id}`)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 active:scale-95 uppercase tracking-widest"
                          >
                            Resolve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Query;
