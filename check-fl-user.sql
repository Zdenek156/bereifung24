SELECT u.id, u.email, u.role, f.id as freelancer_id, f.status as fl_status
FROM users u
LEFT JOIN freelancers f ON f."userId" = u.id
WHERE u.email = 'zdenek.bereifung24@gmail.com';
