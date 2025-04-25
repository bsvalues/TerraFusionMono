import { jsPDF } from 'jspdf';
import { AppraisalReport, Property, Comparable, Photo } from '@shared/schema';

/**
 * Generate a PDF for an appraisal report
 */
export async function generatePDF(
  report: AppraisalReport,
  property: Property,
  comparables: Comparable[],
  photos: Photo[]
): Promise<Buffer> {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "in",
    format: "letter"
  });

  // Set default font
  doc.setFont("helvetica");
  
  // Add title
  doc.setFontSize(16);
  doc.text("UNIFORM RESIDENTIAL APPRAISAL REPORT", 4.25, 0.5, { align: "center" });
  
  // Add report information
  doc.setFontSize(10);
  doc.text(`Report #: ${report.id}`, 0.5, 1);
  doc.text(`Form: ${report.formType}`, 0.5, 1.2);
  
  if (report.effectiveDate) {
    doc.text(`Effective Date: ${formatDate(report.effectiveDate)}`, 0.5, 1.4);
  }
  
  if (report.reportDate) {
    doc.text(`Report Date: ${formatDate(report.reportDate)}`, 0.5, 1.6);
  }
  
  // Add property information section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SUBJECT PROPERTY", 0.5, 2);
  doc.line(0.5, 2.1, 8, 2.1);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Property address
  doc.text("Property Address:", 0.5, 2.4);
  doc.text(property.address, 2, 2.4);
  
  doc.text("City:", 0.5, 2.6);
  doc.text(property.city, 2, 2.6);
  
  doc.text("State:", 0.5, 2.8);
  doc.text(property.state, 2, 2.8);
  
  doc.text("Zip Code:", 0.5, 3);
  doc.text(property.zipCode, 2, 3);
  
  if (property.county) {
    doc.text("County:", 0.5, 3.2);
    doc.text(property.county, 2, 3.2);
  }
  
  if (property.taxParcelId) {
    doc.text("Tax Parcel ID:", 0.5, 3.4);
    doc.text(property.taxParcelId, 2, 3.4);
  }
  
  // Property characteristics
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PROPERTY CHARACTERISTICS", 0.5, 4);
  doc.line(0.5, 4.1, 8, 4.1);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  doc.text("Property Type:", 0.5, 4.4);
  doc.text(property.propertyType || "", 2, 4.4);
  
  if (property.yearBuilt) {
    doc.text("Year Built:", 0.5, 4.6);
    doc.text(`${property.yearBuilt}`, 2, 4.6);
  }
  
  if (property.effectiveAge) {
    doc.text("Effective Age:", 0.5, 4.8);
    doc.text(`${property.effectiveAge}`, 2, 4.8);
  }
  
  if (property.grossLivingArea) {
    doc.text("Gross Living Area:", 0.5, 5);
    doc.text(`${property.grossLivingArea} sq ft`, 2, 5);
  }
  
  if (property.lotSize) {
    doc.text("Lot Size:", 0.5, 5.2);
    doc.text(`${property.lotSize} sq ft`, 2, 5.2);
  }
  
  if (property.bedrooms) {
    doc.text("Bedrooms:", 0.5, 5.4);
    doc.text(`${property.bedrooms}`, 2, 5.4);
  }
  
  if (property.bathrooms) {
    doc.text("Bathrooms:", 0.5, 5.6);
    doc.text(`${property.bathrooms}`, 2, 5.6);
  }
  
  if (property.basement) {
    doc.text("Basement:", 0.5, 5.8);
    doc.text(property.basement, 2, 5.8);
  }
  
  if (property.garage) {
    doc.text("Garage:", 0.5, 6);
    doc.text(property.garage, 2, 6);
  }
  
  // Add transaction information
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TRANSACTION INFORMATION", 0.5, 6.5);
  doc.line(0.5, 6.6, 8, 6.6);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  if (report.purpose) {
    doc.text("Purpose:", 0.5, 6.9);
    doc.text(report.purpose, 2, 6.9);
  }
  
  if (report.clientName) {
    doc.text("Client:", 0.5, 7.1);
    doc.text(report.clientName, 2, 7.1);
  }
  
  if (report.lenderName) {
    doc.text("Lender:", 0.5, 7.3);
    doc.text(report.lenderName, 2, 7.3);
  }
  
  if (report.borrowerName) {
    doc.text("Borrower:", 0.5, 7.5);
    doc.text(report.borrowerName, 2, 7.5);
  }
  
  if (report.occupancy) {
    doc.text("Occupancy:", 0.5, 7.7);
    doc.text(report.occupancy, 2, 7.7);
  }
  
  if (report.salesPrice) {
    doc.text("Sales Price:", 0.5, 7.9);
    doc.text(`$${formatCurrency(report.salesPrice)}`, 2, 7.9);
  }
  
  // Add a new page for sales comparison approach
  doc.addPage();
  
  // Add sales comparison approach
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SALES COMPARISON APPROACH", 4.25, 0.5, { align: "center" });
  
  if (report.marketValue) {
    doc.setFontSize(10);
    doc.text(`Indicated Value by Sales Comparison Approach: $${formatCurrency(report.marketValue)}`, 0.5, 0.8);
  }
  
  // Only proceed if there are comparables
  if (comparables.length > 0) {
    // Create sales comparison table
    const tableTop = 1.2;
    const rowHeight = 0.25;
    
    // Draw table headers
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    
    doc.text("FEATURE", 0.5, tableTop);
    doc.text("SUBJECT", 2.5, tableTop);
    
    // Draw comparable headers
    comparables.slice(0, 3).forEach((comp, index) => {
      doc.text(`COMPARABLE ${index + 1}`, 3.5 + (index * 1.5), tableTop);
    });
    
    // Draw horizontal line after headers
    doc.line(0.5, tableTop + 0.1, 8, tableTop + 0.1);
    
    // Set up data rows
    doc.setFont("helvetica", "normal");
    let currentY = tableTop + 0.3;
    
    // Address row
    doc.text("Address", 0.5, currentY);
    doc.text(truncateText(property.address, 20), 2.5, currentY);
    
    comparables.slice(0, 3).forEach((comp, index) => {
      doc.text(truncateText(comp.address, 15), 3.5 + (index * 1.5), currentY);
    });
    
    currentY += rowHeight;
    
    // Proximity row
    doc.text("Proximity to Subject", 0.5, currentY);
    
    comparables.slice(0, 3).forEach((comp, index) => {
      if (comp.proximityToSubject) {
        doc.text(truncateText(comp.proximityToSubject, 15), 3.5 + (index * 1.5), currentY);
      }
    });
    
    currentY += rowHeight;
    
    // Sale Price row
    doc.text("Sale Price", 0.5, currentY);
    if (report.salesPrice) {
      doc.text(`$${formatCurrency(report.salesPrice)}`, 2.5, currentY);
    }
    
    comparables.slice(0, 3).forEach((comp, index) => {
      if (comp.salePrice) {
        doc.text(`$${formatCurrency(comp.salePrice)}`, 3.5 + (index * 1.5), currentY);
      }
    });
    
    currentY += rowHeight;
    
    // Price per Sq Ft row
    doc.text("Price / Sq Ft", 0.5, currentY);
    
    if (property.grossLivingArea && report.salesPrice) {
      const pricePerSqFt = Number(report.salesPrice) / Number(property.grossLivingArea);
      doc.text(`$${formatCurrency(pricePerSqFt)}`, 2.5, currentY);
    }
    
    comparables.slice(0, 3).forEach((comp, index) => {
      if (comp.pricePerSqFt) {
        doc.text(`$${formatCurrency(comp.pricePerSqFt)}`, 3.5 + (index * 1.5), currentY);
      }
    });
    
    currentY += rowHeight * 1.5;
    
    // Draw a section divider
    doc.line(0.5, currentY - 0.1, 8, currentY - 0.1);
    doc.text("DESCRIPTION", 0.5, currentY);
    currentY += rowHeight;
    
    // Location row
    doc.text("Location", 0.5, currentY);
    
    if (property.propertyType) {
      doc.text(truncateText(property.propertyType, 20), 2.5, currentY);
    }
    
    comparables.slice(0, 3).forEach((comp, index) => {
      if (comp.locationRating) {
        doc.text(truncateText(comp.locationRating, 15), 3.5 + (index * 1.5), currentY);
      }
    });
    
    currentY += rowHeight;
    
    // Site row
    doc.text("Site", 0.5, currentY);
    
    if (property.lotSize) {
      doc.text(`${property.lotSize} sq ft`, 2.5, currentY);
    }
    
    comparables.slice(0, 3).forEach((comp, index) => {
      if (comp.siteSize) {
        doc.text(`${comp.siteSize} ${comp.siteUnit || 'sq ft'}`, 3.5 + (index * 1.5), currentY);
      }
    });
    
    currentY += rowHeight;
    
    // GLA row
    doc.text("GLA", 0.5, currentY);
    
    if (property.grossLivingArea) {
      doc.text(`${property.grossLivingArea} sq ft`, 2.5, currentY);
    }
    
    comparables.slice(0, 3).forEach((comp, index) => {
      if (comp.grossLivingArea) {
        doc.text(`${comp.grossLivingArea} sq ft`, 3.5 + (index * 1.5), currentY);
      }
    });
    
    currentY += rowHeight;
    
    // Bedrooms row
    doc.text("Bedrooms", 0.5, currentY);
    
    if (property.bedrooms) {
      doc.text(`${property.bedrooms}`, 2.5, currentY);
    }
    
    comparables.slice(0, 3).forEach((comp, index) => {
      if (comp.bedrooms) {
        doc.text(`${comp.bedrooms}`, 3.5 + (index * 1.5), currentY);
      }
    });
    
    currentY += rowHeight;
    
    // Bathrooms row
    doc.text("Bathrooms", 0.5, currentY);
    
    if (property.bathrooms) {
      doc.text(`${property.bathrooms}`, 2.5, currentY);
    }
    
    comparables.slice(0, 3).forEach((comp, index) => {
      if (comp.bathrooms) {
        doc.text(`${comp.bathrooms}`, 3.5 + (index * 1.5), currentY);
      }
    });
    
    currentY += rowHeight;
    
    // Basement row
    doc.text("Basement", 0.5, currentY);
    
    if (property.basement) {
      doc.text(property.basement, 2.5, currentY);
    }
    
    comparables.slice(0, 3).forEach((comp, index) => {
      if (comp.basement) {
        doc.text(comp.basement, 3.5 + (index * 1.5), currentY);
      }
    });
    
    currentY += rowHeight;
    
    // Garage row
    doc.text("Garage", 0.5, currentY);
    
    if (property.garage) {
      doc.text(property.garage, 2.5, currentY);
    }
    
    comparables.slice(0, 3).forEach((comp, index) => {
      if (comp.garage) {
        doc.text(comp.garage, 3.5 + (index * 1.5), currentY);
      }
    });
  }
  
  // Add photos page if photos exist
  if (photos.length > 0) {
    doc.addPage();
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("SUBJECT PHOTOS", 4.25, 0.5, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Note: In a real-world scenario, you would download and embed actual images
    // For this implementation, we'll just list the photos
    
    let photoY = 1;
    photos.forEach((photo, index) => {
      if (index > 0 && index % 10 === 0) {
        doc.addPage();
        photoY = 1;
      }
      
      doc.text(`Photo ${index + 1}: ${photo.photoType}`, 0.5, photoY);
      if (photo.caption) {
        doc.text(`Caption: ${photo.caption}`, 1, photoY + 0.2);
      }
      if (photo.dateTaken) {
        doc.text(`Date Taken: ${formatDate(photo.dateTaken)}`, 1, photoY + 0.4);
      }
      
      photoY += 0.8;
    });
  }
  
  // Add certification and signature page
  doc.addPage();
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("APPRAISER'S CERTIFICATION", 4.25, 0.5, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const certificationText = 
    "I certify that, to the best of my knowledge and belief:\n" +
    "• The statements of fact contained in this report are true and correct.\n" +
    "• The reported analyses, opinions, and conclusions are limited only by the reported assumptions and limiting conditions and are my personal, impartial, and unbiased professional analyses, opinions, and conclusions.\n" +
    "• I have no present or prospective interest in the property that is the subject of this report and no personal interest with respect to the parties involved.\n" +
    "• I have no bias with respect to the property that is the subject of this report or to the parties involved with this assignment.\n" +
    "• My engagement in this assignment was not contingent upon developing or reporting predetermined results.\n" +
    "• My compensation for completing this assignment is not contingent upon the development or reporting of a predetermined value or direction in value that favors the cause of the client, the amount of the value opinion, the attainment of a stipulated result, or the occurrence of a subsequent event directly related to the intended use of this appraisal.\n" +
    "• My analyses, opinions, and conclusions were developed, and this report has been prepared, in conformity with the Uniform Standards of Professional Appraisal Practice.\n" +
    "• I have made a personal inspection of the property that is the subject of this report.\n" +
    "• No one provided significant real property appraisal assistance to the person signing this certification.";
  
  const certificationLines = doc.splitTextToSize(certificationText, 7.5);
  doc.text(certificationLines, 0.5, 1);
  
  // Signature area
  doc.text("Appraiser's Signature", 0.5, 8);
  doc.line(0.5, 8.2, 3, 8.2);
  
  doc.text("Date Signed", 5, 8);
  doc.line(5, 8.2, 7.5, 8.2);
  
  // Convert the PDF to a buffer
  return Buffer.from(doc.output('arraybuffer'));
}

// Helper function to format date
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit'
  });
}

// Helper function to format currency
function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Helper function to truncate text
function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
}
