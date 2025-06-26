const CircuitBreaker = require('opossum');
const Outbox = require('@/models/appModels/Outbox');

const breaker = (originalFunction) => {
  const options = {
    timeout: 7000,                // максимальное время выполнения
    errorThresholdPercentage: 50, // если >50% ошибок - разрываем цепь
    resetTimeout: 30000,          // через 30 секунд пробуем снова
  };

  const circuitBreaker = new CircuitBreaker(originalFunction, options);

  circuitBreaker.fallback(async (params) => {
    console.warn('Сервис почты недоступен, сохраняем в outbox...');

    console.log({
      email: params.email,
      name: params.name,
      subject: params.subject,
      link: params.link,
      type: params.type,
      htmlContent: params.htmlContent,
      status: 'pending',
      attempts: 0,
      lastAttempt: new Date()
    })

    return await Outbox.create({
      email: params.email,
      name: params.name,
      subject: params.subject,
      link: params.link,
      type: params.type,
      htmlContent: params.htmlContent,
      status: 'pending',
      attempts: 0,
      lastAttempt: new Date()
    });
  });

  circuitBreaker.on('success', async (result) => {
    console.log('Письмо успешно отправлено');
    // console.log('result', result)
    //
    // try {
    //   const meta = result.meta;
    //
    //   if (!meta || !meta.email || !meta.subject) {
    //     console.warn('Нет данных для очистки Outbox');
    //     return;
    //   }
    //
    //   const deleted = await Outbox.deleteMany({
    //     email: meta.email,
    //     subject: meta.subject,
    //     type: meta.type || 'invoice',
    //     status: 'pending',
    //   });
    // } catch (error) {
    //   console.error('Ошибка при очистке Outbox', error);
    // }
  });

  circuitBreaker.on('failure', (error) => {
    console.error('Circuit Breaker: Операция зафейлилась', error);
  });

  circuitBreaker.on('timeout', (error) => {
    console.error('Circuit Breaker: Время истекло', error);
  });

  circuitBreaker.on('open', () => {
    console.warn('Circuit Breaker: CB открыт - сервис недоступен');
  });

  circuitBreaker.on('close', () => {
    console.log('Circuit Breaker: CB закрыт - сервис доступен');
  });

  return circuitBreaker;
};

module.exports = breaker;