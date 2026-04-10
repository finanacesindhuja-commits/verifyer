import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Dashboard() {
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

  const staffStr = localStorage.getItem('staffInfo');
  const staff = staffStr ? JSON.parse(staffStr) : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Loan Applications</h1>
            <p className="text-gray-500 font-medium mt-1">Review and verify new loan submissions from the field.</p>
          </div>
          <div className="flex gap-4 items-center">
            <button 
              onClick={fetchLoans}
              className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all active:scale-90"
              title="Refresh List"
            >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <button 
              onClick={() => navigate('/query')}
              className="px-5 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition shadow-sm"
            >
              Query Portal
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('staffInfo');
                navigate('/login');
              }}
              className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100 transition"
            >
              Log Out
            </button>
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="p-4">App ID</th>
                  <th className="p-4">Applicant Name</th>
                  <th className="p-4">Aadhar No.</th>
                  <th className="p-4">Applied Date</th>
                  <th className="p-4">Center / Staff</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">Loading applications...</td>
                  </tr>
                ) : loans.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">No loan applications found.</td>
                  </tr>
                ) : (
                  loans.map(loan => (
                    <tr key={loan.id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md ring-1 ring-indigo-100">
                          {loan.member_no || loan.loan_app_id || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-gray-900">{loan.person_name || loan.member_name}</td>
                      <td className="p-4 text-gray-600">{loan.aadhar_no || 'N/A'}</td>
                      <td className="p-4 text-gray-600">{new Date(loan.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-gray-900">
                        <div className="font-bold text-[15px]">{loan.center_name || 'N/A'}</div>
                        <div className="text-xs text-gray-600 font-bold uppercase tracking-tight">{loan.staff_name || 'N/A'}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            loan.verification_status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-700' :
                            loan.verification_status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                          {loan.verification_status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => navigate(`/application/${loan.id}`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                        >
                          Review
                        </button>
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

export default Dashboard;
