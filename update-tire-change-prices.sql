-- Update TIRE_CHANGE service with correct prices
UPDATE workshop_services 
SET "basePrice" = 40.00,
    "basePrice4" = 70.00,
    "runFlatSurcharge" = 10.00,
    "disposalFee" = 5.00,
    "durationMinutes" = 30,
    "durationMinutes4" = 50
WHERE "serviceType" = 'TIRE_CHANGE' AND "workshopId" = 'cml3g7rxd000ckeyn9ypqgg65';

-- Show updated record
SELECT "serviceType", "basePrice", "basePrice4", "durationMinutes" 
FROM workshop_services 
WHERE "serviceType" = 'TIRE_CHANGE' AND "workshopId" = 'cml3g7rxd000ckeyn9ypqgg65';
