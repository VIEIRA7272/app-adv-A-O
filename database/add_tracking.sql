-- ==============================================================================
-- ADD TRACKING TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.view_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_slug TEXT NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ip TEXT,
    location TEXT,
    device TEXT
);

-- RLS
ALTER TABLE public.view_logs ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE (anon) to INSERT a log (tracking)
CREATE POLICY "Allow public insert logs"
ON public.view_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow ONLY TEAM (authenticated) to VIEW logs
CREATE POLICY "Allow team select logs"
ON public.view_logs
FOR SELECT
TO authenticated
USING (true);
