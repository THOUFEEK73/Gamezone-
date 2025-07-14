import PDFDocument from 'pdfkit';
import Order from '../models/orderModel.js';
import Address from '../models/addressModel.js';
import { getActiveOffers } from '../utils/offerUtils.js';

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

    const activeOffers = await getActiveOffers();
    order.items = order.items.map(item => {
      const product = item.productId;
      if (!product) return item;

      const productOffer = activeOffers.find(offer =>
        offer.offerType === 'product' &&
        offer.items.includes(product._id.toString())
      );
      const categoryOffer = activeOffers.find(offer =>
        offer.offerType === 'category' &&
        offer.items.includes(product.category?.toString())
      );

      const bestOffer = [productOffer, categoryOffer]
        .filter(Boolean)
        .sort((a, b) => b.discountPercentage - a.discountPercentage)[0];

      if (bestOffer) {
        item.originalPrice = product.price;
        item.discountPercentage = bestOffer.discountPercentage;
        item.discountedPrice = Math.round(product.price * (1 - bestOffer.discountPercentage / 100));
        item.offerName = bestOffer.offerName;
      } else {
        item.originalPrice = product.price;
        item.discountedPrice = product.price;
        item.discountPercentage = null;
        item.offerName = null;
      }
      return item;
    });

    const discountedTotal = order.items.reduce((sum, item) => {
      return sum + ((item.discountedPrice || 0) * (item.quantity || 1));
    }, 0);

    // Coupon discount (from order.discount or order.couponDiscount)
    const couponDiscount = order.discount || 0;

    // Offer savings (from offers)
    const offerSavings = order.items.reduce((sum, item) => {
      return sum + ((item.originalPrice - item.discountedPrice) * (item.quantity || 1));
    }, 0);

    // Subtotal (before any discounts)
    const subtotal = order.items.reduce((sum, item) => {
      return sum + ((item.originalPrice || item.discountedPrice || 0) * (item.quantity || 1));
    }, 0);

    // Grand total (after all discounts)
    const grandTotal = discountedTotal - couponDiscount;

    // Create PDF with better page setup
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      bufferPages: true
    });
    
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);
      res.send(pdfData);
    });

    // Page dimensions
    const pageWidth = doc.page.width;
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);

    // Colors
    const primaryColor = '#2c3e50';
    const secondaryColor = '#34495e';
    const accentColor = '#3498db';
    const lightGray = '#ecf0f1';
    const darkGray = '#7f8c8d';

    // Header Section
    doc.rect(margin, margin, contentWidth, 80)
       .fillAndStroke(primaryColor, primaryColor);
    
    doc.fontSize(28)
       .fillColor('white')
       .text('INVOICE', margin + 20, margin + 20, { align: 'left' });
    
    doc.fontSize(16)
       .fillColor('white')
       .text('GameZone', margin + 20, margin + 50);

    // Company info (right side of header)
    doc.fontSize(12)
       .fillColor('white')
       .text('GameZone Store', pageWidth - margin - 150, margin + 20, { width: 130, align: 'right' })
       .text('434 Gaming Street', pageWidth - margin - 150, margin + 35, { width: 130, align: 'right' })
       .text('City, State 691305', pageWidth - margin - 150, margin + 50, { width: 130, align: 'right' })
       .text('Phone: (91) 7306571134 ', pageWidth - margin - 150, margin + 65, { width: 130, align: 'right' });

    doc.moveDown(3);

    // Invoice Details Section
    const invoiceDetailsY = doc.y + 20;
    
    // Left side - Order Info
    doc.fontSize(14)
       .fillColor(secondaryColor)
       .text('Order Information', margin, invoiceDetailsY, { underline: true });
    
    doc.fontSize(12)
       .fillColor('black')
       .text(`Order ID: ${order._id}`, margin, invoiceDetailsY + 25)
       .text(`Order Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { 
         year: 'numeric', 
         month: 'long', 
         day: 'numeric' 
       }) : '-'}`, margin, invoiceDetailsY + 45)
       .text(`Invoice Date: ${new Date().toLocaleDateString('en-US', { 
         year: 'numeric', 
         month: 'long', 
         day: 'numeric' 
       })}`, margin, invoiceDetailsY + 65);

    // Right side - Customer Info
    doc.fontSize(14)
       .fillColor(secondaryColor)
       .text('Customer Information', pageWidth - margin - 200, invoiceDetailsY, { underline: true });
    
    doc.fontSize(12)
       .fillColor('black')
       .text(`Name: ${order.userId?.name || '-'}`, pageWidth - margin - 200, invoiceDetailsY + 25)
       .text(`Email: ${order.userId?.email || '-'}`, pageWidth - margin - 200, invoiceDetailsY + 45);

    doc.moveDown(4);

    // Shipping Address Section
    const shippingY = doc.y + 20;
    doc.fontSize(14)
       .fillColor(secondaryColor)
       .text('Shipping Address', margin, shippingY, { underline: true });
    
    const addr = order.shippingAddress;
    if (addr) {
      doc.fontSize(12)
         .fillColor('black')
         .text(`${addr.name || '-'}`, margin, shippingY + 25)
         .text(`${addr.phone || '-'}`, margin, shippingY + 45)
         .text(`${addr.city || '-'}, ${addr.state || '-'} - ${addr.zipCode || '-'}`, margin, shippingY + 65)
         .text(`${addr.country || '-'}`, margin, shippingY + 85);
    } else {
      doc.fontSize(12)
         .fillColor('black')
         .text('No address information available.', margin, shippingY + 25);
    }

    doc.moveDown(4);

    // Items Table
    const tableTop = doc.y + 20;
    
    // Table header background
    doc.rect(margin, tableTop, contentWidth, 35)
       .fillAndStroke(lightGray, lightGray);

    // Table column positions (better spacing)
    const colProduct = margin + 10;
    const colQty = margin + 250;
    const colPrice = margin + 320;
    const colDiscount = margin + 390;
    const colTotal = margin + 460;

    // Table Headers
    doc.fontSize(12)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text('Product', colProduct, tableTop + 12)
       .text('Qty', colQty, tableTop + 12, { width: 60, align: 'center' })
       .text('Price', colPrice, tableTop + 12, { width: 60, align: 'right' })
       .text('Discount', colDiscount, tableTop + 12, { width: 60, align: 'right' })
       .text('Total', colTotal, tableTop + 12, { width: 80, align: 'right' });

    // Table rows
    let currentY = tableTop + 35;
    doc.font('Helvetica');
    
    order.items.forEach((item, index) => {
      // Alternate row colors
      if (index % 2 === 0) {
        doc.rect(margin, currentY, contentWidth, 30)
           .fillAndStroke('#f8f9fa', '#f8f9fa');
      }

      doc.fontSize(11)
         .fillColor('black');

      // Product name (with text wrapping)
      const productName = item.productTitle || (item.productId?.name || '-');
      doc.text(productName, colProduct, currentY + 8, { 
        width: 220,
        height: 20,
        ellipsis: true
      });

      // Quantity
      doc.text(
        item.quantity?.toString() || '-',
        colQty,
        currentY + 8,
        { width: 60, align: 'center' }
      );

      // Original Price
      const originalPrice = item.originalPrice !== undefined ? item.originalPrice : item.discountedPrice || 0;
      doc.text(
        `rs ${originalPrice.toLocaleString()}`,
        colPrice,
        currentY + 8,
        { width: 60, align: 'right' }
      );

      // Discount
      const discountText = item.discountPercentage != null ? `${item.discountPercentage}%` : '-';
      doc.fillColor(item.discountPercentage > 0 ? '#e74c3c' : 'black')
         .text(discountText, colDiscount, currentY + 8, { width: 60, align: 'right' });

      // Total
      const itemTotal = item.discountedPrice && item.quantity ? item.discountedPrice * item.quantity : 0;
      doc.fillColor('black')
         .text(`rs ${itemTotal.toLocaleString()}`, colTotal, currentY + 8, { width: 80, align: 'right' });

      currentY += 30;
    });

    // Table bottom border
    doc.moveTo(margin, currentY)
       .lineTo(margin + contentWidth, currentY)
       .stroke();

    // Summary Section
    const summaryY = currentY + 20;
    const summaryX = margin + contentWidth - 200;

    // Summary background
    doc.rect(summaryX, summaryY, 200, 100)
       .fillAndStroke('#f8f9fa', '#e9ecef');

    // Subtotal
    doc.fontSize(12)
       .fillColor('black')
       .text(`Subtotal: rs ${subtotal.toLocaleString()}`, summaryX + 10, summaryY + 10, { align: 'right', width: 180 });

    // Offer Savings
    if (offerSavings > 0) {
      doc.fillColor('#27ae60')
         .text(`Offer Savings: -rs ${offerSavings.toLocaleString()}`, summaryX + 10, summaryY + 30, { align: 'right', width: 180 });
    }

    // Coupon Discount
    if (couponDiscount > 0) {
      doc.fillColor('#27ae60')
         .text(`Coupon Discount: -rs ${couponDiscount.toLocaleString()}`, summaryX + 10, summaryY + 50, { align: 'right', width: 180 });
    }

    // Grand Total
    doc.fontSize(14)
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .text(`Total: rs ${grandTotal.toLocaleString()}`, summaryX + 10, summaryY + 70, { align: 'right', width: 180 });

    // Footer
    doc.moveDown(4);
    const footerY = doc.y + 40;
    
    // Footer background
    doc.rect(margin, footerY, contentWidth, 40)
       .fillAndStroke(lightGray, lightGray);

    doc.fontSize(12)
       .fillColor(darkGray)
       .font('Helvetica')
       .text('Thank you for shopping with GameZone!', margin, footerY + 10, { align: 'center', width: contentWidth })
       .text('Visit us at www.gamezone.com for more amazing deals!', margin, footerY + 25, { align: 'center', width: contentWidth });

    // Add page numbers if multiple pages
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(10)
         .fillColor(darkGray)
         .text(`Page ${i + 1} of ${range.count}`, margin, doc.page.height - 50, { align: 'center', width: contentWidth });
    }

    doc.end();

  } catch (error) {
    console.error('Invoice generation failed:', error);
    res.status(500).send('Error generating invoice: ' + error.message);
  }
};

export default generateInvoice;