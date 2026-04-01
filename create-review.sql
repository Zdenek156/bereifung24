INSERT INTO users (id, email, password, "firstName", "lastName", role, "emailVerified", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'review@bereifung24.de', '$2a$10$DY7iNobsVmwnGeUsBMRXr.07sHHQP0sUxRiMxXq3YPgCmLZc2NPva', 'Google', 'Reviewer', 'USER', NOW(), NOW(), NOW());
