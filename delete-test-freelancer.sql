-- Check if user has customer profile
SELECT u.id, u.email, u.role, c.id as customer_id
FROM users u
LEFT JOIN customers c ON c."userId" = u.id
WHERE u.id = 'cmi99vhg40001u31qry61f04g';

-- Delete freelancer record
DELETE FROM freelancers WHERE id = 'cmmes9n9s0ooy588348ofyn97';

-- Restore user role to CUSTOMER
UPDATE users SET role = 'CUSTOMER' WHERE id = 'cmi99vhg40001u31qry61f04g';
