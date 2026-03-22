SELECT ws.id, w."companyName", ws."pricePerTire", ws."rimSizeMin", ws."rimSizeMax", ws."serviceName"
FROM "WorkshopService" ws 
JOIN "Workshop" w ON ws."workshopId" = w.id 
WHERE ws."serviceName" = 'TIRE_CHANGE' 
LIMIT 10;
