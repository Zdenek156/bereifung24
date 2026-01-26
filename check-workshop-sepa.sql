-- Check latest invoice and workshop SEPA status
SELECT 
  ci.id AS invoice_id,
  ci."invoiceNumber" AS invoice_number,
  w.id AS workshop_id,
  w."companyName" AS workshop_name,
  w."sepaMandateId" AS sepa_mandate_id,
  w."sepaMandateStatus" AS sepa_mandate_status,
  w."sepaMandateReference" AS sepa_mandate_reference
FROM commission_invoices ci
JOIN workshops w ON w.id = ci."workshopId"
ORDER BY ci.created_at DESC
LIMIT 1;
