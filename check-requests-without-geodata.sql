-- ================================================
-- TireRequests ohne Geo-Daten finden
-- ================================================

-- 1. Anzahl der Anfragen ohne Geo-Daten
SELECT COUNT(*) as "Anfragen ohne Geo-Daten"
FROM "TireRequest"
WHERE latitude IS NULL OR longitude IS NULL;

-- 2. Nach Status gruppiert
SELECT 
  status,
  COUNT(*) as anzahl
FROM "TireRequest"
WHERE latitude IS NULL OR longitude IS NULL
GROUP BY status
ORDER BY anzahl DESC;

-- 3. Details aller Anfragen ohne Geo-Daten
SELECT 
  tr.id,
  tr.status,
  tr.service_type as "serviceType",
  tr.width,
  tr.aspect_ratio as "aspectRatio", 
  tr.diameter,
  tr.zip_code as "requestZipCode",
  tr.city as "requestCity",
  tr.latitude,
  tr.longitude,
  tr.created_at as "createdAt",
  u.email as "customerEmail",
  u.first_name as "firstName",
  u.last_name as "lastName",
  u.street as "customerStreet",
  u.zip_code as "customerZipCode",
  u.city as "customerCity",
  CASE 
    WHEN u.street IS NULL OR u.street = '' THEN 'KEINE STRASSE'
    WHEN u.city IS NULL OR u.city = '' THEN 'KEINE STADT'
    ELSE 'HAT ADRESSE'
  END as "adressStatus"
FROM "TireRequest" tr
JOIN "Customer" c ON tr.customer_id = c.id
JOIN "User" u ON c.user_id = u.id
WHERE tr.latitude IS NULL OR tr.longitude IS NULL
ORDER BY tr.created_at DESC;

-- 4. Nur die mit vollständiger Adresse (Geocoding-Fehler)
SELECT 
  tr.id,
  tr.created_at as "createdAt",
  u.email,
  u.street,
  u.zip_code as "zipCode",
  u.city
FROM "TireRequest" tr
JOIN "Customer" c ON tr.customer_id = c.id
JOIN "User" u ON c.user_id = u.id
WHERE (tr.latitude IS NULL OR tr.longitude IS NULL)
  AND u.street IS NOT NULL 
  AND u.street != ''
  AND u.city IS NOT NULL
  AND u.city != ''
ORDER BY tr.created_at DESC;

-- 5. Statistik: Grund für fehlende Geo-Daten
SELECT 
  CASE 
    WHEN u.street IS NULL OR u.street = '' THEN 'Keine Straße im Profil'
    WHEN u.city IS NULL OR u.city = '' THEN 'Keine Stadt im Profil'
    WHEN u.zip_code IS NULL OR u.zip_code = '' THEN 'Keine PLZ im Profil'
    ELSE 'Geocoding fehlgeschlagen (Adresse vorhanden)'
  END as grund,
  COUNT(*) as anzahl
FROM "TireRequest" tr
JOIN "Customer" c ON tr.customer_id = c.id
JOIN "User" u ON c.user_id = u.id
WHERE tr.latitude IS NULL OR tr.longitude IS NULL
GROUP BY grund
ORDER BY anzahl DESC;
