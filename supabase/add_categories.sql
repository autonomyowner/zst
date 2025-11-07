-- Add 10 predefined categories to the ZST Marketplace
-- This migration inserts categories if they don't already exist

INSERT INTO public.categories (name, icon_svg) VALUES
  ('Automobiles & Véhicules (Automobiles & Vehicles)', NULL)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.categories (name, icon_svg) VALUES
  ('Téléphones & Accessoires (Phones & Accessories)', NULL)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.categories (name, icon_svg) VALUES
  ('Informatique (Computers & IT)', NULL)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.categories (name, icon_svg) VALUES
  ('Electroménager & Électronique (Home Appliances & Electronics)', NULL)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.categories (name, icon_svg) VALUES
  ('Vetements & Mode (Clothing & Fashion)', NULL)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.categories (name, icon_svg) VALUES
  ('Pièces détachées (Spare Parts)', NULL)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.categories (name, icon_svg) VALUES
  ('Meubles & Maison (Furniture & Home)', NULL)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.categories (name, icon_svg) VALUES
  ('Santé & Beauté (Health & Beauty)', NULL)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.categories (name, icon_svg) VALUES
  ('Matériaux & Equipement (Materials & Equipment)', NULL)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.categories (name, icon_svg) VALUES
  ('Artisanat (Crafts)', NULL)
ON CONFLICT (name) DO NOTHING;

