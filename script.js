// Hotel Receipt Generator System
// Features: Dynamic receipt generation, PDF export, Print functionality, Auto calculations

class HotelReceiptGenerator {
  constructor() {
    this.initializeElements();
    this.attachEventListeners();
    this.setDefaultDates();
  }

  initializeElements() {
    // Form elements
    this.guestName = document.getElementById('guestName');
    this.guestEmail = document.getElementById('guestEmail');
    this.guestPhone = document.getElementById('guestPhone');
    this.guestId = document.getElementById('guestId');
    this.checkinDate = document.getElementById('checkinDate');
    this.checkoutDate = document.getElementById('checkoutDate');
    this.roomNumber = document.getElementById('roomNumber');
    this.roomType = document.getElementById('roomType');
    this.roomRate = document.getElementById('roomRate');
    this.foodCharge = document.getElementById('foodCharge');
    this.servicesCharge = document.getElementById('servicesCharge');
    this.extraCharge = document.getElementById('extraCharge');
    this.taxRate = document.getElementById('taxRate');
    this.discount = document.getElementById('discount');
    this.notes = document.getElementById('notes');
    
    // Buttons
    this.generateBtn = document.getElementById('generateReceiptBtn');
    this.resetBtn = document.getElementById('resetFormBtn');
    this.downloadPDFBtn = document.getElementById('downloadPDFBtn');
    this.printBtn = document.getElementById('printReceiptBtn');
    
    // Receipt container
    this.receiptContent = document.getElementById('receiptContent');
  }

  setDefaultDates() {
    // Set default dates: today as check-in, tomorrow as check-out
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (this.checkinDate) {
      this.checkinDate.value = today.toISOString().split('T')[0];
    }
    if (this.checkoutDate) {
      this.checkoutDate.value = tomorrow.toISOString().split('T')[0];
    }
    
    // Set default room rate
    if (this.roomRate) {
      this.roomRate.value = '150.00';
    }
  }

  attachEventListeners() {
    this.generateBtn.addEventListener('click', () => this.generateReceipt());
    this.resetBtn.addEventListener('click', () => this.resetForm());
    this.downloadPDFBtn.addEventListener('click', () => this.downloadAsPDF());
    this.printBtn.addEventListener('click', () => this.printReceipt());
    
    // Auto-calculate on input changes
    const calculationFields = [this.roomRate, this.foodCharge, this.servicesCharge, this.extraCharge, this.taxRate, this.discount];
    calculationFields.forEach(field => {
      if (field) {
        field.addEventListener('input', () => this.updatePreviewIfExists());
      }
    });
  }

  updatePreviewIfExists() {
    // If there's already a receipt generated, update it live
    if (this.receiptContent && this.receiptContent.querySelector('.generated-receipt')) {
      this.generateReceipt();
    }
  }

  validateForm() {
    if (!this.guestName.value.trim()) {
      alert('Please enter guest name');
      this.guestName.focus();
      return false;
    }
    if (!this.guestEmail.value.trim()) {
      alert('Please enter guest email');
      this.guestEmail.focus();
      return false;
    }
    if (!this.checkinDate.value) {
      alert('Please select check-in date');
      return false;
    }
    if (!this.checkoutDate.value) {
      alert('Please select check-out date');
      return false;
    }
    if (!this.roomNumber.value.trim()) {
      alert('Please enter room number');
      this.roomNumber.focus();
      return false;
    }
    if (!this.roomRate.value || parseFloat(this.roomRate.value) <= 0) {
      alert('Please enter valid room rate');
      this.roomRate.focus();
      return false;
    }
    
    // Validate dates
    const checkin = new Date(this.checkinDate.value);
    const checkout = new Date(this.checkoutDate.value);
    if (checkout <= checkin) {
      alert('Check-out date must be after check-in date');
      return false;
    }
    
    return true;
  }

  calculateNights() {
    const checkin = new Date(this.checkinDate.value);
    const checkout = new Date(this.checkoutDate.value);
    const diffTime = Math.abs(checkout - checkin);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  calculateTotals() {
    const nights = this.calculateNights();
    const roomRate = parseFloat(this.roomRate.value) || 0;
    const roomTotal = nights * roomRate;
    const foodTotal = parseFloat(this.foodCharge.value) || 0;
    const servicesTotal = parseFloat(this.servicesCharge.value) || 0;
    const extraTotal = parseFloat(this.extraCharge.value) || 0;
    const discountAmount = parseFloat(this.discount.value) || 0;
    const taxPercent = parseFloat(this.taxRate.value) || 0;
    
    const subtotal = roomTotal + foodTotal + servicesTotal + extraTotal;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * taxPercent) / 100;
    const grandTotal = taxableAmount + taxAmount;
    
    return {
      nights,
      roomRate,
      roomTotal,
      foodTotal,
      servicesTotal,
      extraTotal,
      subtotal,
      discountAmount,
      taxPercent,
      taxAmount,
      grandTotal
    };
  }

