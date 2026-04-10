const fs = require('fs');
try {
  const content = fs.readFileSync('.env', 'utf8');
  console.log('ENV length:', content.length);
} catch(e) {
  console.log('No .env found');
}

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

if (!process.env.SUPABASE_URL) {
  console.log('NO SUPABASE URL');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log("Checking pd_verifications...");
  try {
    const { data, error } = await supabase.from('pd_verifications').select('*').limit(1);
    if (error) {
      console.log('Error querying table:', JSON.stringify(error));
    } else {
      console.log('Data length:', data.length);
      if (data.length > 0) {
        console.log('Sample row:', JSON.stringify(data[0]));
      } else {
        console.log('Table exists but is empty');
        // Let's insert to get schema
        const { error: insErr } = await supabase.from('pd_verifications').insert({ dummy: 1 });
        console.log('Insert error schema hint:', JSON.stringify(insErr));
      }
    }
  } catch(e) {
    console.log('Exception:', e.message);
  }
}
check();
