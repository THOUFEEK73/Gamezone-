import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import Order from '../models/orderModel.js'; // adjust path as needed

// Helper: Calculate total sales excluding returned/cancelled items
function getValidOrderTotal(order) {
  if (!order.items || !Array.isArray(order.items)) return 0;
  return order.items
    .filter(item => item.status !== 'Returned' && item.status !== 'Cancelled')
    .reduce((sum, item) => sum + ((item.discountedPrice || item.originalPrice || 0) * (item.quantity || 1)), 0);
}

export const downloadSalesReportExcel = async (req, res) => {
  try {
    const { filter, from, to } = req.query;
    let matchConditions = {};
    let now = new Date();
    let dateFilter = {};

    if (filter === 'daily') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      dateFilter = { $gte: start, $lt: end };
    } else if (filter === 'weekly') {
      const start = new Date(now.setDate(now.getDate() - now.getDay()));
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      dateFilter = { $gte: start, $lt: end };
    } else if (filter === 'yearly') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      dateFilter = { $gte: start, $lt: end };
    } else if (filter === 'custom' && from && to) {
      dateFilter = { $gte: new Date(from), $lte: new Date(to) };
    }

    if (Object.keys(dateFilter).length) {
      matchConditions.createdAt = dateFilter;
    }

    const orders = await Order.find(matchConditions)
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Add items population for filtering
    await Order.populate(orders, { path: 'items.productId' });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Add header row
    worksheet.addRow([
      'Order ID', 'Date', 'Customer', 'Total', 'Status', 'Coupon', 'Discount', 'Offer Discount'
    ]);

    // Add data rows (only valid items)
    orders.forEach(order => {
      const validTotal = getValidOrderTotal(order);
      worksheet.addRow([
        order.orderId,
        order.createdAt.toLocaleDateString('en-IN'),
        order.userId?.name || 'Guest',
        validTotal,
        order.paymentStatus,
        order.coupon || '',
        order.discount || 0,
        order.offerDiscount || 0
      ]);
    });

    // Calculate total sales (excluding returned/cancelled)
    const totalSales = orders.reduce((sum, order) => sum + getValidOrderTotal(order), 0);
    worksheet.addRow([]);
    worksheet.addRow([
      '', '', 'Total Sales', totalSales, '', '', '', ''
    ]);

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Excel download error:', err);
    res.status(500).send('Failed to generate Excel');
  }
};

export const downloadSalesReportPDF = async (req, res) => {
  try {
    const { filter, from, to } = req.query;
    let matchConditions = {};
    let now = new Date();
    let dateFilter = {};

    // Filter conditions
    if (filter === 'daily') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      dateFilter = { $gte: start, $lt: end };
    } else if (filter === 'weekly') {
      const start = new Date(now.setDate(now.getDate() - now.getDay()));
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      dateFilter = { $gte: start, $lt: end };
    } else if (filter === 'yearly') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      dateFilter = { $gte: start, $lt: end };
    } else if (filter === 'custom' && from && to) {
      dateFilter = { $gte: new Date(from), $lte: new Date(to) };
    }

    if (Object.keys(dateFilter).length) {
      matchConditions.createdAt = dateFilter;
    }

    const orders = await Order.find(matchConditions)
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Add items population for filtering
    await Order.populate(orders, { path: 'items.productId' });

    // Create PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');
    doc.pipe(res);

    // Title
    doc.fontSize(18).text('Sales Report', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
    doc.moveDown(1);

    // Table Header
    doc.font('Helvetica-Bold').fontSize(10);
    const headerY = doc.y;
    doc.text('Order ID', 40, headerY);
    doc.text('Date', 105, headerY);
    doc.text('Customer', 200, headerY);
    doc.text('Total', 285, headerY);
    doc.text('Status', 340, headerY);
    doc.text('Coupon', 395, headerY);
    doc.text('Discount', 470, headerY);
    doc.text('Offer', 515, headerY);
    doc.moveTo(40, headerY + 12).lineTo(560, headerY + 12).stroke();
    doc.moveDown(1);

    // Table Rows
    doc.font('Helvetica').fontSize(9);
    orders.forEach((order, i) => {
      const rowY = doc.y;

      // Optional: Alternating row background
      if (i % 2 === 0) {
        doc.rect(40, rowY - 2, 520, 14).fillOpacity(0.05).fill('#f2f2f2').fillOpacity(1);
        doc.fillColor('black');
      }

      const formattedDate = order.createdAt.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      // Calculate valid total for this order
      const validTotal = getValidOrderTotal(order);

      doc.text(order.orderId.slice(0, 10), 40, rowY);
      doc.text(formattedDate, 105, rowY, { width: 90 });
      doc.text(order.userId?.name || 'Guest', 200, rowY, { width: 80 });
      doc.text(`RS-${validTotal}`, 285, rowY);
      doc.text(order.paymentStatus, 340, rowY);
      doc.text(order.coupon || '—', 395, rowY, { width: 70 });
      doc.text(`RS-${order.discount || 0}`, 470, rowY);
      doc.text(`RS-${order.offerDiscount || 0}`, 515, rowY);
      doc.moveDown(0.7);
    });

    // Calculate total sales (excluding returned/cancelled)
    const totalSales = orders.reduce((sum, order) => sum + getValidOrderTotal(order), 0);

    doc.moveDown(2);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#2c3e50');
    doc.text(`Total Sales: RS-${totalSales.toLocaleString('en-IN')}`, 40, doc.y, { align: 'left' });

    doc.end();
  } catch (err) {
    console.error('PDF download error:', err);
    res.status(500).send('Failed to generate PDF');
  }
};