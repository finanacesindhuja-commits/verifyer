import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Dashboard() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCenter, setExpandedCenter] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
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

  const groupedLoans = loans.reduce((acc, loan) => {
    const center = loan.center_name || 'Unassigned Center';
    if (!acc[center]) {
      acc[center] = {
        name: center,
        staffName: loan.staff_name || 'N/A',
        loans: [],
        pendingCount: 0,
        totalCount: 0
      };
    }
    acc[center].loans.push(loan);
    acc[center].totalCount += 1;
    // Consider empty status, pending, or under review as new/pending
    const status = loan.status?.toLowerCase();
    if (!status || status === 'pending' || status === 'under review') {
      acc[center].pendingCount += 1;
    }
    return acc;
  }, {});

  const centers = Object.values(groupedLoans);

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

        {/* Centers View */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center p-8 text-gray-500 bg-white rounded-xl shadow-sm">Loading applications...</div>
          ) : centers.length === 0 ? (
            <div className="text-center p-8 text-gray-500 bg-white rounded-xl shadow-sm">No loan applications found.</div>
          ) : (
            centers.map((center, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all">
                {/* Center Card Header */}
                <div 
                  onClick={() => setExpandedCenter(expandedCenter === center.name ? null : center.name)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black text-xl">
                      {center.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900">{center.name}</h3>
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Staff: {center.staffName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {/* Indicator Badge */}
                    {center.pendingCount > 0 && (
                      <div className="flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                        </span>
                        <span className="text-rose-700 font-bold text-xs">
                          {center.pendingCount} New {center.pendingCount === 1 ? 'Member' : 'Members'} Added
                        </span>
                      </div>
                    )}
                    
                    <div className="text-sm font-semibold text-gray-400">
                      Total: {center.totalCount}
                    </div>

                    <div className={`transform transition-transform ${expandedCenter === center.name ? 'rotate-180' : ''}`}>
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                {/* Expanded Table */}
                {expandedCenter === center.name && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <th className="p-3">App ID</th>
                            <th className="p-3">Applicant Name</th>
                            <th className="p-3">Aadhar No.</th>
                            <th className="p-3">Applied Date</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {center.loans.map(loan => (
                            <tr key={loan.id} className="hover:bg-gray-50 transition">
                              <td className="p-3">
                                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md ring-1 ring-indigo-100">
                                  {loan.member_no || loan.loan_app_id || 'N/A'}
                                </span>
                              </td>
                              <td className="p-3 font-medium text-gray-900">{loan.person_name || loan.member_name}</td>
                              <td className="p-3 text-gray-600 text-sm">{loan.aadhar_no || 'N/A'}</td>
                              <td className="p-3 text-gray-600 text-sm">{new Date(loan.created_at).toLocaleDateString()}</td>
                              <td className="p-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    loan.status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-700' :
                                    loan.status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                  {loan.status || 'Pending'}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/application/${loan.id}`);
                                  }}
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition shadow-sm"
                                >
                                  Review
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
