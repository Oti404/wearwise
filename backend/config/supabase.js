'use strict';

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey || supabaseServiceRoleKey.includes('[YOUR-')) {
    console.error('❌ EROARE: SUPABASE_SERVICE_ROLE_KEY nu este setat corect in .env!');
    console.error('   Mergi in Supabase Dashboard -> Settings -> API si copiaza "service_role key".');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

module.exports = { supabase };
