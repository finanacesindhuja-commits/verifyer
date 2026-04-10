const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('staff').select('*').limit(1);
  if (error) {
    console.log('Error:', error.message);
  } else if (data.length > 0) {
    console.log('Columns:', Object.keys(data[0]).join(', '));
    console.log('First row:', JSON.stringify(data[0]));
  } else {
    console.log('Table is empty.');
  }
}
check();
