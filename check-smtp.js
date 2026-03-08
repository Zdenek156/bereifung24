const {PrismaClient} = require('./node_modules/.prisma/client')
const p = new PrismaClient()
p.apiSetting.findMany({where:{key:{startsWith:'EMAIL'}}}).then(r => {
  r.forEach(s => console.log(s.key, '=', s.value))
  p.$disconnect()
}).catch(e => { console.error(e); p.$disconnect() })
