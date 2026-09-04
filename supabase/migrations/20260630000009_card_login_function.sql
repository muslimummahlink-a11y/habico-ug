-- Secure function to validate tenant card + unit + PIN credentials.
-- Runs with SECURITY DEFINER so anon users can call it without direct
-- table access.  Returns success + email on match, or error message.

CREATE OR REPLACE FUNCTION public.validate_card_login(
  p_card_number TEXT,
  p_unit_number  TEXT,
  p_access_pin   TEXT
)
RETURNS TABLE (valid BOOLEAN, email TEXT, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_email TEXT;
  v_card_status  TEXT;
  v_unit_num     TEXT;
  v_pin          TEXT;
BEGIN
  SELECT
    c.status,
    u.unit_number,
    t.email,
    t.access_pin
  INTO
    v_card_status,
    v_unit_num,
    v_tenant_email,
    v_pin
  FROM public.rental_id_cards c
  JOIN public.units u ON u.id = c.unit_id
  JOIN public.tenants t ON t.id = c.tenant_id
  WHERE c.card_number = p_card_number;

  IF v_card_status IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, 'Card not found'::TEXT;
    RETURN;
  END IF;

  IF v_card_status != 'active' THEN
    RETURN QUERY SELECT false, NULL::TEXT, format('Card is %s', v_card_status);
    RETURN;
  END IF;

  IF v_unit_num IS DISTINCT FROM p_unit_number THEN
    RETURN QUERY SELECT false, NULL::TEXT, 'Card does not match this unit'::TEXT;
    RETURN;
  END IF;

  IF v_pin IS DISTINCT FROM p_access_pin THEN
    RETURN QUERY SELECT false, NULL::TEXT, 'Incorrect PIN'::TEXT;
    RETURN;
  END IF;

  IF v_tenant_email IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, 'No email on file. Contact your property manager.'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_tenant_email, NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_card_login TO anon;
GRANT EXECUTE ON FUNCTION public.validate_card_login TO authenticated;
