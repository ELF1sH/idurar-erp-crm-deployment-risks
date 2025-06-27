const mongoose = require('mongoose');
const path = require('path');

module.exports = downloadPdf = async (req, res, { directory, id }) => {
  try {
    const modelName = directory.charAt(0).toUpperCase() + directory.slice(1);

    if (mongoose.models[modelName]) {
      const Model = mongoose.model(modelName);
      const result = await Model.findOne({
        _id: id,
      }).exec();

      if (!result) {
        throw { name: 'ValidationError' };
      }

      if (!result.pdf) {
        return res.status(404).json({
          success: false,
          result: null,
          message: 'PDF not found for this document.',
        });
      }

      const pdfFileName = result.pdf;
      const pdfDirectory = process.env.PDF_STORAGE_PATH;
      const fullPath = path.join(pdfDirectory, pdfFileName);

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
    if (error.name == 'ValidationError') {
      return res.status(400).json({
        success: false,
        result: null,
        error: error.message,
        message: 'Required fields are not supplied',
      });
    } else if (error.name == 'BSONTypeError') {
      return res.status(400).json({
        success: false,
        result: null,
        error: error.message,
        message: 'Invalid ID',
      });
    } else {
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
