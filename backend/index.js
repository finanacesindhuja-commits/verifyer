const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const upload = multer({ storage: multer.memoryStorage() });

const logFile = path.join(__dirname, 'server_log.txt');
const log = (msg) => {
  const t = new Date().toISOString();
  fs.appendFileSync(logFile, `[${t}] ${msg}\n`);
  console.log(msg);
};
fs.appendFileSync(logFile, `\n--- Starting server at ${new Date().toISOString()} ---\n`);

const app = express();
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options(/(.*)/, cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = process.env.PORT || 5006;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  log('ERROR: Supabase credentials missing! Exiting.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

let activeVerifierLink = {
  link: '',
  updatedAt: null
};

app.use((req, res, next) => {
  log(`${req.method} ${req.url}`);
  next();
});

// GET all loans
app.get('/api/loans', async (req, res) => {
  try {
    // Optimized: Only fetch necessary fields for dashboard/query list, and limit to recent 500
    const { data: loans, error } = await supabase
      .from('loans')
      .select('id, center_name, center_id, member_name, person_name, aadhar_no, created_at, status, member_id, staff_name, loan_app_id')
      .order('created_at', { ascending: false })
      .limit(500);
      
    if (error) throw error;

    // Fetch members ONLY for the retrieved loans
    const memberIds = [...new Set(loans.map(l => l.member_id).filter(Boolean))];
    const memberMap = {};
    
    if (memberIds.length > 0) {
      const { data: members, error: memberError } = await supabase
        .from('members')
        .select('id, member_no')
        .in('id', memberIds);
        
      if (!memberError && members) {
        members.forEach(m => memberMap[m.id] = m.member_no);
      }
    }

    // Use the status column from the loans table as a fallback if verifications table is inaccessible
    const mappedLoans = loans.map(loan => ({
      ...loan,
      member_no: memberMap[loan.member_id] || loan.member_no || 'N/A',
      verification_status: loan.status || 'Pending'
    }));

    res.json(mappedLoans);
  } catch (err) {
    log(`Error fetching loans: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// GET single loan by ID
app.get('/api/loans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: loan, error } = await supabase
      .from('loans')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;

    if (loan.member_id) {
       const { data: member, error: memberError } = await supabase
         .from('members')
         .select('member_no')
         .eq('id', loan.member_id)
         .single();
       if (!memberError && member) {
          loan.member_no = member.member_no || loan.member_no;
       }
    }
    
    res.json(loan);
  } catch (err) {
    log(`Error fetching loan ${req.params.id}: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// POST verify a loan - Updating the 'loans' table status directly
app.post('/api/loans/:id/verify', async (req, res) => {
  const { id } = req.params;
  const { status, remarks, staffId } = req.body;
  try {
    log(`Attempting to update loan ${id} status to ${status} in 'loans' table...`);
    
    const { data, error } = await supabase
      .from('loans')
      .update({ 
        status: status.toUpperCase(),
        verifier_id: staffId,
        verified_at: new Date().toISOString(),
        verification_remarks: remarks
      })
      .eq('id', id)
      .select();

    if (error) {
       log(`Update failed for loan ${id}: ${error.message}`);
       throw error;
    }

    log(`Update success for loan ${id}: ${JSON.stringify(data)}`);
    res.json(data[0]);
  } catch (err) {
    log(`Error in verification for loan ${id}: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// POST replace a document for a loan
app.post('/api/loans/:id/replace-document', upload.single('document'), async (req, res) => {
  const { id } = req.params;
  const { field } = req.body; // e.g., 'member_aadhaar_front_url'
  try {
    if (!req.file) throw new Error('No file uploaded');
    if (!field) throw new Error('Document field not specified');

    log(`Attempting to replace ${field} for loan ${id}`);

    // 1. Get old URL to delete
    const { data: loanData, error: fetchError } = await supabase
      .from('loans')
      .select(field)
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    const oldUrl = loanData[field];

    // 2. Upload new file
    const file = req.file;
    const fileName = `loans/${Date.now()}-replaced-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const { error: uploadError } = await supabase.storage
      .from('loan-documents')
      .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('loan-documents').getPublicUrl(fileName);

    // 3. Delete old file if it exists and is from our storage
    if (oldUrl && oldUrl.includes('loan-documents/')) {
       try {
         const parts = oldUrl.split('loan-documents/');
         if (parts.length > 1) {
             let oldPath = parts[1];
             // Sometimes it contains query params, let's remove them just in case
             oldPath = oldPath.split('?')[0]; 
             log(`Deleting old file: ${oldPath}`);
             await supabase.storage.from('loan-documents').remove([oldPath]);
         }
       } catch (delErr) {
         log(`Warning: Failed to delete old file: ${delErr.message}`);
       }
    }

    // 4. Update the DB
    const updatePayload = {};
    updatePayload[field] = publicUrl;
    
    const { error: updateError } = await supabase
      .from('loans')
      .update(updatePayload)
      .eq('id', id);

    if (updateError) throw updateError;

    log(`Successfully replaced ${field} for loan ${id}. New URL: ${publicUrl}`);
    res.json({ message: 'Document replaced successfully', url: publicUrl, field });

  } catch (err) {
    log(`Error replacing document for loan ${id}: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// POST update loan status - can be used to dismiss queries
app.post('/api/loans/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;
  try {
    log(`Updating loan ${id} status to ${status}...`);
    const { data, error } = await supabase
      .from('loans')
      .update({ 
        status: status.toUpperCase(),
        verification_remarks: remarks || null
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    log(`Error updating status for loan ${id}: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// --- PD Application Endpoints (Supabase Backed) ---

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running successfully!' });
});

// GET all unique centers from loans table
app.get('/api/centers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('loans')
      .select('center_id, center_name');
    
    if (error) throw error;
    
    // Get unique centers
    const uniqueCenters = [];
    const seen = new Set();
    data.forEach(item => {
      if (!seen.has(item.center_id)) {
        seen.add(item.center_id);
        uniqueCenters.push({ id: item.center_id, name: item.center_name });
      }
    });
    
    res.json(uniqueCenters);
  } catch (err) {
    log(`Centers Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// GET members for a center from loans table
app.get('/api/members/:centerId', async (req, res) => {
  const { centerId } = req.params;
  try {
    // Only fetch loans that have been finalized/imported for PD
    const { data: loans, error } = await supabase
      .from('loans')
      .select('member_id, member_name, mobile_no, status')
      .eq('center_id', centerId)
      .eq('status', 'READY FOR PD');
    
    if (error) throw error;

    // Also get existing PD verifications to mark as "isSubmitted"
    const { data: pds } = await supabase
      .from('pd_verifications')
      .select('member_id, pd_verified')
      .eq('center_id', centerId);

    const pdMap = {};
    if (pds) pds.forEach(p => pdMap[p.member_id] = p.pd_verified);

    const members = loans.map(l => ({
      id: l.member_id,
      name: l.member_name,
      phone: l.mobile_no,
      isSubmitted: !!pdMap[l.member_id],
      pdVerified: pdMap[l.member_id] || false
    }));

    res.json(members);
  } catch (err) {
    log(`Members Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// POST submit a PD verification to Supabase
app.post('/api/submit-pd', async (req, res) => {
  const { centerId, memberId, staffId, homeImage, sideImage, zoomLink } = req.body;
  try {
    log(`Submitting PD for member ${memberId} in center ${centerId}...`);
    const { data, error } = await supabase
      .from('pd_verifications')
      .insert({
        center_id: centerId,
        member_id: memberId,
        staff_id: staffId,
        home_image: homeImage,
        side_image: sideImage,
        zoom_link: zoomLink || null,
        status: 'Pending PD Verification'
      })
      .select();

    if (error) throw error;
    res.json({ message: 'Submitted successfully', data: data[0] });
  } catch (err) {
    log(`Submit Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// GET verification list from Supabase
app.get('/api/verification-list', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pd_verifications')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    const { data: membersList } = await supabase.from('members').select('id, member_no');
    const memberMap = {};
    if (membersList) membersList.forEach(m => memberMap[m.id] = m.member_no);
    
    // Enrich with names from loans table for display
    const enrichedList = await Promise.all(data.map(async (sub) => {
      // Find the loan for this member/center to get the names and staff info
      const { data: loanData } = await supabase
        .from('loans')
        .select('id, center_name, member_name, staff_name, loan_app_id')
        .eq('member_id', sub.member_id)
        .eq('center_id', sub.center_id)
        .limit(1);

      const loan = loanData && loanData.length > 0 ? loanData[0] : null;

      return {
        id: sub.id,
        centerId: sub.center_id,
        memberId: sub.member_id,
        appId: memberMap[sub.member_id] || (loan ? loan.loan_app_id || loan.id : sub.member_id),
        homeImage: sub.home_image,
        sideImage: sub.side_image, 
        zoomLink: sub.zoom_link,
        staffId: sub.staff_id,
        staffName: loan ? loan.staff_name : `Officer ${sub.staff_id}`,
        loanVerified: sub.loan_verified,
        pdVerified: sub.pd_verified,
        status: sub.status,
        createdAt: sub.created_at,
        centerName: loan ? loan.center_name : `Center ${sub.center_id}`,
        memberName: loan ? loan.member_name : `Member ${sub.member_id}`
      };
    }));
    
    res.json(enrichedList);
  } catch (err) {
    log(`List Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// APPROVE/REJECT verification in Supabase
app.post('/api/approve-verification', async (req, res) => {
  const { submissionId, type, action, reason } = req.body; 
  try {
    let updateData = {};
    if (type === 'loan') {
      updateData = { loan_verified: true, status: 'Pending PD Verification' };
    } else if (type === 'pd') {
      if (action === 'reject') {
        updateData = { 
          pd_verified: false, 
          status: reason ? `Rejected: ${reason}` : 'Rejected',
          loan_verified: false 
        };
      } else {
        updateData = { 
          pd_verified: true, 
          status: reason ? `Approved: ${reason}` : 'Approved'
        };
      }
    }
    
    const { data, error } = await supabase
      .from('pd_verifications')
      .update(updateData)
      .eq('id', submissionId)
      .select()
      .single();
      
    if (error) throw error;

    // --- BRIDGE TO LOANS TABLE ---
    // If PD is approved, we must update the main 'loans' table status to 'VERIFIED'
    // so it shows up in the Manager's Sanction Queue.
    if (type === 'pd' && action !== 'reject') {
      const targetMemberId = Number(data.member_id);
      const targetCenterId = Number(data.center_id);
      
      log(`📝 Bridging PD Approval for Member: ${targetMemberId} (Center: ${targetCenterId})`);
      
      const { data: updateResult, error: loanUpdateError, count } = await supabase
        .from('loans')
        .update({ 
          status: 'VERIFIED',
          verified_at: new Date().toISOString()
        })
        .match({ 
          member_id: targetMemberId, 
          center_id: targetCenterId
        })
        .or('status.eq.PENDING,status.eq.Pending PD Verification') // Target the active loan
        .select();
      
      if (loanUpdateError) {
        log(`❌ Sync Failed: ${loanUpdateError.message}`);
      } else if (!updateResult || updateResult.length === 0) {
        log(`⚠️ Sync Warning: No matching Pending loan found for Member ${targetMemberId}. Is the member ID correct?`);
      } else {
        log(`✅ Sync Success: Updated ${updateResult.length} loan(s) to VERIFIED.`);
      }
    }
    // ----------------------------

    res.json({ message: 'Actioned successfully', submission: data });
  } catch (err) {
    log(`Approve/Reject Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// --- Zoom Link Management APIs ---

// GET active verifier host link
app.get('/api/verifier-link', (req, res) => {
  res.json(activeVerifierLink);
});

// POST update verifier host link
app.post('/api/update-verifier-link', async (req, res) => {
  const { link } = req.body;
  if (!link) return res.status(400).json({ message: 'Meeting link is required' });
  
  activeVerifierLink = {
    link,
    updatedAt: new Date().toISOString()
  };
  
  // Save to Supabase pd_verifications config row so PD App can auto-fetch it
  try {
    // Check if config row exists
    const { data: existing } = await supabase
      .from('pd_verifications')
      .select('id')
      .eq('center_id', '__config__')
      .eq('member_id', 'host_link')
      .single();

    if (existing) {
      await supabase
        .from('pd_verifications')
        .update({ zoom_link: link })
        .eq('center_id', '__config__')
        .eq('member_id', 'host_link');
    } else {
      await supabase
        .from('pd_verifications')
        .insert({
          center_id: '__config__',
          member_id: 'host_link',
          staff_id: 'system',
          home_image: '',
          side_image: '',
          zoom_link: link,
          status: '__config__'
        });
    }
    log(`Verifier Host Link saved to Supabase: ${link}`);
  } catch (err) {
    log(`Warning: Could not save host link to Supabase: ${err.message}`);
  }
  
  log(`Verifier Link Updated: ${JSON.stringify(activeVerifierLink)}`);
  res.json({ message: 'Host link updated successfully', ...activeVerifierLink });
});
// ------------------------------

app.post('/staff/login', async (req, res) => {
  try {
    const { staff_id, password } = req.body;
    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('staff_id', staff_id?.toUpperCase())
      .eq('password', password)
      .ilike('role', 'verifier')
      .single();

    if (error || !staff) {
      log(`Login FAILED for ${staff_id}: ${error ? error.message : 'User not found or role mismatch'}`);
      return res.status(401).json({ error: 'Invalid Staff ID or password' });
    }

    log(`Login SUCCESS for ${staff_id} (${staff.role})`);
    res.json({ staff });
  } catch (err) {
    log(`Catch Error in login: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// --- Serve Frontend ---
const staticPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(staticPath));

// Fallback for Single Page Application (SPA) routing
app.get('*all', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    log(`Main Verifier Backend running on port ${PORT}`);
    console.log(`Server is listening on http://localhost:${PORT}`);
}).on('error', (err) => {
    log(`Failed to start server: ${err.message}`);
    process.exit(1);
});
