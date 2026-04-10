const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpsert() {
  try {
    const { data, error } = await supabase
      .from('verifications')
      .upsert({
        loan_id: 2,
        status: 'TEST',
        remarks: 'Test system update',
        staff_id: 'SYSTEM',
        verified_at: new Date().toISOString()
      })
      .select();
      
    if (error) {
      console.error('Upsert Error:', error.message);
    } else {
      console.log('Upsert Success:', data);
    }
  } catch (err) {
    console.error('Catch Error:', err.message);
  }
}

testUpsert();
