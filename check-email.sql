SELECT u.email, u."firstName", u."lastName" FROM freelancers f JOIN users u ON f."userId" = u.id LIMIT 1;
