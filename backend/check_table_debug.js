const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  try {
    const { data, error } = await supabase.from('verifications').select('*').limit(1);
    if (error) {
      console.error('Verifications Table Error:', error.message);
    } else {
      console.log('Verifications Table OK');
    }
  } catch (err) {
    console.error('Catch Error:', err.message);
  }
}

checkTable();
