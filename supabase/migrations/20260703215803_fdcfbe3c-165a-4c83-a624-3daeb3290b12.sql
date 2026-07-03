
-- 1) marketplace_dispute_messages: only allow inserts when the dispute is still open/escalated
DROP POLICY IF EXISTS "Parties send messages" ON public.marketplace_dispute_messages;
CREATE POLICY "Parties send messages"
  ON public.marketplace_dispute_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.marketplace_disputes d
      WHERE d.id = dispute_id
        AND (d.buyer_id = auth.uid() OR d.seller_id = auth.uid())
        AND d.status IN ('open','escalated')
    )
  );

-- 2) marketplace_orders: add WITH CHECK to seller UPDATE policy so seller_id/buyer_id can't be flipped
DROP POLICY IF EXISTS "Sellers update own orders" ON public.marketplace_orders;
CREATE POLICY "Sellers update own orders"
  ON public.marketplace_orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);
-- Column-level enforcement remains handled by the restrict_seller_order_updates() trigger.

-- 3) notifications: remove client INSERT policy — only service role / SECURITY DEFINER triggers create rows
DROP POLICY IF EXISTS "Owners can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users insert own notifications" ON public.notifications;

-- 4) realtime.messages: scope dispute and mp-notifs topics to authorised participants only
DROP POLICY IF EXISTS "Authenticated users read own topics" ON realtime.messages;
CREATE POLICY "Authenticated users read own topics"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    -- mp-notifs channel must embed the subscriber's own uid
    realtime.topic() = 'mp-notifs-' || auth.uid()::text
    OR (
      realtime.topic() LIKE 'dispute-%'
      AND EXISTS (
        SELECT 1 FROM public.marketplace_disputes d
        WHERE d.id::text = substring(realtime.topic() FROM 9)
          AND (d.buyer_id = auth.uid() OR d.seller_id = auth.uid())
      )
    )
    -- generic per-user topics (topic name contains the user's uid)
    OR realtime.topic() LIKE '%' || auth.uid()::text || '%'
  );

DROP POLICY IF EXISTS "Authenticated users write own topics" ON realtime.messages;
CREATE POLICY "Authenticated users write own topics"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    realtime.topic() = 'mp-notifs-' || auth.uid()::text
    OR (
      realtime.topic() LIKE 'dispute-%'
      AND EXISTS (
        SELECT 1 FROM public.marketplace_disputes d
        WHERE d.id::text = substring(realtime.topic() FROM 9)
          AND (d.buyer_id = auth.uid() OR d.seller_id = auth.uid())
      )
    )
    OR realtime.topic() LIKE '%' || auth.uid()::text || '%'
  );

-- 5) user_roles: explicitly deny client-side writes; only service role / SECURITY DEFINER functions may mutate
DROP POLICY IF EXISTS "No client insert on user_roles" ON public.user_roles;
CREATE POLICY "No client insert on user_roles"
  ON public.user_roles FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

DROP POLICY IF EXISTS "No client update on user_roles" ON public.user_roles;
CREATE POLICY "No client update on user_roles"
  ON public.user_roles FOR UPDATE
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "No client delete on user_roles" ON public.user_roles;
CREATE POLICY "No client delete on user_roles"
  ON public.user_roles FOR DELETE
  TO authenticated, anon
  USING (false);
