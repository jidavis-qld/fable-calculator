-- =============================================================================
-- Fable Calculator — public schema reference snapshot
-- Supabase project: qrtomlulbcuantmtaxfc  (region us-west-2)
-- Captured: 2026-06-13 from the live database (pg_dump 17, public schema only).
--
-- WHY THIS FILE EXISTS:
-- The base tables were originally created in the Supabase UI and never had a
-- CREATE TABLE migration. The files in ./migrations/ are INCREMENTAL on top of
-- that UI-created base (20260220_multi_country adds the `country`/`price_unit`
-- columns and renames us_recipes→recipes; 20260310_security_fixes adds the RLS
-- policies and the us_recipe_analysis view). This snapshot captures the resulting
-- end-state schema for reproducibility / documentation.
--
-- IT IS NOT A SEQUENTIAL MIGRATION. Do not add a date prefix or run it as part
-- of `supabase db reset` — it would double-apply against the incremental
-- migrations above. To rebuild from scratch, either (a) run this snapshot ALONE
-- against an empty DB, or (b) squash migrations/ into a single baseline first.
-- Data lives in the ./migrations/*_region.sql + multi_country INSERTs, not here.
-- =============================================================================

-- ---- Tables -----------------------------------------------------------------

CREATE TABLE public.beef_prices (
    id integer NOT NULL,
    "trim" text NOT NULL,
    fat_pct numeric NOT NULL,
    price numeric NOT NULL,
    country text DEFAULT 'US'::text NOT NULL,
    price_unit text DEFAULT 'per_lb'::text NOT NULL
);

CREATE TABLE public.co2_kg_e (
    id integer NOT NULL,
    ingredient text NOT NULL,
    co2_per_kg numeric NOT NULL
);

CREATE TABLE public.nutrition (
    id integer NOT NULL,
    ingredient text NOT NULL,
    nutrient text NOT NULL,
    value numeric NOT NULL,
    unit text NOT NULL,
    country text DEFAULT 'US'::text NOT NULL
);

CREATE TABLE public.recipes (
    id integer NOT NULL,
    format text NOT NULL,
    recipe text NOT NULL,
    beef_pct numeric NOT NULL,
    fable_pct numeric NOT NULL,
    water_pct numeric NOT NULL,
    country text DEFAULT 'US'::text NOT NULL
);

CREATE TABLE public.scoring_config (
    key text NOT NULL,
    value numeric NOT NULL,
    description text
);

-- Derived/precomputed trim recommendation table (no PK; populated by tooling).
CREATE TABLE public.us_trim_selector (
    user_trim text,
    user_fat_pct numeric,
    recipe text,
    recommended_trim text,
    trim_fat_pct numeric,
    beef_pct numeric,
    fable_pct numeric,
    blended_fat numeric,
    target_fat numeric
);

-- ---- Identity sequences -----------------------------------------------------
-- (recipes.id uses the historically-named us_recipes_id_seq)

CREATE SEQUENCE public.beef_prices_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.beef_prices_id_seq OWNED BY public.beef_prices.id;
ALTER TABLE ONLY public.beef_prices ALTER COLUMN id SET DEFAULT nextval('public.beef_prices_id_seq'::regclass);

CREATE SEQUENCE public.co2_kg_e_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.co2_kg_e_id_seq OWNED BY public.co2_kg_e.id;
ALTER TABLE ONLY public.co2_kg_e ALTER COLUMN id SET DEFAULT nextval('public.co2_kg_e_id_seq'::regclass);

CREATE SEQUENCE public.nutrition_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.nutrition_id_seq OWNED BY public.nutrition.id;
ALTER TABLE ONLY public.nutrition ALTER COLUMN id SET DEFAULT nextval('public.nutrition_id_seq'::regclass);

CREATE SEQUENCE public.us_recipes_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.us_recipes_id_seq OWNED BY public.recipes.id;
ALTER TABLE ONLY public.recipes ALTER COLUMN id SET DEFAULT nextval('public.us_recipes_id_seq'::regclass);

-- ---- Primary keys -----------------------------------------------------------

ALTER TABLE ONLY public.beef_prices    ADD CONSTRAINT beef_prices_pkey    PRIMARY KEY (id);
ALTER TABLE ONLY public.co2_kg_e       ADD CONSTRAINT co2_kg_e_pkey       PRIMARY KEY (id);
ALTER TABLE ONLY public.nutrition      ADD CONSTRAINT nutrition_pkey      PRIMARY KEY (id);
ALTER TABLE ONLY public.scoring_config ADD CONSTRAINT scoring_config_pkey PRIMARY KEY (key);
ALTER TABLE ONLY public.recipes        ADD CONSTRAINT us_recipes_pkey     PRIMARY KEY (id);

-- ---- View: blended recipe analysis (security_invoker) -----------------------

CREATE VIEW public.us_recipe_analysis WITH (security_invoker='true') AS
 WITH recipes(recipe, beef_pct, fable_pct) AS (
         VALUES ('50/50, no water'::text,0.50,0.50), ('60/40, no water'::text,0.60,0.40), ('70/30, no water'::text,0.70,0.30), ('50/50, rehydrated'::text,0.50,0.43), ('60/40, rehydrated'::text,0.60,0.35), ('70/30, rehydrated'::text,0.70,0.26)
        ), shiitake AS (
         SELECT max(CASE WHEN (nutrition.nutrient = 'Total Fat'::text) THEN nutrition.value ELSE NULL::numeric END) AS fat,
            max(CASE WHEN (nutrition.nutrient = 'Dietary Fiber'::text) THEN nutrition.value ELSE NULL::numeric END) AS fiber,
            max(CASE WHEN (nutrition.nutrient = 'Protein'::text) THEN nutrition.value ELSE NULL::numeric END) AS protein,
            max(CASE WHEN (nutrition.nutrient = 'Energy (Calories)'::text) THEN nutrition.value ELSE NULL::numeric END) AS calories
           FROM public.nutrition WHERE (nutrition.ingredient = 'shiitake'::text)
        ), beef AS (
         SELECT nutrition.ingredient AS "trim",
            max(CASE WHEN (nutrition.nutrient = 'Total Fat'::text) THEN nutrition.value ELSE NULL::numeric END) AS fat,
            max(CASE WHEN (nutrition.nutrient = 'Dietary Fiber'::text) THEN nutrition.value ELSE NULL::numeric END) AS fiber,
            max(CASE WHEN (nutrition.nutrient = 'Protein'::text) THEN nutrition.value ELSE NULL::numeric END) AS protein,
            max(CASE WHEN (nutrition.nutrient = 'Energy (Calories)'::text) THEN nutrition.value ELSE NULL::numeric END) AS calories
           FROM public.nutrition WHERE (nutrition.ingredient <> 'shiitake'::text) GROUP BY nutrition.ingredient
        )
 SELECT r.recipe, b."trim",
    round((((b.fat * r.beef_pct) + (s.fat * r.fable_pct)) / (100)::numeric), 4) AS blended_fat_pct,
    round(((bp.price * r.beef_pct) + (4.98 * r.fable_pct)), 4) AS blended_cost_per_kg,
    round(((b.fiber * r.beef_pct) + (s.fiber * r.fable_pct)), 2) AS blended_fiber_per_100g,
    round(((b.protein * r.beef_pct) + (s.protein * r.fable_pct)), 2) AS blended_protein_per_100g,
    round(((b.calories * r.beef_pct) + (s.calories * r.fable_pct)), 1) AS blended_calories_per_100g,
    r.beef_pct, r.fable_pct
   FROM (((recipes r CROSS JOIN beef b)
     JOIN public.beef_prices bp ON ((bp."trim" = b."trim")))
     CROSS JOIN shiitake s)
  ORDER BY r.recipe, bp.fat_pct;

-- ---- Row-level security + public-read policies ------------------------------

ALTER TABLE public.beef_prices     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.co2_kg_e        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_config  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.us_trim_selector ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON public.beef_prices    FOR SELECT TO anon USING (true);
CREATE POLICY "public read" ON public.co2_kg_e       FOR SELECT TO anon USING (true);
CREATE POLICY "public read" ON public.nutrition      FOR SELECT TO anon USING (true);
CREATE POLICY "public read" ON public.recipes        FOR SELECT TO anon USING (true);
CREATE POLICY "public read" ON public.scoring_config FOR SELECT TO anon USING (true);
CREATE POLICY public_read   ON public.us_trim_selector FOR SELECT TO authenticated, anon USING (true);

-- ---- Grants (anon/authenticated/service_role get full table access; reads
--      are still gated by the RLS policies above) -----------------------------

GRANT ALL ON TABLE public.beef_prices     TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.co2_kg_e        TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.nutrition       TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.recipes         TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.scoring_config  TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.us_trim_selector TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.us_recipe_analysis TO anon, authenticated, service_role;
