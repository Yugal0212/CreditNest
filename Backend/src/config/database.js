const { PrismaClient } = require('@prisma/client');

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

const globalForPrisma = globalThis;
const prismaClientInstance = globalForPrisma.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaGlobal = prismaClientInstance;
}

// A robust casting utility to ensure any string IDs/foreign keys are cast to Int for PostgreSQL
const castKeys = ['id', 'userId', 'shopId', 'customerId', 'transactionId', 'productId'];

function castStringIdsToInt(obj) {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    return obj.map(castStringIdsToInt);
  }
  if (typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (castKeys.includes(key) && typeof val === 'string' && /^\d+$/.test(val)) {
          newObj[key] = parseInt(val, 10);
        } else if (castKeys.includes(key) && typeof val === 'object' && val !== null) {
          // Handle operators: e.g. id: { in: ['1', '2'] } or id: { not: '3' }
          const newVal = {};
          for (const op in val) {
            if (Object.prototype.hasOwnProperty.call(val, op)) {
              const opVal = val[op];
              if (Array.isArray(opVal)) {
                newVal[op] = opVal.map(item => (typeof item === 'string' && /^\d+$/.test(item) ? parseInt(item, 10) : item));
              } else if (typeof opVal === 'string' && /^\d+$/.test(opVal)) {
                newVal[op] = parseInt(opVal, 10);
              } else {
                newVal[op] = castStringIdsToInt(opVal);
              }
            }
          }
          newObj[key] = newVal;
        } else {
          newObj[key] = castStringIdsToInt(val);
        }
      }
    }
    return newObj;
  }
  return obj;
}

const prisma = prismaClientInstance.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (args) {
          if (args.where) {
            args.where = castStringIdsToInt(args.where);
          }
          if (args.data) {
            args.data = castStringIdsToInt(args.data);
          }
          if (args.cursor) {
            args.cursor = castStringIdsToInt(args.cursor);
          }
        }
        return query(args);
      }
    }
  }
});

module.exports = prisma;
