const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listStaff() {
  try {
    console.log('Fetching staff from:', supabaseUrl);
    const { data, error } = await supabase.from('staff').select('staff_id, role, password');
    if (error) {
      console.error('Supabase Error:', error);
      return;
    }
    console.log('Staff data:', data);
    if (!data || data.length === 0) {
      console.log('No staff found in the table!');
    } else {
      console.table(data);
    }
  } catch (err) {
    console.error('Catch Error:', err.message);
  }
}

listStaff();
