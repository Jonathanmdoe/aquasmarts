
-- Create smart alerts table
CREATE TABLE public.smart_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.fish_batches(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('warning', 'danger', 'success', 'info')),
  title TEXT NOT NULL,
  description TEXT,
  source TEXT DEFAULT 'system',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.smart_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Farm owners manage alerts"
  ON public.smart_alerts FOR ALL
  USING (is_farm_owner(farm_id))
  WITH CHECK (is_farm_owner(farm_id));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.smart_alerts;
