const fs = require('fs');
try {
  const content = fs.readFileSync('loan_schema.txt', 'utf16le');
  console.log("UTF16LE:", content.substring(0, 500));
} catch(e) {}
try {
  const content = fs.readFileSync('loan_schema.txt', 'utf8');
  console.log("UTF8:", content.substring(0, 500));
} catch(e) {}

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log("Checking pd_verifications...");
  const { data, error } = await supabase.from('pd_verifications').select('*').limit(1);
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Data length:', data.length);
    if (data.length > 0) console.log(data[0]);
    else console.log('Empty table');
  }
}
check();
