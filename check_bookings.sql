SELECT id, "appointmentDate", "appointmentTime", status, "googleEventId", "createdAt" 
FROM bookings 
ORDER BY "createdAt" DESC 
LIMIT 5;
