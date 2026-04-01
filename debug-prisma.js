const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
console.log('Has legalText:', 'legalText' in p);
const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(p));
console.log('Legal keys:', keys.filter(k => k.toLowerCase().includes('legal')));
console.log('All model-like keys:', keys.filter(k => !k.startsWith('_') && !k.startsWith('$')));
p.$disconnect();
