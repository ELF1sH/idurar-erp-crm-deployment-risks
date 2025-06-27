require('dotenv').config();
require('module-alias/register');

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const loadAllModels = () => {
  const modelsDir = path.join(__dirname, '../models/appModels');

  fs.readdirSync(modelsDir).forEach((file) => {
    if (file.endsWith('.js')) {
      require(path.join(modelsDir, file));
    }
  });
};

loadAllModels();

const pdfQueue = require('../queues/pdfQueue');
const { generatePdf } = require('../services/pdfService');
const Invoice = mongoose.model('Invoice');

mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Worker подключен к MongoDB');
  })
  .catch((err) => console.error('Ошибка подключения к MongoDB:', err));

// Обработка очереди
pdfQueue.process(async (job, done) => {
  const { invoiceId } = job.data;
  console.log('Получена задача для invoice:', invoiceId);

  try {
    const invoice = await Invoice.findById(invoiceId).populate('client').exec();

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    console.log('Invoice найден:', invoice._id);

    const html = `
      <h1>Invoice #${invoice.number || 'No Number'}</h1>
      <p>Customer: ${invoice.client ? invoice.client.name : 'N/A'}</p>
      <p>Date: ${new Date(invoice.created).toLocaleDateString()}</p>
      <p>Total: ${invoice.total || 0}</p>
    `;

    const filePath = await generatePdf(invoiceId, html);

    await Invoice.findByIdAndUpdate(invoiceId, { pdf: path.basename(filePath) });

    console.log(`PDF создан и привязан к invoice: ${filePath}`);
    done(null, { success: true, filePath });
  } catch (err) {
    console.error('Ошибка генерации PDF:', err);
    done(err);
  }
});

pdfQueue.on('failed', (job, err) => {
  console.error(`Задача ${job.id} провалилась:`, err.message);
});

pdfQueue.on('ready', () => {
  console.log('PDF Worker готов к обработке задач');
});

pdfQueue.on('error', (err) => {
  console.error('Ошибка очереди:', err);
});
