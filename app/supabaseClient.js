// app/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sgkoghdcuhvpkbimjvgn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNna29naGRjdWh2cGtiaW1qdmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MzkzMTYsImV4cCI6MjA3MDQxNTMxNn0.vcbehgGX3LvEKwPYbsAJmd5Gz8kb_P5em9_ww-Xzhkk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
