import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { pdfjs } from 'react-pdf';

import { GlobalStyles } from './components/GlobalStyles';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/LandingPage';
import { UploadPage } from './components/UploadPage';
import { SuccessPage } from './components/SuccessPage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './lib/config';

// Worker setup for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import { Component } from 'lucide-react';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { RegisterPage } from './components/RegisterPage';
import { UpdatePasswordPage } from './components/UpdatePasswordPage';

// --- Componente Principal ---
export default function App() {

  const [libsLoaded, setLibsLoaded] = useState(false);
  const [supabase, setSupabase] = useState(null);
  const [session, setSession] = useState(null);
  const [currentRoute, setCurrentRoute] = useState('upload'); // 'upload', 'landing', 'login', 'admin'
  const [landingData, setLandingData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Estado para controlar o sucesso do upload mantendo a UploadPage montada
  const [uploadSuccessData, setUploadSuccessData] = useState(null);
  const [uploadKey, setUploadKey] = useState(0);

  useEffect(() => {
    try {
      const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      setSupabase(client);
      setLibsLoaded(true);

      // Auth Listener
      client.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });

      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        // Se fizer login, vai pro admin. Se sair, vai pro login.
        if (session && currentRoute === 'login') setCurrentRoute('admin');
        if (!session && currentRoute === 'admin') setCurrentRoute('login');
      });

      return () => subscription.unsubscribe();

    } catch (err) {
      console.error("Erro ao inicializar Supabase:", err);
      setLoadError(err.message);
    }
  }, []);

  // Routing Logic based on URL params & Auth
  useEffect(() => {
    if (!libsLoaded || !supabase) return;

    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const videoSlug = params.get('v');

    // 1. Rota Pública: Visualização do Cliente (Landing)
    if (videoSlug) {
      setCurrentRoute('fetching_landing');
      return;
    }

    if (path === '/cadastro') {
      setCurrentRoute('register');
      return;
    }

    if (path === '/update-password') {
      setCurrentRoute('update-password');
      return;
    }

    // 2. Rota Pública: Login
    if (path === '/login') {
      // Se já estiver logado, manda pro upload (home)
      if (session) {
        setCurrentRoute('admin');
      } else {
        setCurrentRoute('login');
      }
      return;
    }

    // 3. Rotas Privadas (Upload e Admin)
    if (!session) {
      // Se não tem sessão e tentou acessar rota privada -> Login
      setCurrentRoute('login');
      return;
    }

    // Se tem sessão:
    if (path === '/admin') {
      setCurrentRoute('admin');
    } else if (path === '/' || path === '' || path.startsWith('/?')) {
      // Default Logado = Admin (sempre)
      setCurrentRoute('admin');
    } else {
      // Se nao casou com nenhuma rota
      setCurrentRoute('404');
    }
  }, [libsLoaded, supabase, session]);

  // Fetching Video Data
  useEffect(() => {
    if (libsLoaded && supabase && currentRoute === 'fetching_landing') {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get('v');
      async function fetchData() {
        const { data, error } = await supabase.from('videos_pecas').select('*').eq('slug', slug).single();
        if (data) {
          setLandingData(data);
          setCurrentRoute('landing');
        } else {
          alert("Processo não encontrado.");
          setCurrentRoute('admin');
        }
      }
      fetchData();
    }
  }, [libsLoaded, supabase, currentRoute]);

  if (loadError) return <div className="text-red-500 p-10">Erro Crítico: {loadError}</div>;
  if (!libsLoaded) return <div className="text-[#E5B935] p-10 flex items-center justify-center h-screen"><Loader2 className="animate-spin mr-2" /> Carregando sistema...</div>;

  return (
    <>
      <GlobalStyles />
      <ErrorBoundary>
        {/* ROTEAMENTO SIMPLES (CLIENT-SIDE) */}

        {currentRoute === 'login' && (
          <LoginPage supabase={supabase} />
        )}

        {currentRoute === 'admin' && (
          <AdminDashboard supabase={supabase} session={session} />
        )}

        {currentRoute === '404' && (
          <div className="min-h-screen bg-[#050505] flex items-center justify-center text-center p-6">
            <div>
              <h1 className="text-[#C9A857] text-4xl font-serif font-bold mb-4">404</h1>
              <p className="text-gray-400">Página não encontrada.</p>
              <a href="/login" className="mt-6 inline-block text-[#C9A857] underline hover:text-white">Voltar ao Início</a>
            </div>
          </div>
        )}

        {currentRoute === 'landing' && landingData && (
          <LandingPage data={landingData} supabase={supabase} />
        )}

        {currentRoute === 'register' && (
          <RegisterPage supabase={supabase} />
        )}

        {currentRoute === 'update-password' && (
          <UpdatePasswordPage supabase={supabase} />
        )}

        {currentRoute === 'upload' && (
          <>
            {/* UploadPage sempre montada para preservar estado */}
            <div style={{ display: uploadSuccessData ? 'none' : 'block' }}>
              <UploadPage
                key={uploadKey}
                supabase={supabase}
                session={session}
                onSuccess={(data) => setUploadSuccessData(data)}
              />
            </div>

            {/* SuccessPage como Overlay */}
            {uploadSuccessData && (
              <SuccessPage
                data={uploadSuccessData}
                onEdit={() => setUploadSuccessData(null)}
                onReset={() => {
                  setUploadSuccessData(null);
                  setUploadKey(prev => prev + 1);
                }}
              />
            )}
          </>
        )}
      </ErrorBoundary>
    </>
  );
}
