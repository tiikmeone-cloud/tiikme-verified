
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, full_name, role, username, institution_name, location_city, location_state)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'role',
    COALESCE(
      NULLIF(LOWER(REGEXP_REPLACE(
        COALESCE(new.raw_user_meta_data->>'first_name', '') || COALESCE(new.raw_user_meta_data->>'last_name', ''),
        '[^a-zA-Z0-9]', '', 'g'
      )), ''),
      'user'
    ) || '_' || SUBSTR(new.id::text, 1, 8),
    new.raw_user_meta_data->>'institution',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'state'
  );
  RETURN new;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
