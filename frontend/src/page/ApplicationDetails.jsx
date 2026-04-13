import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [remarks, setRemarks] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetchLoanDetails();
  }, [id]);

  const fetchLoanDetails = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/loans/${id}`);
      const found = res.data;
      setLoan(found);
      if (found?.verification_remarks) setRemarks(found.verification_remarks);
    } catch (err) {
      console.error('Failed to fetch loan details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (status) => {
    if (!remarks.trim()) return alert('Please enter remarks.');
    setSubmitting(true);
    try {
      await axios.post(`${apiUrl}/api/loans/${id}/verify`, {
        status,
        remarks,
        staffId: user.staff_id
      });
      alert(`Application ${status} successfully!`);
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to update verification status.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };


  const handleQueryField = async (field, label) => {
    setSubmitting(true);
    try {
      // Append the new query tag if it's not already there
      const currentRemarks = remarks || '';
      const structuredRemarks = currentRemarks.includes(`[QUERY:${field}]`) 
        ? currentRemarks 
        : `[QUERY:${field}] ${currentRemarks}`.trim();

      await axios.post(`${apiUrl}/api/loans/${id}/verify`, {
        status: 'Query',
        remarks: structuredRemarks,
        staffId: user.staff_id
      });
      
      // Update local state so the verifier sees what they sent
      setRemarks(structuredRemarks);
      // We also update the loan object to trigger any UI updates like status badges
      setLoan(prev => ({...prev, status: 'Query', verification_remarks: structuredRemarks}));
      
    } catch (err) {
      console.error('Failed to send query:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 font-medium animate-pulse">Fetching complete details...</div>;
  if (!loan) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500 font-medium gap-4">
    <p>Application not found.</p>
    <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline">Back to Dashboard</button>
  </div>;

  const DetailItem = ({ label, value }) => (
    <div className="border-b border-gray-50 pb-3">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-[15px] font-black text-gray-900">{value || 'N/A'}</p>
    </div>
  );

  const SectionHeader = ({ title }) => (
    <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-6 flex items-center gap-2">
      <span className="w-8 h-[2px] bg-indigo-100"></span>
      {title}
    </h3>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none mb-1">Application Review</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-indigo-600 font-black tracking-widest uppercase">App ID: {loan.member_no || loan.loan_app_id}</p>
                <span className="text-gray-300">|</span>
                <p className="text-[10px] text-gray-400 font-mono">DB-ID: #{loan.id}</p>
              </div>
            </div>
          </div>
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
            loan.status?.toLowerCase() === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
            loan.status?.toLowerCase() === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
            'bg-amber-50 text-amber-600 border-amber-100'
          }`}>
            {loan.status || 'Pending'}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Info Columns */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. Applicant Master Info */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-start gap-8 mb-10 pb-8 border-b border-gray-50">
                {loan.member_photo_url ? (
                  <img src={loan.member_photo_url} alt="Applicant" className="w-32 h-32 rounded-3xl object-cover ring-8 ring-indigo-50 shadow-lg" />
                ) : (
                  <div className="w-32 h-32 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300 font-bold border-2 border-dashed border-gray-200">NO PHOTO</div>
                )}
                <div className="pt-2">
                  <h2 className="text-3xl font-black text-gray-900 mb-2">{loan.person_name || loan.member_name}</h2>
                  <div className="flex flex-wrap gap-3">
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-black ring-1 ring-indigo-100">APP ID: {loan.member_no || loan.loan_app_id}</span>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold">MEMBER ID: {loan.member_id}</span>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold">CENTER: {loan.center_name} (#{loan.center_id})</span>
                  </div>
                </div>
              </div>

              <SectionHeader title="Personal Demographics" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                <DetailItem label="Full Name" value={loan.person_name || loan.member_name} />
                <DetailItem label="Date of Birth" value={loan.date_of_birth} />
                <DetailItem label="Gender" value={loan.gender} />
                <DetailItem label="Religion" value={loan.religion} />
                <DetailItem label="Marital Status" value={loan.marital_status} />
                <DetailItem label="Aadhar Number" value={loan.aadhar_no} />
                <DetailItem label="Occupation" value={loan.member_work} />
                <DetailItem label="Annual Income" value={loan.annual_income ? `₹${loan.annual_income}` : null} />
                <DetailItem label="Address" value={loan.address} />
                <DetailItem label="Pincode" value={loan.pincode} />
                <DetailItem label="Phone Number" value={loan.mobile_no} />
                <DetailItem label="Email Address" value={loan.member_email} />
                <DetailItem label="First Cycle RG Number" value={loan.firstCycleRgNumber || loan.first_cycle_rg_number} />
              </div>
            </div>

            {/* 2. Nominee Details */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <SectionHeader title="Nominee Information" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                <DetailItem label="Nominee Name" value={loan.nominee_name} />
                <DetailItem label="Nominee DOB" value={loan.nominee_dob} />
                <DetailItem label="Gender" value={loan.nominee_gender} />
                <DetailItem label="Relationship" value={loan.nominee_relationship} />
                <DetailItem label="Nominee Phone" value={loan.nominee_mobile} />
                <DetailItem label="Religion" value={loan.nominee_religion} />
                <DetailItem label="Marital Status" value={loan.nominee_marital_status} />
                <DetailItem label="Business/Work" value={loan.nominee_business} />
              </div>
            </div>

            {/* 3. Field Collection / Staff Info */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <SectionHeader title="Source & Staff Info" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                <DetailItem label="Staff Name" value={loan.staff_name} />
                <DetailItem label="Staff ID" value={loan.staff_id} />
                <DetailItem label="Center Name" value={loan.center_name} />
                <DetailItem label="Created Date" value={new Date(loan.created_at).toLocaleString()} />
              </div>
            </div>

            {/* 4. Verification Documents */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 pb-12">
              <SectionHeader title="Document Repository" />
              

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[
                  { label: 'Member Aadhar Front', url: loan.member_aadhaar_front_url, field: 'member_aadhaar_front_url' },
                  { label: 'Member Aadhar Back', url: loan.member_aadhaar_back_url, field: 'member_aadhaar_back_url' },
                  { label: 'Nominee Aadhar Front', url: loan.nominee_aadhaar_front_url, field: 'nominee_aadhaar_front_url' },
                  { label: 'Nominee Aadhar Back', url: loan.nominee_aadhaar_back_url, field: 'nominee_aadhaar_back_url' },
                  { label: 'PAN Card', url: loan.pan_card_url, field: 'pan_card_url' },
                  { label: 'Bank Passbook', url: loan.passbook_image_url, field: 'passbook_image_url' },
                  { label: 'Field Verification Form', url: loan.form_image_url, field: 'form_image_url' },
                  { label: 'Applicant Signature', url: loan.signature_url, field: 'signature_url' }
                ].map((doc, i) => {
                  const isReceived = doc.url?.includes('replacements/');
                  return doc.url && (
                    <div key={i} className={`group flex flex-col p-4 rounded-[2rem] border-2 transition-all ${isReceived ? 'bg-emerald-50/30 border-emerald-200' : 'border-transparent'}`}>
                      <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{doc.label}</span>
                          {isReceived && (
                            <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-sm">RECEIVED</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleQueryField(doc.field, doc.label)}
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-700"
                          >
                            QUERY
                          </button>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 underline">VIEW FULL</a>
                        </div>
                      </div>
                      <div className={`relative aspect-[4/3] bg-gray-50 rounded-2xl overflow-hidden border transition-all shadow-inner ${isReceived ? 'border-emerald-300' : 'border-gray-100 group-hover:border-indigo-300'}`}>
                        <img src={doc.url} alt={doc.label} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                        {isReceived && (
                           <div className="absolute top-2 right-2 bg-emerald-500/90 text-white p-1 rounded-lg">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                           </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>


          {/* Right Sidebar: Verification Panel */}
          <div className="lg:col-span-4 space-y-6 sticky top-28">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
                Verification Action
              </h3>

              {loan.status && loan.status.toLowerCase() !== 'pending' && (
                <div className={`mb-6 p-4 rounded-2xl border ${
                  loan.status.toLowerCase() === 'approved' ? 'bg-emerald-50 border-emerald-100' :
                  loan.status.toLowerCase() === 'rejected' ? 'bg-rose-50 border-rose-100' :
                  'bg-amber-50 border-amber-100'
                }`}>
                  <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">Current Status</p>
                  <p className={`text-sm font-black uppercase ${
                    loan.status.toLowerCase() === 'approved' ? 'text-emerald-700' :
                    loan.status.toLowerCase() === 'rejected' ? 'text-rose-700' :
                    'text-amber-700'
                  }`}>{loan.status}</p>
                  {loan.verification_remarks && (
                    <p className="mt-2 text-xs text-gray-600 font-medium italic">"{loan.verification_remarks}"</p>
                  )}
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Verification Remarks</label>
                  <textarea 
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter detailed reason for approval or rejection..."
                    className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all min-h-[160px] resize-none font-medium"
                    disabled={submitting}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 pt-4">
                  <button 
                    onClick={() => handleVerify('Approved')}
                    disabled={submitting}
                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 active:scale-[0.98] tracking-widest uppercase text-xs"
                  >
                    {submitting ? 'PROCESSING...' : 'APPROVE APPLICATION'}
                  </button>
                  <button 
                    onClick={() => handleVerify('Query')}
                    disabled={submitting}
                    className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black transition-all shadow-lg shadow-amber-200 disabled:opacity-50 active:scale-[0.98] tracking-widest uppercase text-xs"
                  >
                    QUERY / REQUEST REPLACEMENT
                  </button>
                  <button 
                    onClick={() => handleVerify('Rejected')}
                    disabled={submitting}
                    className="w-full py-4 bg-white border-2 border-rose-100 hover:border-rose-200 text-rose-600 rounded-2xl font-black transition-all disabled:opacity-50 active:scale-[0.98] tracking-widest uppercase text-[10px]"
                  >
                    REJECT APPLICATION
                  </button>
                </div>
              </div>

              {loan.verifier_id && (
                <div className="mt-10 pt-8 border-t border-gray-50">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Verification Audit</p>
                  <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs">V</div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">{loan.verifier_id}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{new Date(loan.verified_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* System Context */}
            <div className="bg-indigo-900 rounded-3xl p-8 text-white shadow-lg overflow-hidden relative group">
              <div className="relative z-10">
                <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-2">Secure Portal</p>
                <h4 className="text-lg font-bold mb-4">Authentication Token Active</h4>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-xs text-indigo-100 font-medium italic">Logged in as {user.staff_id}</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-800 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplicationDetails;
