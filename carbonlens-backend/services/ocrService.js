const Tesseract = require('tesseract.js');
const path = require('path');

/**
 * Extract raw text from an image file using Tesseract OCR.
 */
const extractTextFromFile = async (filePath) => {
  const absolute = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
  const {
    data: { text }
  } = await Tesseract.recognize(absolute, 'eng', {
    logger: () => {}
  });
  return text || '';
};

module.exports = { extractTextFromFile };
