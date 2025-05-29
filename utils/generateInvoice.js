import puppeteer from 'puppeteer';
import ejs from 'ejs';
import path from 'path';
import Order from '../models/orderModel.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate('userId')
      .populate('items.productId')
      .populate('shippingAddress');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get absolute path to template
    const templatePath = path.join(__dirname, '..', 'views', 'user', 'invoiceTemplate.ejs');
    
    // Render EJS template
    const html = await ejs.renderFile(templatePath, { 
      order,
      formatDate: (date) => new Date(date).toLocaleDateString()
    });

    // Launch puppeteer with specific configurations
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    // Set response headers and send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Invoice generation failed:', error);
    res.status(500).send('Error generating invoice: ' + error.message);
  }
};

export default generateInvoice;