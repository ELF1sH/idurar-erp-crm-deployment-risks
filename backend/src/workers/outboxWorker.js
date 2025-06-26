const cron = require('node-cron');
const OutboxProcessor = require('@/services/outboxProcessor');

cron.schedule('*/5 * * * *', async () => {
  console.log('Начинаем обработку outbox...');
  await OutboxProcessor();
});