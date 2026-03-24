-- TIRE_CHANGE rim-size pricing for Mühling
SELECT tcp.* FROM tire_change_pricing_by_size tcp
JOIN workshops w ON tcp.workshop_id = w.id
JOIN workshop_landing_pages wlp ON wlp."workshopId" = w.id
WHERE wlp.slug = 'reifenservice-muehling' AND tcp.is_active = true
ORDER BY tcp.rim_size;

-- All service packages for Mühling
SELECT sp."packageType", sp.name, sp.price, sp."durationMinutes", sp."isActive", ws."serviceType"
FROM service_packages sp
JOIN workshop_services ws ON sp."workshopServiceId" = ws.id
JOIN workshops w ON ws."workshopId" = w.id
JOIN workshop_landing_pages wlp ON wlp."workshopId" = w.id
WHERE wlp.slug = 'reifenservice-muehling' AND sp."isActive" = true
ORDER BY ws."serviceType", sp.price;

-- Base prices for all services
SELECT ws."serviceType", ws."basePrice", ws."basePrice4", ws."durationMinutes", ws."durationMinutes4"
FROM workshop_services ws
JOIN workshops w ON ws."workshopId" = w.id
JOIN workshop_landing_pages wlp ON wlp."workshopId" = w.id
WHERE wlp.slug = 'reifenservice-muehling' AND ws."isActive" = true;
