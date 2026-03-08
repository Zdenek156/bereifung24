UPDATE freelancers SET stripe_account_id = NULL, stripe_enabled = false WHERE id = (SELECT id FROM freelancers LIMIT 1);
