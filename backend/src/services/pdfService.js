const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Функция генерации PDF с помощью wkhtmltopdf (более простой подход)
const generatePdf = async (invoiceId, htmlContent) => {
  const outputDir = process.env.PDF_OUTPUT_DIR || './pdf-storage';

  try {
    // Создаем директорию, если её нет
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Создана директория: ${outputDir}`);
    }

    const filePath = path.join(outputDir, `${invoiceId}.pdf`);
    console.log(`Генерация PDF в: ${filePath}`);

    // Сначала сохраняем HTML во временный файл
    const tempHtmlPath = path.join(outputDir, `${invoiceId}.html`);
    fs.writeFileSync(tempHtmlPath, htmlContent);

    // Используем wkhtmltopdf для конвертации HTML в PDF
    execSync(`wkhtmltopdf ${tempHtmlPath} ${filePath}`);

    // Удаляем временный HTML-файл
    fs.unlinkSync(tempHtmlPath);

    console.log(`PDF успешно создан: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`❌ Ошибка при генерации PDF: ${error}`);
    throw error;
  }
};

module.exports = {
  generatePdf,
};
