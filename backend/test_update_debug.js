const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  try {
    const { data, error } = await supabase
      .from('loans')
      .update({ status: 'PENDING' })
      .eq('id', 2)
      .select();
      
    if (error) {
       console.error('Update Error:', error.message);
    } else {
       console.log('Update Success:', data);
    }
  } catch (err) {
    console.error('Catch Error:', err.message);
  }
}

testUpdate();
