// supabaseClient.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// 🔌 Supabase client create
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 Export client to use in controller files
module.exports = supabase;
