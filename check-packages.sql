SELECT sp.id, sp."packageType", sp.name, sp.price, sp."durationMinutes", ws."serviceType"
FROM service_packages sp
JOIN workshop_services ws ON sp."serviceId" = ws.id
WHERE ws."workshopId" = 'cml3g7rxd000ckeyn9ypqgg65'
ORDER BY ws."serviceType", sp."packageType";
