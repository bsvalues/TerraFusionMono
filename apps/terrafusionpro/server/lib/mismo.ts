import { create } from 'xmlbuilder2';
import type { XMLBuilder } from 'xmlbuilder2';
import { AppraisalReport, Property, Comparable, Adjustment } from '@shared/schema';

/**
 * Generate MISMO 2.6 XML for appraisal report
 */
export async function generateMismoXML(
  report: AppraisalReport,
  property: Property,
  comparables: Comparable[],
  adjustments: Adjustment[]
): Promise<string> {
  // Create the root XML document with MISMO namespace
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('MISMO_2_6', {
      xmlns: 'http://www.mismo.org/residential/2009/schemas',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation': 'http://www.mismo.org/residential/2009/schemas MISMO_2_6.xsd'
    });

  // Add VALUATION_RESPONSE element as the root element for appraisal data
  const valuationResponse = doc.ele('VALUATION_RESPONSE');
  
  // Add document information
  addDocumentInformation(valuationResponse, report);
  
  // Add property information
  addPropertyInformation(valuationResponse, property);
  
  // Add transaction information
  addTransactionInformation(valuationResponse, report);
  
  // Add valuation method information (sales comparison approach)
  addValuationMethod(valuationResponse, report, comparables, adjustments);
  
  // Convert the XML document to a string
  return doc.end({ prettyPrint: true });
}

function addDocumentInformation(parent: XMLBuilder, report: AppraisalReport): void {
  const docInfo = parent.ele('DOCUMENT_INFORMATION');
  
  docInfo.ele('DOCUMENT_ID').txt(`${report.id}`);
  docInfo.ele('DOCUMENT_TYPE').txt('Appraisal Report');
  
  const formData = docInfo.ele('FORM_DATA');
  formData.ele('FORM_NAME').txt(report.formType);
  formData.ele('FORM_VERSION').txt('1.0');
  
  if (report.reportDate) {
    docInfo.ele('DOCUMENT_DATE').txt(formatDate(report.reportDate));
  }
}

function addPropertyInformation(parent: XMLBuilder, property: Property): void {
  const propertyInfo = parent.ele('PROPERTY_INFORMATION');
  
  // Add property identifier
  const propertyId = propertyInfo.ele('PROPERTY_ID');
  propertyId.ele('PROPERTY_ID_TYPE').txt('TaxParcelID');
  if (property.taxParcelId) {
    propertyId.ele('PROPERTY_ID_VALUE').txt(property.taxParcelId);
  }
  
  // Add property details
  const propertyDetails = propertyInfo.ele('PROPERTY_DETAILS');
  
  // Add property address
  const propertyAddress = propertyDetails.ele('PROPERTY_ADDRESS');
  propertyAddress.ele('ADDRESS_LINE_TEXT').txt(property.address);
  propertyAddress.ele('CITY_NAME').txt(property.city);
  propertyAddress.ele('STATE_CODE').txt(property.state);
  propertyAddress.ele('POSTAL_CODE').txt(property.zipCode);
  if (property.county) {
    propertyAddress.ele('COUNTY_NAME').txt(property.county);
  }
  
  // Add property characteristics
  const propertyCharacteristics = propertyDetails.ele('PROPERTY_CHARACTERISTICS');
  
  propertyCharacteristics.ele('PROPERTY_TYPE').txt(property.propertyType || 'Single Family');
  
  if (property.yearBuilt) {
    propertyCharacteristics.ele('YEAR_BUILT').txt(`${property.yearBuilt}`);
  }
  
  if (property.grossLivingArea) {
    propertyCharacteristics.ele('GROSS_LIVING_AREA_SQUARE_FEET').txt(`${property.grossLivingArea}`);
  }
  
  if (property.lotSize) {
    propertyCharacteristics.ele('LOT_SIZE_AREA').txt(`${property.lotSize}`);
    propertyCharacteristics.ele('LOT_SIZE_UNIT_OF_MEASURE_TYPE').txt('SquareFeet');
  }
  
  if (property.bedrooms) {
    propertyCharacteristics.ele('BEDROOM_COUNT').txt(`${property.bedrooms}`);
  }
  
  if (property.bathrooms) {
    propertyCharacteristics.ele('BATHROOM_COUNT').txt(`${property.bathrooms}`);
  }
  
  if (property.basement) {
    propertyCharacteristics.ele('BASEMENT_INDICATOR').txt('Y');
    propertyCharacteristics.ele('BASEMENT_TYPE').txt(property.basement);
  } else {
    propertyCharacteristics.ele('BASEMENT_INDICATOR').txt('N');
  }
  
  if (property.garage) {
    propertyCharacteristics.ele('GARAGE_INDICATOR').txt('Y');
    propertyCharacteristics.ele('GARAGE_TYPE').txt(property.garage);
  } else {
    propertyCharacteristics.ele('GARAGE_INDICATOR').txt('N');
  }
  
  // Add legal description if available
  if (property.legalDescription) {
    propertyDetails.ele('LEGAL_DESCRIPTION').txt(property.legalDescription);
  }
}

