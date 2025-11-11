import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Supabase client using environment variables provided by Vercel's integration.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // This will cause the function to fail safely if the environment variables aren't set.
  throw new Error("Supabase URL or Anon Key is not defined in environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to generate a random 6-character alphanumeric string for the sync code.
const generateSyncCode = (length = 6): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};


export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
    // Set CORS headers to allow requests from any origin. This is crucial for Vercel.
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request for CORS preflight, which browsers send before POST/GET.
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

  if (req.method === 'POST') {
    // --- CREATE A NEW BACKUP ---
    try {
      const { data: encryptedData } = req.body;
      if (!encryptedData) {
        return res.status(400).json({ error: 'Encrypted data is required.' });
      }

      const syncCode = generateSyncCode();
      
      const { error } = await supabase
        .from('backups')
        .insert({ sync_code: syncCode, encrypted_data: encryptedData });

      if (error) {
        // This could happen if a sync code collides, though it's very rare.
        // For a production app, you might want to retry with a new code.
        console.error('Supabase insert error:', error);
        throw error;
      }

      // Return the generated code to the user.
      return res.status(201).json({ syncCode });

    } catch (error: any) {
      console.error('Backup creation error:', error);
      return res.status(500).json({ error: `Server error: ${error.message}` });
    }
  } else if (req.method === 'GET') {
    // --- RETRIEVE A BACKUP ---
    try {
        const { code } = req.query;
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'A sync code is required.' });
        }

        const { data, error } = await supabase
            .from('backups')
            .select('encrypted_data')
            .eq('sync_code', code.toUpperCase()) // Match the code case-insensitively.
            .single(); // Expect only one result.

        if (error) {
             console.error('Backup retrieval error:', error);
             // 'PGRST116' is Supabase's code for "exact one row not found"
             if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Backup not found or invalid sync code.' });
             }
            throw error;
        }
        
        if (!data) {
             return res.status(404).json({ error: 'Backup not found or invalid sync code.' });
        }

        // Return the encrypted data found in the database.
        return res.status(200).json({ data: data.encrypted_data });

    } catch (error: any) {
        console.error('Backup retrieval error:', error);
        return res.status(500).json({ error: `Server error: ${error.message}` });
    }
  } else {
    // Handle any other HTTP methods.
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
