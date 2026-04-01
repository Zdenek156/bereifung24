const bcrypt = require('bcryptjs');
bcrypt.hash('GoogleReview2026!', 10).then(h => {
  console.log('HASH:' + h);
});
