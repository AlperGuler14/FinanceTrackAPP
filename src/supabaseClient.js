import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zxczbwwujicossaujlmw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4Y3pid3d1amljb3NzYXVqbG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMzEzNzksImV4cCI6MjA4NzcwNzM3OX0.IFZynSplFxux8yT32U6PgIHaBjHEo71WMJ76Bde2yW0';

export const supabase = createClient(supabaseUrl, supabaseKey);