function addTransactionInformation(parent: XMLBuilder, report: AppraisalReport): void {
  const transactionInfo = parent.ele('TRANSACTION_INFORMATION');
  
  // Add transaction detail
  const transactionDetail = transactionInfo.ele('TRANSACTION_DETAIL');
  transactionDetail.ele('TRANSACTION_ID').txt(`${report.id}`);
  
  if (report.purpose) {
    transactionDetail.ele('APPRAISAL_PURPOSE_TYPE').txt(report.purpose);
  }
  
  if (report.effectiveDate) {
    transactionDetail.ele('EFFECTIVE_DATE').txt(formatDate(report.effectiveDate));
  }
  
  // Add transaction participants (client, lender, borrower)
  const participants = transactionInfo.ele('TRANSACTION_PARTICIPANTS');
  
  // Add client information
  if (report.clientName) {
    const client = participants.ele('CLIENT');
    client.ele('PARTY_ID').txt('Client');
    client.ele('PARTY_NAME').txt(report.clientName);
    
    if (report.clientAddress) {
      const clientAddress = client.ele('PARTY_ADDRESS');
      clientAddress.ele('ADDRESS_LINE_TEXT').txt(report.clientAddress);
    }
  }
  
  // Add lender information
  if (report.lenderName) {
    const lender = participants.ele('LENDER');
    lender.ele('PARTY_ID').txt('Lender');
    lender.ele('PARTY_NAME').txt(report.lenderName);
    
    if (report.lenderAddress) {
      const lenderAddress = lender.ele('PARTY_ADDRESS');
      lenderAddress.ele('ADDRESS_LINE_TEXT').txt(report.lenderAddress);
    }
  }
  
  // Add borrower information
  if (report.borrowerName) {
    const borrower = participants.ele('BORROWER');
    borrower.ele('PARTY_ID').txt('Borrower');
    borrower.ele('PARTY_NAME').txt(report.borrowerName);
  }
}

