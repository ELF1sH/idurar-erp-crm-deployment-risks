const Outbox = require('@/models/appModels/Outbox');
const sendMail = require("@/services/sendMail");
const mongoose = require('mongoose');

class OutboxProcessor {
  constructor() {
    this.isProcessing = false;
    this.maxAttempts = 3;
    this.batchSize = 10;
  }

  async processOutbox() {
    if (mongoose.connection.readyState !== 1) {
      return;
    }

    if (this.isProcessing) {
      console.log('Outbox уже обрабатывается, пропускаем...');
      return;
    }

    try {
      this.isProcessing = true;
      console.log('Начинаем обработку outbox...');

      const pendingEmails = await Outbox.find({
        status: 'pending',
        attempts: { $lt: this.maxAttempts }
      }).limit(this.batchSize);

      console.log(`Найдено ${pendingEmails.length} писем в обработке`);

      for (const email of pendingEmails) {
        try {
          await sendMail({
            email: email.email,
            name: email.name,
            subject: email.subject,
            link: email.link,
            type: email.type,
            htmlContent: email.htmlContent
          });

          await Outbox.findByIdAndUpdate(email._id, {
            status: 'processed',
            lastAttempt: new Date()
          });

          console.log(`Письмо ${email._id} успешно обработано`);

        } catch (error) {
          console.error(`Ошибка обработки письма ${email._id}:`, error);

          await Outbox.findByIdAndUpdate(email._id, {
            attempts: email.attempts + 1,
            lastAttempt: new Date(),
            error: error.message,
            status: email.attempts >= (this.maxAttempts - 1) ? 'failed' : 'pending'
          });
        }
      }

    } catch (error) {
      console.error('Ошибка с обработкой:', error);
    } finally {
      this.isProcessing = false;
      console.log('Процесс обработки закончен');
    }
  }

  // лучше использовать интервал побольше, но чтоб не сидеть пока тестируем, будет так
  static startProcessing(interval = 20 * 1000) {
    const processor = new OutboxProcessor();
    setInterval(() => processor.processOutbox(), interval);
    processor.processOutbox();
  }
}

module.exports = OutboxProcessor;