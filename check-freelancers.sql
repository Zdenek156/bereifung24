SELECT f.id, f."userId", u.email, u.role, u."firstName", u."lastName"
FROM freelancers f
JOIN users u ON f."userId" = u.id;
