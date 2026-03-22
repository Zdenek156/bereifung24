const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  try {
    const logs = await p.pushNotificationLog.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
    console.log('=== PUSH LOGS ===');
    logs.forEach(l => console.log(JSON.stringify({ id: l.id, title: l.title, status: l.status, error: l.error, userId: l.userId, createdAt: l.createdAt })));

    const users = await p.user.findMany({ where: { fcmToken: { not: null } }, select: { id: true, email: true, fcmToken: true } });
    console.log('=== FCM USERS ===');
    users.forEach(u => console.log(JSON.stringify({ id: u.id, email: u.email, tokenStart: u.fcmToken ? u.fcmToken.substring(0, 30) : null })));

    const feedbacks = await p.appFeedback.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
    console.log('=== FEEDBACKS ===');
    feedbacks.forEach(f => console.log(JSON.stringify(f)));

    console.log('=== ENV CHECK ===');
    console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID || 'NOT SET');
    console.log('FIREBASE_SERVICE_ACCOUNT:', process.env.FIREBASE_SERVICE_ACCOUNT ? 'SET (' + process.env.FIREBASE_SERVICE_ACCOUNT.length + ' chars)' : 'NOT SET');
  } catch (e) {
    console.error('ERROR:', e.message);
  }
  await p.$disconnect();
})();
