-- Get all service packages for Luxus24 workshop
SELECT 
    ws."serviceType",
    sp."packageType",
    sp.name,
    sp.price,
    sp."durationMinutes",
    sp."isActive"
FROM service_packages sp
JOIN workshop_services ws ON sp."workshopServiceId" = ws.id
WHERE ws."workshopId" = 'cml3g7rxd000ckeyn9ypqgg65'
ORDER BY ws."serviceType", sp."packageType";
