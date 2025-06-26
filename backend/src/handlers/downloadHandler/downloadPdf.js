const custom = require('@/controllers/pdfController');
const mongoose = require('mongoose');
const path = require('path'); // Добавлено для работы с путями к файлу

module.exports = downloadPdf = async (req, res, { directory, id }) => {
  try {
    const modelName = directory.charAt(0).toUpperCase() + directory.slice(1);

    if (mongoose.models[modelName]) {
      const Model = mongoose.model(modelName);
      const result = await Model.findOne({
        _id: id,
      }).exec();

      // Выбрасываем ошибку, если нет результата
      if (!result) {
        throw { name: 'ValidationError' };
      }

      // Проверяем, существует ли PDF для данного документа
      if (!result.pdf) {
        return res.status(404).json({
          success: false,
          result: null,
          message: 'PDF not found for this document.',
        });
      }

      // Получаем имя PDF-файла
      const pdfFileName = result.pdf; // Это имя файла PDF (предполагается, что оно там хранится)
      const pdfDirectory = process.env.PDF_STORAGE_PATH; // Путь к директории
      const fullPath = path.join(pdfDirectory, pdfFileName); // Полный путь к файлу

      // Загружаем PDF-файл
      return res.download(fullPath, (error) => {
        if (error) {
          return res.status(500).json({
            success: false,
            result: null,
            message: "Couldn't find file",
            error: error.message,
          });
        }
      });
    } else {
      return res.status(404).json({
        success: false,
        result: null,
        message: `Model '${modelName}' does not exist`,
      });
    }
  } catch (error) {
    // Если ошибка возникает из-за валидации Mongoose
    if (error.name == 'ValidationError') {
      return res.status(400).json({
        success: false,
        result: null,
        error: error.message,
        message: 'Required fields are not supplied',
      });
    } else if (error.name == 'BSONTypeError') {
      // Если ошибка возникает из-за недопустимого ID
      return res.status(400).json({
        success: false,
        result: null,
        error: error.message,
        message: 'Invalid ID',
      });
    } else {
      // Серверная ошибка
      return res.status(500).json({
        success: false,
        result: null,
        error: error.message,
        message: error.message,
        controller: 'downloadPDF.js',
      });
    }
  }
};
