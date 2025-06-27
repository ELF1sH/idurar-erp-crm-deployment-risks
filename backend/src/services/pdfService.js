const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const generatePdf = async (invoiceId, htmlContent) => {
  const outputDir = process.env.PDF_OUTPUT_DIR || './pdf-storage';

  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, `${invoiceId}.pdf`);

    const tempHtmlPath = path.join(outputDir, `${invoiceId}.html`);
    fs.writeFileSync(tempHtmlPath, htmlContent);

    // Конвертация HTML в PDF
    execSync(`wkhtmltopdf ${tempHtmlPath} ${filePath}`);
    fs.unlinkSync(tempHtmlPath);

    console.log(`PDF успешно создан: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`Ошибка при генерации PDF: ${error}`);
    throw error;
  }
};

module.exports = {
  generatePdf,
};
