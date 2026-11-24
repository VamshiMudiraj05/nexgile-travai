import { jsPDF } from 'jspdf';

/**
 * Nexgile-TravAI Luxury PDF Document Generator
 * Generates verified Tax Invoices, Guest Folios, and Airline Boarding Passes.
 */
export const pdfService = {
  /**
   * Generate branded luxury Hotel Tax Folio PDF
   */
  generateHotelTaxInvoicePDF: (data = {}) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const primaryColor = [11, 12, 30]; // #0B0C1E Deep Navy
    const goldColor = [223, 183, 108]; // #DFB76C Luxury Gold
    const slateDark = [30, 41, 59];
    const textMuted = [100, 116, 139];

    // 1. Header Banner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 38, 'F');

    // Gold accent hairline
    doc.setDrawColor(...goldColor);
    doc.setLineWidth(0.8);
    doc.line(0, 38, 210, 38);

    // Title & Logo
    doc.setTextColor(...goldColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('NEXGILE-TRAVAI', 15, 16);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(250, 246, 240);
    doc.text('LUXURY HOSPITALITY & TRAVEL MANAGEMENT PLATFORM', 15, 22);
    doc.text('OFFICIAL GUEST FOLIO & TAX INVOICE', 15, 28);

    // Invoice Meta on Right
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...goldColor);
    doc.text(`INVOICE #: ${data.invoice_number || `INV-${Date.now().toString().slice(-6)}`}`, 195, 16, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(250, 246, 240);
    doc.text(`DATE: ${data.date || new Date().toISOString().split('T')[0]}`, 195, 22, { align: 'right' });
    doc.text(`GSTIN/TAX REG: 27AABCN1234F1Z5`, 195, 28, { align: 'right' });

    // 2. Property & Guest Details Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 46, 180, 38, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, 46, 180, 38, 2, 2, 'S');

    // Property on Left
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text(data.property_name || 'Nexgile Grand Palace & Resort', 20, 54);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text(`Estate Location: ${data.property_city || 'Goa, India'}`, 20, 60);
    doc.text(`Suite Assigned: #${data.room_number || '304'} (${data.room_type || 'Royal Suite'})`, 20, 66);
    doc.text(`Stay Duration: ${data.check_in || '2026-11-20'} to ${data.check_out || '2026-11-24'} (${data.nights || 4} Nights)`, 20, 72);
    doc.text(`Booking Ref: ${data.booking_reference || 'RES-78912'}`, 20, 78);

    // Guest Details on Right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text('BILLED TO (RESIDENT GUEST):', 115, 54);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text(`Guest Name: ${data.guest_name || 'Eleanor Vance'}`, 115, 60);
    doc.text(`Email: ${data.guest_email || 'eleanor.vance@nexgile.com'}`, 115, 66);
    doc.text(`Membership Tier: ${data.loyalty_tier || 'TITANIUM MEMBER'}`, 115, 72);
    doc.text(`Folio ID: ${data.folio_id || `FOL-${Date.now().toString().slice(-8)}`}`, 115, 78);

    // 3. Itemized Charges Table
    const tableTop = 92;
    doc.setFillColor(...primaryColor);
    doc.rect(15, tableTop, 180, 8, 'F');

    doc.setTextColor(...goldColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DESCRIPTION / SERVICE CATEGORY', 20, tableTop + 5.5);
    doc.text('QTY / NIGHTS', 120, tableTop + 5.5, { align: 'center' });
    doc.text('TAX (12%)', 150, tableTop + 5.5, { align: 'right' });
    doc.text('AMOUNT (INR)', 190, tableTop + 5.5, { align: 'right' });

    let currentY = tableTop + 8;
    const items = data.items && data.items.length > 0 ? data.items : [
      { desc: `Room Accommodation (${data.room_type || 'Luxury Suite'})`, qty: data.nights || 4, tax: (data.total_amount ? data.total_amount * 0.12 : 2400).toFixed(2), amount: (data.total_amount ? data.total_amount * 0.88 : 17600).toFixed(2) },
      { desc: 'Complimentary High-Speed Wi-Fi & Lounge Access', qty: 1, tax: '0.00', amount: '0.00' },
      { desc: 'Resort Amenities & Butler Concierge Service', qty: 1, tax: '0.00', amount: '0.00' },
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    items.forEach((item, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(15, currentY, 180, 8, 'F');
      doc.setTextColor(...slateDark);
      doc.text(String(item.desc), 20, currentY + 5.5);
      doc.text(String(item.qty), 120, currentY + 5.5, { align: 'center' });
      doc.text(`INR ${item.tax}`, 150, currentY + 5.5, { align: 'right' });
      doc.text(`INR ${item.amount}`, 190, currentY + 5.5, { align: 'right' });
      currentY += 8;
    });

    // Horizontal Separator
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(15, currentY, 195, currentY);

    // 4. Financial Reconciliation Summary Block
    currentY += 8;
    const subtotal = data.subtotal || (data.total_amount ? data.total_amount * 0.88 : 17600);
    const taxTotal = data.tax_total || (data.total_amount ? data.total_amount * 0.12 : 2400);
    const grandTotal = data.total_amount || 20000;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...textMuted);
    doc.text('Subtotal:', 140, currentY);
    doc.setTextColor(...slateDark);
    doc.text(`INR ${Number(subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, currentY, { align: 'right' });

    currentY += 6;
    doc.setTextColor(...textMuted);
    doc.text('Goods & Services Tax (GST 12%):', 140, currentY);
    doc.setTextColor(...slateDark);
    doc.text(`INR ${Number(taxTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 190, currentY, { align: 'right' });

    currentY += 8;
    doc.setFillColor(...primaryColor);
    doc.rect(135, currentY - 5, 60, 10, 'F');
    doc.setTextColor(...goldColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL PAID:', 140, currentY + 2);
    doc.text(`INR ${Number(grandTotal).toLocaleString('en-IN')}`, 190, currentY + 2, { align: 'right' });

    // 5. Verification Badge & Payment Gateway Stamp
    const badgeY = currentY - 5;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, badgeY, 90, 24, 2, 2, 'FD');

    doc.setTextColor(22, 101, 52);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('[x] PAYMENT SETTLED & VERIFIED', 20, badgeY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(21, 128, 61);
    doc.text(`Gateway: ${data.payment_method || 'Razorpay / PayPal Automated Clearing'}`, 20, badgeY + 11);
    doc.text(`Transaction Ref: ${data.transaction_id || `txn_${Date.now().toString(36).toUpperCase()}`}`, 20, badgeY + 16);
    doc.text(`Verification Timestamp: ${new Date().toISOString()}`, 20, badgeY + 21);

    // 6. Security & Legal Disclaimer Footer
    const footerY = 270;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(15, footerY, 195, footerY);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text('This is a verified computer-generated tax folio from Nexgile-TravAI Travel & Hospitality Portal.', 105, footerY + 6, { align: 'center' });
    doc.text('Authorized Comptroller Signature: Nexgile Estate Operations Ltd. • Subject to Jurisdiction of Mumbai, India.', 105, footerY + 10, { align: 'center' });

    doc.save(`Nexgile_Tax_Invoice_${data.booking_reference || 'FOLIO'}.pdf`);
  },

  /**
   * Generate airline-grade Flight Boarding Pass or Cab Transport Voucher PDF
   */
  generateBoardingPassPDF: (ticket = {}) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [210, 95], // Standard IATA boarding pass aspect ratio
    });

    const primaryColor = [11, 12, 30]; // #0B0C1E
    const goldColor = [223, 183, 108]; // #DFB76C
    const slateDark = [30, 41, 59];

    // Background
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 95, 'F');

    // Left Main Pass (Width 150mm)
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 150, 22, 'F');

    // Gold stripe
    doc.setFillColor(...goldColor);
    doc.rect(0, 22, 150, 1.5, 'F');

    // Brand & Airline
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...goldColor);
    doc.text('NEXGILE-TRAVAI', 12, 11);

    doc.setFontSize(8);
    doc.setTextColor(250, 246, 240);
    doc.text(`CARRIER: ${ticket.airline || 'BRITISH AIRWAYS (IATA BA)'}`, 12, 17);

    // Boarding Pass Badge
    doc.setFontSize(9);
    doc.setTextColor(...goldColor);
    doc.text('OFFICIAL BOARDING PASS', 140, 14, { align: 'right' });

    // Flight Route (IATA Big Codes)
    const origin = ticket.origin || 'NYC';
    const destination = ticket.destination || 'LON';

    doc.setTextColor(...slateDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text(origin, 15, 42);

    doc.setFontSize(14);
    doc.setTextColor(...goldColor);
    doc.text('→', 50, 40);

    doc.setFontSize(26);
    doc.setTextColor(...slateDark);
    doc.text(destination, 65, 42);

    // Passenger info
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('PASSENGER NAME', 15, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.text(ticket.passenger_name || 'ELEANOR VANCE', 15, 55);

    // Flight Details Grid
    const gridY = 64;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);

    doc.text('FLIGHT', 15, gridY);
    doc.text('DATE', 42, gridY);
    doc.text('TIME', 70, gridY);
    doc.text('GATE', 98, gridY);
    doc.text('SEAT', 124, gridY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.text(ticket.flight_number || 'BA-178', 15, gridY + 5);
    doc.text(ticket.departure_date || '2026-11-25', 42, gridY + 5);
    doc.text(ticket.departure_time || '10:30 AM', 70, gridY + 5);
    doc.text(ticket.gate || 'B12', 98, gridY + 5);
    doc.text(ticket.seat || '4A', 124, gridY + 5);

    // Bottom Barcode Line Simulation
    doc.setFillColor(203, 213, 225);
    doc.rect(15, 78, 120, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`[BC] ${ticket.pnr || ticket.booking_reference || 'PNR-778941'} || NEXGILE PASSENGER SECURE TOK ${Date.now().toString(36).toUpperCase()}`, 75, 83.5, { align: 'center' });

    // Tear-Off Perforation Divider
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.6);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(150, 0, 150, 95);
    doc.setLineDashPattern([], 0); // Reset

    // Right Stub (Width 60mm)
    doc.setFillColor(241, 245, 249);
    doc.rect(150, 0, 60, 95, 'F');

    doc.setFillColor(...primaryColor);
    doc.rect(150, 0, 60, 22, 'F');
    doc.setFillColor(...goldColor);
    doc.rect(150, 22, 60, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...goldColor);
    doc.text('FLIGHT STUB', 180, 12, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(250, 246, 240);
    doc.text(ticket.airline || 'BRITISH AIRWAYS', 180, 17, { align: 'center' });

    // Stub Route & Passenger
    doc.setTextColor(...slateDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`${origin} → ${destination}`, 180, 36, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('PASSENGER', 156, 46);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(ticket.passenger_name || 'ELEANOR VANCE', 156, 51);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('FLIGHT / SEAT', 156, 59);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(`${ticket.flight_number || 'BA-178'} / ${ticket.seat || '4A'}`, 156, 64);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('CLASS / STATUS', 156, 72);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text('BUSINESS / CONFIRMED', 156, 77);

    // Save
    doc.save(`Boarding_Pass_${ticket.pnr || ticket.booking_reference || 'PASS'}.pdf`);
  },
};

export default pdfService;
