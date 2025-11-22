import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { type Vendor } from '../lib/supabase';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: { finalY: number };
  }
}

interface ExportOptions {
  coupleName?: string;
  weddingDate?: string;
}

export const exportBookedVendorsToPDF = (
  vendors: Vendor[],
  options: ExportOptions = {}
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);

  const bookedVendors = vendors.filter(
    v => v.contract_status === 'signed' || v.contract_status === 'completed'
  );

  const sortedVendors = bookedVendors.sort((a, b) => 
    a.category.localeCompare(b.category)
  );

  let yPosition = margin;

  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.8);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(10, 37, 60);
  doc.text('Deine Hochzeits-Helden', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(102, 102, 102);
  doc.text('Übersicht deiner gebuchten Dienstleister', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  if (options.coupleName || options.weddingDate) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    if (options.coupleName) {
      doc.text(options.coupleName, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
    }
    if (options.weddingDate) {
      doc.text('Hochzeitsdatum: ' + options.weddingDate, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
    }
  }

  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  const summaryBoxHeight = 25;
  doc.setFillColor(247, 242, 235);
  doc.roundedRect(margin, yPosition, contentWidth, summaryBoxHeight, 3, 3, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(10, 37, 60);
  
  const totalCost = sortedVendors.reduce((sum, v) => sum + (v.total_cost || 0), 0);
  const totalPaid = sortedVendors.reduce((sum, v) => sum + (v.paid_amount || 0), 0);
  const remaining = totalCost - totalPaid;
  
  const statsY = yPosition + 8;
  const colWidth = contentWidth / 4;
  
  doc.text('Gesamt:', margin + 5, statsY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(sortedVendors.length + ' Dienstleister', margin + 5, statsY + 5);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 37, 60);
  doc.text('Gesamtkosten:', margin + colWidth + 5, statsY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(totalCost.toLocaleString('de-DE') + ' €', margin + colWidth + 5, statsY + 5);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 37, 60);
  doc.text('Bezahlt:', margin + (colWidth * 2) + 5, statsY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text(totalPaid.toLocaleString('de-DE') + ' €', margin + (colWidth * 2) + 5, statsY + 5);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 37, 60);
  doc.text('Offen:', margin + (colWidth * 3) + 5, statsY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(remaining > 0 ? 245 : 50, remaining > 0 ? 158 : 50, remaining > 0 ? 11 : 50);
  doc.text(remaining.toLocaleString('de-DE') + ' €', margin + (colWidth * 3) + 5, statsY + 5);
  
  yPosition += summaryBoxHeight + 12;

  const categories = [...new Set(sortedVendors.map(v => v.category))];
  
  categories.forEach((category, catIndex) => {
    const categoryVendors = sortedVendors.filter(v => v.category === category);
    
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.setFillColor(212, 175, 55);
    doc.roundedRect(margin, yPosition, 5, 8, 1, 1, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(10, 37, 60);
    doc.text(category, margin + 8, yPosition + 6);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(categoryVendors.length + ' Dienstleister', margin + 8 + doc.getTextWidth(category) + 3, yPosition + 6);
    
    yPosition += 12;
    
    categoryVendors.forEach((vendor, vendorIndex) => {
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = margin;
      }
      
      const cardHeight = 55;
      
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, yPosition, contentWidth, cardHeight, 2, 2, 'FD');
      
      const cardPadding = 5;
      let cardY = yPosition + cardPadding;
      
      doc.setFillColor(212, 175, 55);
      doc.circle(margin + cardPadding, cardY + 1.5, 1.5, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(10, 37, 60);
      doc.text(vendor.name, margin + cardPadding + 4, cardY + 2);
      cardY += 7;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      
      doc.setFont('helvetica', 'bold');
      doc.text('E-Mail:', margin + cardPadding, cardY);
      doc.setFont('helvetica', 'normal');
      if (vendor.email) {
        doc.setTextColor(212, 175, 55);
        doc.text(vendor.email, margin + cardPadding + 15, cardY);
      } else {
        doc.setTextColor(180, 180, 180);
        doc.text('_________________________________________', margin + cardPadding + 15, cardY);
      }
      cardY += 6;
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text('Telefon:', margin + cardPadding, cardY);
      doc.setFont('helvetica', 'normal');
      if (vendor.phone) {
        doc.setTextColor(212, 175, 55);
        doc.text(vendor.phone, margin + cardPadding + 15, cardY);
      } else {
        doc.setTextColor(180, 180, 180);
        doc.text('_________________________________________', margin + cardPadding + 15, cardY);
      }
      cardY += 6;
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text('Standort:', margin + cardPadding, cardY);
      doc.setFont('helvetica', 'normal');
      if (vendor.location) {
        doc.setTextColor(80, 80, 80);
        doc.text(vendor.location, margin + cardPadding + 15, cardY);
      } else {
        doc.setTextColor(180, 180, 180);
        doc.text('_________________________________________', margin + cardPadding + 15, cardY);
      }
      cardY += 6;
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text('Website:', margin + cardPadding, cardY);
      doc.setFont('helvetica', 'normal');
      if (vendor.website) {
        doc.setTextColor(59, 130, 246);
        doc.textWithLink(vendor.website, margin + cardPadding + 15, cardY, { url: vendor.website });
      } else {
        doc.setTextColor(180, 180, 180);
        doc.text('_________________________________________', margin + cardPadding + 15, cardY);
      }
      
      const rightColX = pageWidth - margin - 40;
      let rightY = yPosition + cardPadding + 2;
      
      if (vendor.total_cost && vendor.total_cost > 0) {
        doc.setFillColor(212, 175, 55);
        doc.roundedRect(rightColX - 5, rightY - 3, 45, 8, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(10, 37, 60);
        doc.text(vendor.total_cost.toLocaleString('de-DE') + ' €', rightColX + 17.5, rightY + 2, { align: 'center' });
        rightY += 10;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Bezahlt:', rightColX, rightY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(16, 185, 129);
      doc.text((vendor.paid_amount || 0).toLocaleString('de-DE') + ' €', rightColX, rightY + 4);
      rightY += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('Offen:', rightColX, rightY);
      doc.setFont('helvetica', 'normal');
      const vendorRemaining = (vendor.total_cost || 0) - (vendor.paid_amount || 0);
      doc.setTextColor(vendorRemaining > 0 ? 245 : 16, vendorRemaining > 0 ? 158 : 185, vendorRemaining > 0 ? 11 : 129);
      doc.text(vendorRemaining.toLocaleString('de-DE') + ' €', rightColX, rightY + 4);
      
      yPosition += cardHeight + 5;
    });
    
    yPosition += 5;
  });

  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Erstellt am ' + new Date().toLocaleDateString('de-DE'),
      margin,
      pageHeight - 10
    );
    doc.text(
      'Seite ' + pageNum + ' von ' + totalPages,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
  };

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  const filename = 'Hochzeits-Dienstleister_' + new Date().toISOString().split('T')[0] + '.pdf';
  
  doc.save(filename);
};
