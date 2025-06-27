const CircuitBreaker = require('opossum');
const Outbox = require('@/models/appModels/Outbox');
const logger = require("@/utils/logger");

const breaker = (originalFunction) => {
  const options = {
    timeout: 7000,                // максимальное время выполнения
    errorThresholdPercentage: 50, // если >50% ошибок - разрываем цепь
    resetTimeout: 30000,          // через 30 секунд пробуем снова
  };

  const circuitBreaker = new CircuitBreaker(originalFunction, options);

  circuitBreaker.fallback(async (params) => {
    console.warn('Сервис почты недоступен, сохраняем в outbox...');

    logger.info('[cb] Mail service is not available, saving in outbox')
    logger.debug('[cb] Mail service is not available, saving in outbox', {
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

    logger.info('[cb] The email from circuit breaker has been successfully sent');
    logger.debug('[cb] The email from circuit breaker has been successfully sent', {
      result,
    });
  });

  circuitBreaker.on('failure', (error) => {
    console.error('Circuit Breaker: Операция зафейлилась', error);

    logger.error(`[cb] Circuit Breaker's operation has been failed`, { error });
  });

  circuitBreaker.on('timeout', (error) => {
    console.error('Circuit Breaker: Время истекло', error);

    logger.error(`[cb] Timeout has been run out. Switching to fallback...`, { error });
  });

  circuitBreaker.on('open', (info) => {
    console.warn('Circuit Breaker: CB открыт - сервис недоступен');

    logger.error(`[cb] The email service in unavailable`, { info });
  });

  circuitBreaker.on('close', (info) => {
    console.log('Circuit Breaker: CB закрыт - сервис доступен');

    logger.info(`[cb] The email service has become available`);
    logger.debug(`[cb] The email service has become available`, { info });
  });

  return circuitBreaker;
};

module.exports = breaker;