-- Check latest commission invoice fields
SELECT 
  id, 
  "invoiceNumber", 
  "subtotalAmount", 
  "vatAmount", 
  "totalAmount", 
  "periodStart", 
  "periodEnd",
  "workshopId"
FROM commission_invoices 
ORDER BY created_at DESC 
LIMIT 1;
