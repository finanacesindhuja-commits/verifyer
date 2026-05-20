require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: loans } = await supabase.from('loans').select('status');
  const { data: pds } = await supabase.from('pd_verifications').select('status, center_id');

  const loanVerifyCount = (loans || []).filter(l => {
    const s = l.status?.toLowerCase();
    return !s || s === 'pending' || s === 'under review';
  }).length;

  const queryCount = (loans || []).filter(l => l.status?.toUpperCase() === 'QUERY').length;

  const pdVerifyCount = (pds || []).filter(s => 
    s.status !== 'Approved' && 
    !String(s.status).startsWith('Approved') &&
    !String(s.status).startsWith('Rejected') &&
    s.center_id !== '__config__'
  ).length;

  console.log('--- STATS CHECK ---');
  console.log('Loan Verify Count:', loanVerifyCount);
  console.log('PD Verify Count:', pdVerifyCount);
  console.log('Query Count:', queryCount);
}

check();
