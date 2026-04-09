// Initialize Supabase Client
const SUPABASE_URL = 'https://prigdqahnhccvcpfrknk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaWdkcWFobmhjY3ZjcGZya25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MDIzOTgsImV4cCI6MjA5MTI3ODM5OH0.VN8Ews7mCstzf_TNSil8TKJnaFjQStvJqO_lSP4Fb0c';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
