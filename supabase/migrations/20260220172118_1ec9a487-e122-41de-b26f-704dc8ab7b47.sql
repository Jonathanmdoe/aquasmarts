
-- =============================================
-- 1. AUTOMATIC SMART ALERT TRIGGERS
-- =============================================

-- Trigger function: auto-create alerts when water quality thresholds are exceeded
CREATE OR REPLACE FUNCTION public.check_water_quality_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _farm_id uuid;
  _batch_name text;
  _concerns text[];
BEGIN
  -- Get the farm_id and batch name
  SELECT fb.farm_id, fb.name INTO _farm_id, _batch_name
  FROM public.fish_batches fb WHERE fb.id = NEW.batch_id;

  IF _farm_id IS NULL THEN RETURN NEW; END IF;

  _concerns := ARRAY[]::text[];

  -- Check temperature (safe: 25-30°C for tilapia)
  IF NEW.temperature IS NOT NULL AND (NEW.temperature < 20 OR NEW.temperature > 32) THEN
    _concerns := array_append(_concerns, 'Temperature ' || NEW.temperature || '°C is outside safe range (20-32°C)');
  END IF;

  -- Check pH (safe: 6.5-8.5)
  IF NEW.ph IS NOT NULL AND (NEW.ph < 6.5 OR NEW.ph > 8.5) THEN
    _concerns := array_append(_concerns, 'pH ' || NEW.ph || ' is outside safe range (6.5-8.5)');
  END IF;

  -- Check dissolved oxygen (safe: >5 mg/L)
  IF NEW.dissolved_oxygen IS NOT NULL AND NEW.dissolved_oxygen < 5 THEN
    _concerns := array_append(_concerns, 'Dissolved oxygen ' || NEW.dissolved_oxygen || ' mg/L is dangerously low (<5 mg/L)');
  END IF;

  -- Check ammonia (safe: <0.02 mg/L, warning: >0.02)
  IF NEW.ammonia IS NOT NULL AND NEW.ammonia > 0.02 THEN
    _concerns := array_append(_concerns, 'Ammonia ' || NEW.ammonia || ' mg/L exceeds safe level (>0.02 mg/L)');
  END IF;

  -- Check nitrite (safe: <0.1 mg/L)
  IF NEW.nitrite IS NOT NULL AND NEW.nitrite > 0.1 THEN
    _concerns := array_append(_concerns, 'Nitrite ' || NEW.nitrite || ' mg/L exceeds safe level (>0.1 mg/L)');
  END IF;

  -- Insert alert if any concerns
  IF array_length(_concerns, 1) > 0 THEN
    INSERT INTO public.smart_alerts (farm_id, batch_id, type, title, description, source)
    VALUES (
      _farm_id,
      NEW.batch_id,
      CASE WHEN array_length(_concerns, 1) >= 3 THEN 'danger' WHEN array_length(_concerns, 1) >= 2 THEN 'warning' ELSE 'warning' END,
      '⚠️ Water Quality Alert - ' || _batch_name,
      array_to_string(_concerns, '; '),
      'water_reading'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on water_readings insert
CREATE TRIGGER trg_water_quality_alerts
AFTER INSERT ON public.water_readings
FOR EACH ROW
EXECUTE FUNCTION public.check_water_quality_alerts();

-- Trigger function: auto-create alerts for health records with high severity
CREATE OR REPLACE FUNCTION public.check_health_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _farm_id uuid;
  _batch_name text;
  _alert_type text;
BEGIN
  SELECT fb.farm_id, fb.name INTO _farm_id, _batch_name
  FROM public.fish_batches fb WHERE fb.id = NEW.batch_id;

  IF _farm_id IS NULL THEN RETURN NEW; END IF;

  -- Alert for medium/high severity or mortality
  IF NEW.severity IN ('medium', 'high') OR (NEW.mortality_count IS NOT NULL AND NEW.mortality_count > 0) THEN
    _alert_type := CASE WHEN NEW.severity = 'high' OR (NEW.mortality_count IS NOT NULL AND NEW.mortality_count > 5) THEN 'danger' ELSE 'warning' END;

    INSERT INTO public.smart_alerts (farm_id, batch_id, type, title, description, source)
    VALUES (
      _farm_id,
      NEW.batch_id,
      _alert_type,
      '🐟 Health Alert - ' || _batch_name,
      NEW.title || COALESCE(': ' || NEW.description, '') || CASE WHEN NEW.mortality_count > 0 THEN ' (Mortality: ' || NEW.mortality_count || ')' ELSE '' END,
      'health_record'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on health_records insert
CREATE TRIGGER trg_health_alerts
AFTER INSERT ON public.health_records
FOR EACH ROW
EXECUTE FUNCTION public.check_health_alerts();

-- =============================================
-- 2. USER ROLES & TEAM MANAGEMENT
-- =============================================

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'manager', 'worker');

-- User roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'worker',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Team members table (links users to farms with roles)
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'worker',
  is_active boolean NOT NULL DEFAULT true,
  invited_by uuid,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (farm_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Team invitations table
CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'worker',
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS: team_members - farm owners can manage, members can read
CREATE POLICY "Farm owners manage team members"
ON public.team_members FOR ALL
USING (is_farm_owner(farm_id))
WITH CHECK (is_farm_owner(farm_id));

CREATE POLICY "Team members can read own membership"
ON public.team_members FOR SELECT
USING (auth.uid() = user_id);

-- RLS: team_invitations - farm owners manage
CREATE POLICY "Farm owners manage invitations"
ON public.team_invitations FOR ALL
USING (is_farm_owner(farm_id))
WITH CHECK (is_farm_owner(farm_id));

-- RLS: user_roles - users can read own roles, farm owners assign via team_members
CREATE POLICY "Users read own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Auto-assign owner role when farm is created
CREATE OR REPLACE FUNCTION public.assign_farm_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add as team member with owner role
  INSERT INTO public.team_members (farm_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.user_id, 'owner', NEW.user_id)
  ON CONFLICT DO NOTHING;

  -- Add owner role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'owner')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assign_farm_owner
AFTER INSERT ON public.farms
FOR EACH ROW
EXECUTE FUNCTION public.assign_farm_owner();
