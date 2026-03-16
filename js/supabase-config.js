// Supabase configuration
const SUPABASE_URL = 'https://nlkcncnzlaunxvuklgpr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sa2NuY256bGF1bnh2dWtsZ3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NTYwMTgsImV4cCI6MjA4OTEzMjAxOH0.UH2ucbFNkOw_iam3n-9bmT_LXvYJZrR09978pgzhOYw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
