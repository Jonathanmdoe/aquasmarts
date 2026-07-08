CREATE POLICY "Super admins view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins view all farms" ON public.farms FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins view all subs" ON public.subscribers_cache FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins view all orders" ON public.marketplace_orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins view all listings" ON public.marketplace_listings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins view all user_roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));