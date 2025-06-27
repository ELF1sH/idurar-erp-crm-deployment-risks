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

  circuitBreaker.on('success', async () => {
    console.log('Письмо успешно отправлено');
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