function addValuationMethod(
  parent: XMLBuilder,
  report: AppraisalReport,
  comparables: Comparable[],
  adjustments: Adjustment[]
): void {
  const valuationMethods = parent.ele('VALUATION_METHODS');
  
  // Add sales comparison approach
  const salesComparison = valuationMethods.ele('SALES_COMPARISON_APPROACH');
  
  // Add subject property value
  if (report.marketValue) {
    salesComparison.ele('MARKET_VALUE_AMOUNT').txt(`${report.marketValue}`);
  }
  
  // Add comparable properties
  const comparableProperties = salesComparison.ele('COMPARABLE_PROPERTIES');
  
  comparables.forEach((comparable, index) => {
    const comp = comparableProperties.ele('COMPARABLE_PROPERTY');
    comp.ele('COMPARABLE_IDENTIFIER').txt(`Comp${index + 1}`);
    
    const compAddress = comp.ele('PROPERTY_ADDRESS');
    compAddress.ele('ADDRESS_LINE_TEXT').txt(comparable.address);
    compAddress.ele('CITY_NAME').txt(comparable.city);
    compAddress.ele('STATE_CODE').txt(comparable.state);
    compAddress.ele('POSTAL_CODE').txt(comparable.zipCode);
    
    // Add proximity to subject
    if (comparable.proximityToSubject) {
      comp.ele('PROXIMITY_TO_SUBJECT').txt(comparable.proximityToSubject);
    }
    
    // Add sale price
    if (comparable.salePrice) {
      comp.ele('SALE_PRICE_AMOUNT').txt(`${comparable.salePrice}`);
    }
    
    // Add price per sq ft
    if (comparable.pricePerSqFt) {
      comp.ele('PRICE_PER_SQUARE_FOOT_AMOUNT').txt(`${comparable.pricePerSqFt}`);
    }
    
    // Add sale date
    if (comparable.saleDate) {
      comp.ele('SALE_DATE').txt(formatDate(comparable.saleDate));
    }
    
    // Add property characteristics
    const compCharacteristics = comp.ele('PROPERTY_CHARACTERISTICS');
    
    if (comparable.locationRating) {
      compCharacteristics.ele('LOCATION_RATING_TYPE').txt(comparable.locationRating);
    }
    
    if (comparable.siteSize) {
      compCharacteristics.ele('LOT_SIZE_AREA').txt(`${comparable.siteSize}`);
      compCharacteristics.ele('LOT_SIZE_UNIT_OF_MEASURE_TYPE').txt(comparable.siteUnit || 'SquareFeet');
    }
    
    if (comparable.grossLivingArea) {
      compCharacteristics.ele('GROSS_LIVING_AREA_SQUARE_FEET').txt(`${comparable.grossLivingArea}`);
    }
    
    if (comparable.bedrooms) {
      compCharacteristics.ele('BEDROOM_COUNT').txt(`${comparable.bedrooms}`);
    }
    
    if (comparable.bathrooms) {
      compCharacteristics.ele('BATHROOM_COUNT').txt(`${comparable.bathrooms}`);
    }
    
    // Add adjustments
    const relevantAdjustments = adjustments.filter(
      adjustment => adjustment.comparableId === comparable.id
    );
    
    if (relevantAdjustments.length > 0) {
      const compAdjustments = comp.ele('COMPARABLE_ADJUSTMENTS');
      
      relevantAdjustments.forEach(adjustment => {
        const adj = compAdjustments.ele('COMPARABLE_ADJUSTMENT');
        adj.ele('ADJUSTMENT_TYPE').txt(adjustment.adjustmentType);
        
        if (adjustment.description) {
          adj.ele('ADJUSTMENT_DESCRIPTION').txt(adjustment.description);
        }
        
        adj.ele('ADJUSTMENT_AMOUNT').txt(`${adjustment.amount}`);
      });
      
      // Calculate net adjustment
      const netAdjustment = relevantAdjustments.reduce(
        (sum, adj) => sum + Number(adj.amount), 
        0
      );
      
      comp.ele('NET_ADJUSTMENT_AMOUNT').txt(`${netAdjustment}`);
      
      // Calculate gross adjustment
      const grossAdjustment = relevantAdjustments.reduce(
        (sum, adj) => sum + Math.abs(Number(adj.amount)), 
        0
      );
      
      comp.ele('GROSS_ADJUSTMENT_AMOUNT').txt(`${grossAdjustment}`);
      
      // Calculate adjusted price
      if (comparable.salePrice) {
        const adjustedPrice = Number(comparable.salePrice) + netAdjustment;
        comp.ele('ADJUSTED_PRICE_AMOUNT').txt(`${adjustedPrice}`);
      }
    }
  });
}

// Helper function to format date for XML
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
