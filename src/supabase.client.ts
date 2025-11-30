
import { createClient } from '@supabase/supabase-js';
import { environment } from './environments/environment';

const supabaseUrl = 'https://mvqxhiabdetnptreuwph.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cXhoaWFiZGV0bnB0cmV1d3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDA1MzMsImV4cCI6MjA4MDExNjUzM30.2qDHP5tuw7U87tDyCCix3B5-CFyZLOcorOb87wH5C7E';

export const supabase = createClient(supabaseUrl, supabaseKey);