  generateReceipt() {
    if (!this.validateForm()) {
      return;
    }
    
    const totals = this.calculateTotals();
    const receiptId = 'HBL-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const currentDate = new Date().toLocaleString();
    
    const receiptHTML = `
      <div class="generated-receipt" id="printableReceipt">
        <div class="receipt-header">
          <h2>🏨 GRAND HOTEL & RESORTS</h2>
          <div class="hotel-name">★★★★★ Premium Hospitality</div>
          <div class="receipt-id">Receipt No: ${receiptId}</div>
          <div style="font-size: 0.7rem; color: #666;">Generated: ${currentDate}</div>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Guest Name</span>
            <span class="info-value">${this.escapeHtml(this.guestName.value)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Email / Phone</span>
            <span class="info-value">${this.escapeHtml(this.guestEmail.value)} ${this.guestPhone.value ? '| ' + this.escapeHtml(this.guestPhone.value) : ''}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Room Details</span>
            <span class="info-value">Room ${this.escapeHtml(this.roomNumber.value)} (${this.escapeHtml(this.roomType.value)})</span>
          </div>
          <div class="info-item">
            <span class="info-label">Stay Period</span>
            <span class="info-value">${this.checkinDate.value} → ${this.checkoutDate.value} (${totals.nights} night${totals.nights !== 1 ? 's' : ''})</span>
          </div>
        </div>
        
        <table class="charges-table">
          <tr>
            <td>Room Charges (${totals.nights} nights × $${totals.roomRate.toFixed(2)})</td>
            <td>$${totals.roomTotal.toFixed(2)}</td>
          </tr>
          ${totals.foodTotal > 0 ? `<tr><td>Food & Beverage</td><td>$${totals.foodTotal.toFixed(2)}</td></tr>` : ''}
          ${totals.servicesTotal > 0 ? `<tr><td>Spa / Laundry Services</td><td>$${totals.servicesTotal.toFixed(2)}</td></tr>` : ''}
          ${totals.extraTotal > 0 ? `<tr><td>Parking / Miscellaneous</td><td>$${totals.extraTotal.toFixed(2)}</td></tr>` : ''}
          ${totals.discountAmount > 0 ? `<tr style="color: #10b981;"><td>Discount Applied</td><td>-$${totals.discountAmount.toFixed(2)}</td></tr>` : ''}
          <tr>
            <td>Subtotal</td>
            <td>$${totals.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Tax (${totals.taxPercent}%)</td>
            <td>$${totals.taxAmount.toFixed(2)}</td>
          </tr>
          <tr class="total-row">
            <td><strong>GRAND TOTAL</strong></td>
            <td><strong>$${totals.grandTotal.toFixed(2)}</strong></td>
          </tr>
        </table>
        
        <div class="receipt-footer">
          ${this.notes.value ? `<p><strong>Notes:</strong> ${this.escapeHtml(this.notes.value)}</p>` : ''}
          <p class="thankyou">✨ Thank you for choosing Grand Hotel! ✨</p>
          <p>Check-out time: 11:00 AM | Early check-in subject to availability</p>
          <p>This is a computer generated receipt - valid with payment confirmation</p>
        </div>
      </div>
    `;
    
    this.receiptContent.innerHTML = receiptHTML;
    
    // Smooth scroll to receipt
    this.receiptContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  
  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  
  resetForm() {
    if (confirm('Clear all form fields? This will reset the receipt preview.')) {
      document.getElementById('receiptForm').reset();
      this.setDefaultDates();
      this.receiptContent.innerHTML = `
        <div class="empty-receipt-message">
          <i class="fas fa-receipt" style="font-size: 48px; color: #cbd5e1;"></i>
          <p>Fill the form and click "Generate Receipt" to preview</p>
        </div>
      `;
      // Reset additional fields to default
      if (this.roomRate) this.roomRate.value = '150.00';
      if (this.foodCharge) this.foodCharge.value = '0';
      if (this.servicesCharge) this.servicesCharge.value = '0';
      if (this.extraCharge) this.extraCharge.value = '0';
      if (this.discount) this.discount.value = '0';
      if (this.taxRate) this.taxRate.value = '18';
    }
  }
  
  async downloadAsPDF() {
    if (!this.receiptContent.querySelector('.generated-receipt')) {
      alert('Please generate a receipt first before downloading PDF.');
      return;
    }
    
    try {
      const element = document.getElementById('printableReceipt');
      if (!element) {
        alert('Receipt content not found');
        return;
      }
      
      // Show loading state
      const originalBtnText = this.downloadPDFBtn.innerHTML;
      this.downloadPDFBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Generating PDF...';
      this.downloadPDFBtn.disabled = true;
      
      // Use html2canvas to capture the receipt
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 190; // mm
      const pageHeight = 277; // mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let position = 10;
      
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      
      // Add new page if content exceeds
      let heightLeft = imgHeight;
      while (heightLeft > pageHeight) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = `Hotel_Receipt_${this.guestName.value.trim().replace(/\s/g, '_')}_${Date.now()}.pdf`;
      pdf.save(fileName);
      
      // Reset button
      this.downloadPDFBtn.innerHTML = originalBtnText;
      this.downloadPDFBtn.disabled = false;
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Please try again.');
      this.downloadPDFBtn.innerHTML = '<i class="fas fa-file-pdf"></i> PDF';
      this.downloadPDFBtn.disabled = false;
    }
  }
  
  printReceipt() {
    if (!this.receiptContent.querySelector('.generated-receipt')) {
      alert('Please generate a receipt first before printing.');
      return;
    }
    
    const printContent = document.getElementById('printableReceipt');
    const originalTitle = document.title;
    document.title = `Receipt_${this.guestName.value.trim()}`;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Hotel Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
            .generated-receipt { max-width: 800px; margin: 0 auto; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .charges-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .charges-table td { padding: 8px 0; border-bottom: 1px solid #ddd; }
            .total-row { font-weight: bold; border-top: 2px solid #000; }
            @media print {
              body { margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
    document.title = originalTitle;
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new HotelReceiptGenerator();
});
