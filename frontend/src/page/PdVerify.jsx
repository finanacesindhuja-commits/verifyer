import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

// Inline SVG Icons for better reliability
const Icons = {
  ChevronDown: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  ChevronRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  User: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  MapPin: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 4.993-5.538 10.161-7.327 11.712a1 1 0 0 1-1.346 0C9.538 20.161 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  Loader2: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
  Image: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>,
  CheckCircle2: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"/><path d="m9 12 2 2 4-4"/></svg>,
  XCircle: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  Maximize: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>,
  Video: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.934a.5.5 0 0 0-.777-.416L16 11"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
};

function PdVerify() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reasons, setReasons] = useState({});
  const [expandedCenters, setExpandedCenters] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [actioning, setActioning] = useState(null);
  
  const [hostLink, setHostLink] = useState(() => localStorage.getItem('pd_verifier_host_link') || 'https://us05web.zoom.us/j/81590508765?pwd=8POi2joWuuMPyBkY4dMI4qLiRFtQ9f.1');
  const [showHostInput, setShowHostInput] = useState(false);

  const debounceTimer = useRef(null);

  const updateHostLink = useCallback(async (val) => {
    setHostLink(val);
    localStorage.setItem('pd_verifier_host_link', val);
    
    // Debounce: wait 800ms after typing stops, then sync
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      if (!val.trim()) return;
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        await axios.post(`${apiUrl}/api/update-verifier-link`, { link: val.trim() });
        console.log('✅ Host link synced to PD App:', val.trim());
      } catch (err) {
        console.error('Failed to sync host link');
      }
    }, 800);
  }, []);

  const fetchList = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await axios.get(`${apiUrl}/api/verification-list`);
      
      // Filter out Approved, Rejected, and system config rows
      setList(res.data.filter(s => 
        s.status !== 'Approved' && 
        !String(s.status).startsWith('Approved') &&
        !String(s.status).startsWith('Rejected') &&
        s.centerId !== '__config__'
      ));
    } catch (err) {
      console.error('Failed to fetch PD verification list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // Auto-sync host link to backend on page load
    if (hostLink) {
      updateHostLink(hostLink);
    }
  }, []);

  const handleAction = async (submissionId, action) => {
    setActioning(submissionId);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      await axios.post(`${apiUrl}/api/approve-verification`, {
        submissionId,
        type: 'pd',
        action,
        reason: reasons[submissionId] || ''
      });
      await fetchList();
      setReasons(prev => {
        const next = { ...prev };
        delete next[submissionId];
        return next;
      });
    } catch (err) {
      console.error(`Error actioning PD:`, err);
      alert('Action failed. Please try again.');
    } finally {
      setActioning(null);
    }
  };

  const toggleCenter = (centerName) => {
    setExpandedCenters(prev => ({
      ...prev,
      [centerName]: !prev[centerName]
    }));
  };

  // Group the list by center
  const groupedList = list.reduce((acc, item) => {
    const centerName = item.centerName || `Center ${item.centerId}`;
    if (!acc[centerName]) {
      acc[centerName] = [];
    }
    acc[centerName].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 ring-4 ring-indigo-50">
              <div className="w-8 h-8 text-white"><Icons.CheckCircle2 /></div>
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">PD Verifier</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] opacity-70">Secured Document Authentication</p>
            </div>
          </div>
          
          <div className="md:ml-16 mt-4 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-slate-500 font-medium text-center md:text-left">Select a center below to review pending member verifications.</p>
            
            {/* CENTRAL HOSTING CONTROLS */}
            <div className="bg-white border-2 border-indigo-100 p-2.5 rounded-2xl flex items-center gap-3 shadow-xl shadow-indigo-100/50 group/zoom">
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Central Host Status</span>
                {showHostInput ? (
                  <input 
                    autoFocus
                    className="bg-slate-50 border border-indigo-200 text-[11px] px-3 py-1.5 rounded-xl text-slate-900 outline-none w-48 shadow-inner font-bold"
                    value={hostLink}
                    onChange={(e) => updateHostLink(e.target.value)}
                    onBlur={() => setShowHostInput(false)}
                    onKeyDown={(e) => { if(e.key === 'Enter') setShowHostInput(false); }}
                    placeholder="Paste Zoom Host Link..."
                  />
                ) : (
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); setShowHostInput(true); }}
                    className="text-[11px] font-black text-slate-900 hover:text-indigo-600 transition-colors flex items-center space-x-2"
                  >
                    <span>{hostLink ? (hostLink.length > 25 ? hostLink.substring(0, 25) + '...' : hostLink) : 'OFFLINE - SET LINK'}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${hostLink ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                  </button>
                )}
              </div>
              <button 
                type="button"
                onClick={(e) => { 
                  e.preventDefault(); 
                  if(hostLink) {
                    let url = hostLink.trim();
                    if (/^\d+$/.test(url)) {
                      url = `https://zoom.us/j/${url}`;
                    } else if (url.includes('.')) {
                      if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
                    } else {
                      alert("Please paste a valid Zoom URL or 10-digit Meeting ID.");
                      return;
                    }
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }
                }}
                disabled={!hostLink}
                className={`p-3 rounded-xl transition-all duration-300 flex items-center justify-center ${hostLink ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-slate-900' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                title="Start Central Host Meeting"
              >
                <div className="w-5 h-5"><Icons.Video /></div>
              </button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="w-12 h-12 text-indigo-600 animate-spin"><Icons.Loader2 /></div>
            <span className="text-slate-500 font-bold tracking-widest uppercase text-xs">Accessing Database...</span>
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-20 text-center">
            <div className="inline-flex p-6 bg-slate-50 rounded-full mb-6 text-slate-300">
              <div className="w-12 h-12"><Icons.CheckCircle2 /></div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Perfect Score!</h3>
            <p className="text-slate-400 font-medium">No pending PD verifications require your attention right now.</p>
          </div>
        ) : (
          <div className="space-y-4 lg:space-y-6">
            {Object.keys(groupedList).sort().map(centerName => {
              const isOpen = expandedCenters[centerName];
              const items = groupedList[centerName];
              
              return (
                <div key={centerName} className={`bg-white rounded-3xl overflow-hidden transition-all duration-500 ${isOpen ? 'shadow-2xl shadow-indigo-100 ring-2 ring-indigo-100' : 'shadow-sm border border-slate-100 hover:border-indigo-200'}`}>
                  {/* Center Header Toggle - changed to div to avoid nested button issue */}
                  <div 
                    onClick={() => toggleCenter(centerName)}
                    className={`w-full flex items-center justify-between p-6 text-left transition-all duration-300 cursor-pointer select-none ${isOpen ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`p-3 rounded-2xl transition-all duration-300 ${isOpen ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                        <div className="w-6 h-6"><Icons.MapPin /></div>
                      </div>
                      <div>
                        <h2 className={`text-2xl font-black transition-colors ${isOpen ? 'text-indigo-900' : 'text-slate-800'}`}>
                          {centerName}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest p-1.5 rounded-lg ${isOpen ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-white'}`}>
                             {items.length} {items.length === 1 ? 'Action Required' : 'Actions Required'}
                          </span>
                          <div className="flex items-center gap-1.5 text-[8px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-1.5 rounded-lg">
                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></div>
                            LIVE PD ACTIVE
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">

                      <div className={`p-2 rounded-xl transition-all duration-500 ${isOpen ? 'rotate-180 bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                        <div className="w-8 h-8"><Icons.ChevronDown /></div>
                      </div>
                    </div>
                  </div>

                  {/* Members Detail (Collapse/Expand) */}
                  <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[8000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                    <div className="p-4 md:p-8 bg-slate-50/30 border-t border-slate-100 space-y-8">
                      {items.map(item => (
                        <div key={item.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col xl:flex-row gap-10 items-stretch relative hover:shadow-2xl hover:shadow-indigo-50 transition-all duration-500">
                          
                          <div className="flex-1 space-y-10">
                            {/* Member Identity Card */}
                            <div className="flex flex-wrap gap-8 items-center bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                                  <div className="w-6 h-6"><Icons.User /></div>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
                                  <p className="text-xl font-black text-slate-900 leading-none">{item.memberName}</p>
                                </div>
                              </div>
                              <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl font-black flex items-center justify-center text-[9px] shadow-sm shadow-amber-50 leading-tight text-center">
                                  APP<br/>ID
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Application ID</p>
                                  <p className="text-xl font-black text-amber-600 leading-none">{item.appId || item.memberId}</p>
                                </div>
                              </div>
                              <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl font-black flex items-center justify-center text-xs shadow-sm shadow-indigo-50">
                                  ID
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Member ID</p>
                                  <p className="text-xl font-black text-slate-900 leading-none">{item.memberId}</p>
                                </div>
                              </div>
                              <div className="h-10 w-px bg-slate-200 hidden lg:block"></div>
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Submitted By</p>
                                  <p className="text-lg font-black text-slate-950 leading-none">{item.staffName}</p>
                                </div>
                              </div>
                              <div className="h-10 w-px bg-slate-200 hidden xl:block"></div>
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm text-rose-500">
                                  <div className="w-5 h-5"><Icons.MapPin /></div>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Location</p>
                                  {item.location && item.location !== 'N/A' ? (
                                    <a 
                                      href={`https://www.google.com/maps?q=${item.location}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sm font-black text-rose-600 hover:text-rose-700 underline underline-offset-4 flex items-center gap-1.5"
                                    >
                                      View on Map
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                    </a>
                                  ) : (
                                    <p className="text-sm font-black text-slate-300">Not Available</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Evidence Photos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="group/img relative">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                                  <div className="w-4 h-4"><Icons.Image /></div> Home Documentation
                                </label>
                                <div 
                                  className="aspect-video rounded-[2rem] overflow-hidden bg-slate-100 border-4 border-white shadow-lg cursor-zoom-in ring-offset-4 ring-indigo-600/0 hover:ring-2 transition-all duration-500 relative group"
                                  onClick={(e) => { e.preventDefault(); setPreviewImage(item.homeImage); }}
                                >
                                  <img 
                                    src={item.homeImage} 
                                    alt="Home" 
                                    className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-[1.5s]" 
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="w-10 h-10 text-white"><Icons.Maximize /></div>
                                  </div>
                                </div>
                              </div>
                              <div className="group/img relative">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                                  <div className="w-4 h-4"><Icons.Image /></div> Side Documentation
                                </label>
                                <div 
                                  className="aspect-video rounded-[2rem] overflow-hidden bg-slate-100 border-4 border-white shadow-lg cursor-zoom-in ring-offset-4 ring-indigo-600/0 hover:ring-2 transition-all duration-500 relative group"
                                  onClick={(e) => { e.preventDefault(); setPreviewImage(item.sideImage); }}
                                >
                                  <img 
                                    src={item.sideImage} 
                                    alt="Side" 
                                    className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-[1.5s]" 
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="w-10 h-10 text-white"><Icons.Maximize /></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Decision Sidepanel */}
                          <div className="w-full xl:w-80 flex flex-col gap-10 bg-slate-50/30 p-8 rounded-[2rem] border border-slate-100">
                            


                            <div className="space-y-4">
                              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                Verifier Remarks
                                <span className="text-[9px] text-slate-300 font-bold uppercase">(Optional)</span>
                              </label>
                              <textarea
                                placeholder="State any observations or reasons for your decision..."
                                value={reasons[item.id] || ''}
                                onChange={(e) => setReasons({...reasons, [item.id]: e.target.value})}
                                className="w-full px-6 py-5 bg-white border border-slate-200 rounded-[1.5rem] text-sm outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 resize-none h-full min-h-[140px] transition-all font-semibold text-slate-700 shadow-inner"
                              />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); handleAction(item.id, 'approve'); }}
                                disabled={!!actioning}
                                className={`group/btn relative overflow-hidden py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] transition-all duration-300 shadow-2xl flex items-center justify-center gap-3 ${
                                  actioning === item.id 
                                    ? 'bg-slate-800 text-white cursor-not-allowed' 
                                    : 'bg-emerald-600 text-white hover:bg-slate-900 shadow-emerald-200'
                                }`}
                              >
                                <span>{actioning === item.id ? 'Processing...' : 'Final Approval'}</span>
                                <div className={`w-4 h-4 ${actioning === item.id ? 'animate-spin' : 'group-hover/btn:scale-125 transition-transform'}`}>
                                  {actioning === item.id ? <Icons.Loader2 /> : <Icons.CheckCircle2 />}
                                </div>
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); handleAction(item.id, 'reject'); }}
                                disabled={!!actioning}
                                className={`py-5 border-2 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] transition-all duration-300 flex items-center justify-center gap-3 ${
                                  actioning === item.id
                                    ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                    : 'bg-white text-rose-600 border-rose-100 hover:bg-rose-50 hover:border-rose-200'
                                }`}
                              >
                                <span>Reject Record</span>
                                <div className="w-4 h-4"><Icons.XCircle /></div>
                              </button>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modern High-End Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl transition-all duration-500 animate-in fade-in"
          onClick={(e) => { e.preventDefault(); setPreviewImage(null); }}
        >
          <div className="absolute top-8 right-8 flex items-center gap-6">
            <button 
              type="button"
              className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all duration-300 hover:scale-110 active:scale-95 border border-white/10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(previewImage, '_blank');
              }}
            >
               <div className="w-6 h-6"><Icons.Maximize /></div>
            </button>
            <button 
              type="button"
              className="p-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl transition-all duration-300 hover:rotate-90 hover:scale-110 active:scale-95 shadow-2xl shadow-rose-900/50"
              onClick={(e) => { e.preventDefault(); setPreviewImage(null); }}
            >
               <div className="w-6 h-6"><Icons.X /></div>
            </button>
          </div>
          
          <div 
            className="w-full h-full max-w-[95vw] max-h-[90vh] p-4 flex items-center justify-center"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border-4 border-white/5 animate-in zoom-in-95 duration-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PdVerify;
