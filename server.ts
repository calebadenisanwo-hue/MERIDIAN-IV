import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Lazy Supabase server client helper
let supabaseServerClient: SupabaseClient | null = null;
function getSupabaseServer(): SupabaseClient | null {
  if (supabaseServerClient) return supabaseServerClient;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://caibxfxxhimfdmwfpkli.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhaWJ4Znh4aGltZmRtd2Zwa2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODAzNzEsImV4cCI6MjEwMjU1NjM3MX0.TMFKbVDWSsR_zsrXSU-8WOHDKHVptnguXp3vTg-YLdk';
  if (url && key) {
    try {
      supabaseServerClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (e) {
      console.warn('Failed to init Supabase server client:', e);
    }
  }
  return supabaseServerClient;
}

// In-memory server fallback snapshot for cloud sync backup
let serverStateSnapshot: { data: any; timestamp: string } | null = null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Route: Health Check
  app.get('/api/health', (req, res) => {
    const sb = getSupabaseServer();
    res.json({
      status: 'ok',
      engine: 'Meridian Android 14+ Personal Operating System Core',
      supabaseConnected: !!sb,
      timestamp: new Date().toISOString(),
    });
  });

  // API Route: Supabase Status
  app.get('/api/supabase/status', (req, res) => {
    const sb = getSupabaseServer();
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || null;
    res.json({
      configured: !!sb,
      url: url ? url.replace(/\/\/([^@]+@)?/, '//***@') : null,
      lastSync: serverStateSnapshot?.timestamp || null,
    });
  });

  // API Route: Supabase Cloud Sync Push
  app.post('/api/supabase/sync', async (req, res) => {
    try {
      const { data, timestamp } = req.body;
      const syncTime = timestamp || new Date().toISOString();

      // Store in memory snapshot
      serverStateSnapshot = { data, timestamp: syncTime };

      const sb = getSupabaseServer();
      if (sb) {
        // Upsert to Supabase table
        const { error } = await sb
          .from('meridian_backups')
          .upsert(
            {
              id: 'current_user_state',
              payload: data,
              updated_at: syncTime,
            },
            { onConflict: 'id' }
          );

        if (error) {
          console.warn('Supabase DB table upsert notice:', error.message);
          return res.json({
            success: true,
            syncedWithDatabase: false,
            message: `Snapshot stored on server. DB table sync pending: ${error.message}`,
            timestamp: syncTime,
          });
        }

        return res.json({
          success: true,
          syncedWithDatabase: true,
          message: 'Successfully synchronized state with Supabase cloud database.',
          timestamp: syncTime,
        });
      }

      res.json({
        success: true,
        syncedWithDatabase: false,
        message: 'Synchronized with local server storage. Supabase cloud URL not yet configured.',
        timestamp: syncTime,
      });
    } catch (error: any) {
      console.error('Error in /api/supabase/sync:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Sync failure',
      });
    }
  });

  // API Route: Supabase Cloud Sync Pull
  app.get('/api/supabase/pull', async (req, res) => {
    try {
      const sb = getSupabaseServer();
      if (sb) {
        const { data, error } = await sb
          .from('meridian_backups')
          .select('payload, updated_at')
          .eq('id', 'current_user_state')
          .single();

        if (!error && data?.payload) {
          return res.json({
            success: true,
            data: data.payload,
            timestamp: data.updated_at,
            source: 'supabase_database',
          });
        }
      }

      if (serverStateSnapshot) {
        return res.json({
          success: true,
          data: serverStateSnapshot.data,
          timestamp: serverStateSnapshot.timestamp,
          source: 'server_memory',
        });
      }

      res.status(404).json({
        success: false,
        message: 'No previous cloud snapshot found.',
      });
    } catch (error: any) {
      console.error('Error in /api/supabase/pull:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Fetch failure',
      });
    }
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Meridian Android 14+ OS running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
