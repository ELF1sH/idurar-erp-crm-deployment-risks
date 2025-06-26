const mongoose = require('mongoose');
const Model = mongoose.model('Invoice');

const { calculate } = require('@/helpers');
const { increaseBySettingKey } = require('@/middlewares/settings');
const schema = require('./schemaValidate');

const pdfQueue = require('@/queues/pdfQueue'); // подключаем очередь

const create = async (req, res) => {
  let body = req.body;

  const { error, value } = schema.validate(body);
  if (error) {
    const { details } = error;
    return res.status(400).json({
      success: false,
      result: null,
      message: details[0]?.message,
    });
  }

  const { items = [], taxRate = 0, discount = 0 } = value;

  // default
  let subTotal = 0;
  let taxTotal = 0;
  let total = 0;

  // Вычисление стоимости всех товаров
  items.forEach((item) => {
    let itemTotal = calculate.multiply(item['quantity'], item['price']);
    subTotal = calculate.add(subTotal, itemTotal);
    item['total'] = itemTotal;
  });

  taxTotal = calculate.multiply(subTotal, taxRate / 100);
  total = calculate.add(subTotal, taxTotal);

  body['subTotal'] = subTotal;
  body['taxTotal'] = taxTotal;
  body['total'] = total;
  body['items'] = items;

  let paymentStatus = calculate.sub(total, discount) === 0 ? 'paid' : 'unpaid';
  body['paymentStatus'] = paymentStatus;
  body['createdBy'] = req.admin._id;

  // Создаём документ
  const result = await new Model(body).save();

  // Переход на асинхронную генерацию PDF через очередь
  try {
    await pdfQueue.add(
      { invoiceId: result._id.toString() },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );
  } catch (err) {
    console.error('Не удалось поставить задачу генерации PDF в очередь:', err);
  }

  // Увеличиваем номер счёта
  increaseBySettingKey({
    settingKey: 'last_invoice_number',
  });

  // Отправляем ответ пользователю сразу
  return res.status(200).json({
    success: true,
    result,
    message: 'Счёт создан. PDF будет сгенерирован автоматически.',
  });
};

module.exports = create;
