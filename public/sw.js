// ============================================
// Service Worker Otimizado para Mobile
// Versão 2.0 - Performance First
// ============================================

const CACHE_VERSION = 'v2';
const CACHE_NAME = `advocacia-${CACHE_VERSION}`;

// Assets críticos para cache inicial (apenas o essencial)
const CRITICAL_ASSETS = [
    '/',
    '/logo-new.webp'
];

// Assets que podem ser cacheados quando encontrados
const CACHEABLE_EXTENSIONS = [
    '.js', '.css', '.woff', '.woff2', '.webp', '.png', '.jpg', '.svg'
];

// ============================================
// INSTALL - Cache apenas assets críticos
// ============================================
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching critical assets');
                return cache.addAll(CRITICAL_ASSETS);
            })
            .then(() => self.skipWaiting()) // Ativa imediatamente
    );
});

// ============================================
// ACTIVATE - Limpa caches antigos
// ============================================
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('advocacia-') && name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim()) // Assume controle imediatamente
    );
});

// ============================================
// FETCH - Estratégias inteligentes de cache
// ============================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorar requests não-GET
    if (request.method !== 'GET') return;

    // Ignorar requests externos (exceto CDNs conhecidas)
    if (!url.origin.includes(self.location.origin) &&
        !url.hostname.includes('unpkg.com') &&
        !url.hostname.includes('supabase')) {
        return;
    }

    // API calls - Network First (sempre buscar dados frescos)
    if (url.pathname.includes('/rest/') || url.pathname.includes('/auth/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Assets estáticos - Cache First (rápido!)
    if (isCacheableAsset(url.pathname)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // HTML/Navegação - Stale While Revalidate
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    // Default: Network com fallback para cache
    event.respondWith(networkFirst(request));
});

// ============================================
// ESTRATÉGIAS DE CACHE
// ============================================

// Cache First - Perfeito para assets que não mudam
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // Retorna página offline se disponível
        return new Response('Offline', { status: 503 });
    }
}

// Network First - Para dados que precisam estar atualizados
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok && isCacheableAsset(new URL(request.url).pathname)) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        return cached || new Response('Offline', { status: 503 });
    }
}

// Stale While Revalidate - Retorna cache imediato, atualiza em background
async function staleWhileRevalidate(request) {
    const cached = await caches.match(request);

    const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then(c => c.put(request, response.clone()));
        }
        return response;
    }).catch(() => cached);

    return cached || fetchPromise;
}

// ============================================
// HELPERS
// ============================================

function isCacheableAsset(pathname) {
    return CACHEABLE_EXTENSIONS.some(ext => pathname.endsWith(ext));
}
