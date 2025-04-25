import { AppraisalReport, Property, Comparable, Adjustment } from '@shared/schema';

/**
 * Utility function to format a date for XML
 */
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
}

/**
 * Generate a MISMO 2.6 XML string for an appraisal report
 */
export function generateMismoXml(
  report: AppraisalReport,
  property: Property,
  comparables: Comparable[],
  adjustments: Adjustment[]
): string {
  // Create XML header
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  
  // Add MISMO root element with namespaces
  xml += '<MISMO_2_6 xmlns="http://www.mismo.org/residential/2009/schemas" ' +
         'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
         'xsi:schemaLocation="http://www.mismo.org/residential/2009/schemas MISMO_2_6.xsd">\n';
  
  // Add VALUATION_RESPONSE element
  xml += '  <VALUATION_RESPONSE>\n';
  
  // Add document information
  xml += addDocumentInformation(report);
  
  // Add property information
  xml += addPropertyInformation(property);
  
  // Add transaction information
  xml += addTransactionInformation(report);
  
  // Add valuation method information (sales comparison approach)
  xml += addValuationMethod(report, property, comparables, adjustments);
  
  // Close VALUATION_RESPONSE element
  xml += '  </VALUATION_RESPONSE>\n';
  
  // Close MISMO root element
  xml += '</MISMO_2_6>';
  
  return xml;
}

/**
 * Add document information to the XML
 */
function addDocumentInformation(report: AppraisalReport): string {
  let xml = '    <DOCUMENT_INFORMATION>\n';
  
  xml += `      <DOCUMENT_ID>${report.id}</DOCUMENT_ID>\n`;
  xml += '      <DOCUMENT_TYPE>Appraisal Report</DOCUMENT_TYPE>\n';
  
  xml += '      <FORM_DATA>\n';
  xml += `        <FORM_NAME>${report.formType}</FORM_NAME>\n`;
  xml += '        <FORM_VERSION>1.0</FORM_VERSION>\n';
  xml += '      </FORM_DATA>\n';
  
  if (report.reportDate) {
    xml += `      <DOCUMENT_DATE>${formatDate(report.reportDate)}</DOCUMENT_DATE>\n`;
  }
  
  xml += '    </DOCUMENT_INFORMATION>\n';
  
  return xml;
}

/**
 * Add property information to the XML
 */
function addPropertyInformation(property: Property): string {
  let xml = '    <PROPERTY_INFORMATION>\n';
  
  // Add property identifier
  xml += '      <PROPERTY_ID>\n';
  xml += '        <PROPERTY_ID_TYPE>TaxParcelID</PROPERTY_ID_TYPE>\n';
  if (property.taxParcelId) {
    xml += `        <PROPERTY_ID_VALUE>${property.taxParcelId}</PROPERTY_ID_VALUE>\n`;
  }
  xml += '      </PROPERTY_ID>\n';
  
  // Add property details
  xml += '      <PROPERTY_DETAILS>\n';
  
  // Add property address
  xml += '        <PROPERTY_ADDRESS>\n';
  xml += `          <ADDRESS_LINE_TEXT>${property.address}</ADDRESS_LINE_TEXT>\n`;
  xml += `          <CITY_NAME>${property.city}</CITY_NAME>\n`;
  xml += `          <STATE_CODE>${property.state}</STATE_CODE>\n`;
  xml += `          <POSTAL_CODE>${property.zipCode}</POSTAL_CODE>\n`;
  if (property.county) {
    xml += `          <COUNTY_NAME>${property.county}</COUNTY_NAME>\n`;
  }
  xml += '        </PROPERTY_ADDRESS>\n';
  
  // Add property characteristics
  xml += '        <PROPERTY_CHARACTERISTICS>\n';
  xml += `          <PROPERTY_TYPE>${property.propertyType || 'Single Family'}</PROPERTY_TYPE>\n`;
  
  if (property.yearBuilt) {
    xml += `          <YEAR_BUILT>${property.yearBuilt}</YEAR_BUILT>\n`;
  }
  
  if (property.grossLivingArea) {
    xml += `          <GROSS_LIVING_AREA_SQUARE_FEET>${property.grossLivingArea}</GROSS_LIVING_AREA_SQUARE_FEET>\n`;
  }
  
  if (property.lotSize) {
    xml += `          <LOT_SIZE_AREA>${property.lotSize}</LOT_SIZE_AREA>\n`;
    xml += '          <LOT_SIZE_UNIT_OF_MEASURE_TYPE>SquareFeet</LOT_SIZE_UNIT_OF_MEASURE_TYPE>\n';
  }
  
  if (property.bedrooms) {
    xml += `          <BEDROOM_COUNT>${property.bedrooms}</BEDROOM_COUNT>\n`;
  }
  
  if (property.bathrooms) {
    xml += `          <BATHROOM_COUNT>${property.bathrooms}</BATHROOM_COUNT>\n`;
  }
  
  if (property.basement) {
    xml += '          <BASEMENT_INDICATOR>Y</BASEMENT_INDICATOR>\n';
    xml += `          <BASEMENT_TYPE>${property.basement}</BASEMENT_TYPE>\n`;
  } else {
    xml += '          <BASEMENT_INDICATOR>N</BASEMENT_INDICATOR>\n';
  }
  
  if (property.garage) {
    xml += '          <GARAGE_INDICATOR>Y</GARAGE_INDICATOR>\n';
    xml += `          <GARAGE_TYPE>${property.garage}</GARAGE_TYPE>\n`;
  } else {
    xml += '          <GARAGE_INDICATOR>N</GARAGE_INDICATOR>\n';
  }
  
  xml += '        </PROPERTY_CHARACTERISTICS>\n';
  
  // Add legal description if available
  if (property.legalDescription) {
    xml += `        <LEGAL_DESCRIPTION>${property.legalDescription}</LEGAL_DESCRIPTION>\n`;
  }
  
  xml += '      </PROPERTY_DETAILS>\n';
  xml += '    </PROPERTY_INFORMATION>\n';
  
  return xml;
}

/**
 * Add transaction information to the XML
 */
function addTransactionInformation(report: AppraisalReport): string {
  let xml = '    <TRANSACTION_INFORMATION>\n';
  
  // Add transaction detail
  xml += '      <TRANSACTION_DETAIL>\n';
  xml += `        <TRANSACTION_ID>${report.id}</TRANSACTION_ID>\n`;
  
  if (report.purpose) {
    xml += `        <APPRAISAL_PURPOSE_TYPE>${report.purpose}</APPRAISAL_PURPOSE_TYPE>\n`;
  }
  
  if (report.effectiveDate) {
    xml += `        <EFFECTIVE_DATE>${formatDate(report.effectiveDate)}</EFFECTIVE_DATE>\n`;
  }
  
  xml += '      </TRANSACTION_DETAIL>\n';
  
  // Add transaction participants (client, lender, borrower)
  xml += '      <TRANSACTION_PARTICIPANTS>\n';
  
  // Add client information
  if (report.clientName) {
    xml += '        <CLIENT>\n';
    xml += '          <PARTY_ID>Client</PARTY_ID>\n';
    xml += `          <PARTY_NAME>${report.clientName}</PARTY_NAME>\n`;
    
    if (report.clientAddress) {
      xml += '          <PARTY_ADDRESS>\n';
      xml += `            <ADDRESS_LINE_TEXT>${report.clientAddress}</ADDRESS_LINE_TEXT>\n`;
      xml += '          </PARTY_ADDRESS>\n';
    }
    
    xml += '        </CLIENT>\n';
  }
  
  // Add lender information
  if (report.lenderName) {
    xml += '        <LENDER>\n';
    xml += '          <PARTY_ID>Lender</PARTY_ID>\n';
    xml += `          <PARTY_NAME>${report.lenderName}</PARTY_NAME>\n`;
    
    if (report.lenderAddress) {
      xml += '          <PARTY_ADDRESS>\n';
      xml += `            <ADDRESS_LINE_TEXT>${report.lenderAddress}</ADDRESS_LINE_TEXT>\n`;
      xml += '          </PARTY_ADDRESS>\n';
    }
    
    xml += '        </LENDER>\n';
  }
  
  // Add borrower information
  if (report.borrowerName) {
    xml += '        <BORROWER>\n';
    xml += '          <PARTY_ID>Borrower</PARTY_ID>\n';
    xml += `          <PARTY_NAME>${report.borrowerName}</PARTY_NAME>\n`;
    xml += '        </BORROWER>\n';
  }
  
  xml += '      </TRANSACTION_PARTICIPANTS>\n';
  xml += '    </TRANSACTION_INFORMATION>\n';
  
  return xml;
}

/**
 * Add valuation method information to the XML
 */
function addValuationMethod(
  report: AppraisalReport,
  property: Property,
  comparables: Comparable[],
  adjustments: Adjustment[]
): string {
  let xml = '    <VALUATION_METHODS>\n';
  
  // Add sales comparison approach
  xml += '      <SALES_COMPARISON_APPROACH>\n';
  
  // Add subject property value
  if (report.marketValue) {
    xml += `        <MARKET_VALUE_AMOUNT>${report.marketValue}</MARKET_VALUE_AMOUNT>\n`;
  }
  
  // Add comparable properties
  xml += '        <COMPARABLE_PROPERTIES>\n';
  
  comparables.forEach((comparable, index) => {
    xml += '          <COMPARABLE_PROPERTY>\n';
    xml += `            <COMPARABLE_IDENTIFIER>Comp${index + 1}</COMPARABLE_IDENTIFIER>\n`;
    
    xml += '            <PROPERTY_ADDRESS>\n';
    xml += `              <ADDRESS_LINE_TEXT>${comparable.address}</ADDRESS_LINE_TEXT>\n`;
    xml += `              <CITY_NAME>${comparable.city}</CITY_NAME>\n`;
    xml += `              <STATE_CODE>${comparable.state}</STATE_CODE>\n`;
    xml += `              <POSTAL_CODE>${comparable.zipCode}</POSTAL_CODE>\n`;
    xml += '            </PROPERTY_ADDRESS>\n';
    
    // Add proximity to subject
    if (comparable.proximityToSubject) {
      xml += `            <PROXIMITY_TO_SUBJECT>${comparable.proximityToSubject}</PROXIMITY_TO_SUBJECT>\n`;
    }
    
    // Add sale price
    if (comparable.salePrice) {
      xml += `            <SALE_PRICE_AMOUNT>${comparable.salePrice}</SALE_PRICE_AMOUNT>\n`;
    }
    
    // Add price per sq ft
    if (comparable.pricePerSqFt) {
      xml += `            <PRICE_PER_SQUARE_FOOT_AMOUNT>${comparable.pricePerSqFt}</PRICE_PER_SQUARE_FOOT_AMOUNT>\n`;
    }
    
    // Add sale date
    if (comparable.saleDate) {
      xml += `            <SALE_DATE>${formatDate(comparable.saleDate)}</SALE_DATE>\n`;
    }
    
    // Add property characteristics
    xml += '            <PROPERTY_CHARACTERISTICS>\n';
    
    if (comparable.locationRating) {
      xml += `              <LOCATION_RATING_TYPE>${comparable.locationRating}</LOCATION_RATING_TYPE>\n`;
    }
    
    if (comparable.siteSize) {
      xml += `              <LOT_SIZE_AREA>${comparable.siteSize}</LOT_SIZE_AREA>\n`;
      xml += `              <LOT_SIZE_UNIT_OF_MEASURE_TYPE>${comparable.siteUnit || 'SquareFeet'}</LOT_SIZE_UNIT_OF_MEASURE_TYPE>\n`;
    }
    
    if (comparable.grossLivingArea) {
      xml += `              <GROSS_LIVING_AREA_SQUARE_FEET>${comparable.grossLivingArea}</GROSS_LIVING_AREA_SQUARE_FEET>\n`;
    }
    
    if (comparable.bedrooms) {
      xml += `              <BEDROOM_COUNT>${comparable.bedrooms}</BEDROOM_COUNT>\n`;
    }
    
    if (comparable.bathrooms) {
      xml += `              <BATHROOM_COUNT>${comparable.bathrooms}</BATHROOM_COUNT>\n`;
    }
    
    xml += '            </PROPERTY_CHARACTERISTICS>\n';
    
    // Add adjustments
    const relevantAdjustments = adjustments.filter(
      adjustment => adjustment.comparableId === comparable.id
    );
    
    if (relevantAdjustments.length > 0) {
      xml += '            <COMPARABLE_ADJUSTMENTS>\n';
      
      relevantAdjustments.forEach(adjustment => {
        xml += '              <COMPARABLE_ADJUSTMENT>\n';
        xml += `                <ADJUSTMENT_TYPE>${adjustment.adjustmentType}</ADJUSTMENT_TYPE>\n`;
        
        if (adjustment.description) {
          xml += `                <ADJUSTMENT_DESCRIPTION>${adjustment.description}</ADJUSTMENT_DESCRIPTION>\n`;
        }
        
        xml += `                <ADJUSTMENT_AMOUNT>${adjustment.amount}</ADJUSTMENT_AMOUNT>\n`;
        xml += '              </COMPARABLE_ADJUSTMENT>\n';
      });
      
      xml += '            </COMPARABLE_ADJUSTMENTS>\n';
      
      // Calculate net adjustment
      const netAdjustment = relevantAdjustments.reduce(
        (sum, adj) => sum + Number(adj.amount),
        0
      );
      
      xml += `            <NET_ADJUSTMENT_AMOUNT>${netAdjustment}</NET_ADJUSTMENT_AMOUNT>\n`;
      
      // Calculate gross adjustment
      const grossAdjustment = relevantAdjustments.reduce(
        (sum, adj) => sum + Math.abs(Number(adj.amount)),
        0
      );
      
      xml += `            <GROSS_ADJUSTMENT_AMOUNT>${grossAdjustment}</GROSS_ADJUSTMENT_AMOUNT>\n`;
      
      // Calculate adjusted price
      if (comparable.salePrice) {
        const adjustedPrice = Number(comparable.salePrice) + netAdjustment;
        xml += `            <ADJUSTED_PRICE_AMOUNT>${adjustedPrice}</ADJUSTED_PRICE_AMOUNT>\n`;
      }
    }
    
    xml += '          </COMPARABLE_PROPERTY>\n';
  });
  
  xml += '        </COMPARABLE_PROPERTIES>\n';
  xml += '      </SALES_COMPARISON_APPROACH>\n';
  xml += '    </VALUATION_METHODS>\n';
  
  return xml;
}

/**
 * Parse a MISMO XML string into a set of objects
 */
export function parseMismoXml(xmlString: string): {
  report: Partial<AppraisalReport>;
  property: Partial<Property>;
  comparables: Partial<Comparable>[];
} {
  // This is a simplified implementation for demo purposes
  // In a real-world application, this would use a proper XML parser

  const report: Partial<AppraisalReport> = {};
  const property: Partial<Property> = {};
  const comparables: Partial<Comparable>[] = [];

  // Example parsing logic
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  // Parse property information
  const propertyAddressElem = xmlDoc.querySelector("PROPERTY_ADDRESS");
  if (propertyAddressElem) {
    property.address = propertyAddressElem.querySelector("ADDRESS_LINE_TEXT")?.textContent || undefined;
    property.city = propertyAddressElem.querySelector("CITY_NAME")?.textContent || undefined;
    property.state = propertyAddressElem.querySelector("STATE_CODE")?.textContent || undefined;
    property.zipCode = propertyAddressElem.querySelector("POSTAL_CODE")?.textContent || undefined;
    property.county = propertyAddressElem.querySelector("COUNTY_NAME")?.textContent || undefined;
  }

  // Parse property characteristics
  const propertyCharElem = xmlDoc.querySelector("PROPERTY_CHARACTERISTICS");
  if (propertyCharElem) {
    property.propertyType = propertyCharElem.querySelector("PROPERTY_TYPE")?.textContent || undefined;
    
    const yearBuiltText = propertyCharElem.querySelector("YEAR_BUILT")?.textContent;
    if (yearBuiltText) property.yearBuilt = parseInt(yearBuiltText);
    
    const glaText = propertyCharElem.querySelector("GROSS_LIVING_AREA_SQUARE_FEET")?.textContent;
    if (glaText) property.grossLivingArea = parseFloat(glaText);
    
    const lotSizeText = propertyCharElem.querySelector("LOT_SIZE_AREA")?.textContent;
    if (lotSizeText) property.lotSize = parseFloat(lotSizeText);
    
    const bedroomsText = propertyCharElem.querySelector("BEDROOM_COUNT")?.textContent;
    if (bedroomsText) property.bedrooms = parseFloat(bedroomsText);
    
    const bathroomsText = propertyCharElem.querySelector("BATHROOM_COUNT")?.textContent;
    if (bathroomsText) property.bathrooms = parseFloat(bathroomsText);
    
    property.basement = propertyCharElem.querySelector("BASEMENT_TYPE")?.textContent || undefined;
    property.garage = propertyCharElem.querySelector("GARAGE_TYPE")?.textContent || undefined;
  }

  // Parse report information
  const documentInfoElem = xmlDoc.querySelector("DOCUMENT_INFORMATION");
  if (documentInfoElem) {
    const formNameElem = documentInfoElem.querySelector("FORM_NAME");
    if (formNameElem) report.formType = formNameElem.textContent || undefined;
    
    const documentDateElem = documentInfoElem.querySelector("DOCUMENT_DATE");
    if (documentDateElem && documentDateElem.textContent) {
      report.reportDate = new Date(documentDateElem.textContent);
    }
  }

  const transactionDetailElem = xmlDoc.querySelector("TRANSACTION_DETAIL");
  if (transactionDetailElem) {
    report.purpose = transactionDetailElem.querySelector("APPRAISAL_PURPOSE_TYPE")?.textContent || undefined;
    
    const effectiveDateElem = transactionDetailElem.querySelector("EFFECTIVE_DATE");
    if (effectiveDateElem && effectiveDateElem.textContent) {
      report.effectiveDate = new Date(effectiveDateElem.textContent);
    }
  }

  const marketValueElem = xmlDoc.querySelector("MARKET_VALUE_AMOUNT");
  if (marketValueElem && marketValueElem.textContent) {
    report.marketValue = parseFloat(marketValueElem.textContent);
  }

  // Parse client, lender, borrower information
  const clientElem = xmlDoc.querySelector("CLIENT");
  if (clientElem) {
    report.clientName = clientElem.querySelector("PARTY_NAME")?.textContent || undefined;
    report.clientAddress = clientElem.querySelector("ADDRESS_LINE_TEXT")?.textContent || undefined;
  }

  const lenderElem = xmlDoc.querySelector("LENDER");
  if (lenderElem) {
    report.lenderName = lenderElem.querySelector("PARTY_NAME")?.textContent || undefined;
    report.lenderAddress = lenderElem.querySelector("ADDRESS_LINE_TEXT")?.textContent || undefined;
  }

  const borrowerElem = xmlDoc.querySelector("BORROWER");
  if (borrowerElem) {
    report.borrowerName = borrowerElem.querySelector("PARTY_NAME")?.textContent || undefined;
  }

  // Parse comparable properties
  const comparableElems = xmlDoc.querySelectorAll("COMPARABLE_PROPERTY");
  comparableElems.forEach((compElem) => {
    const comparable: Partial<Comparable> = {};
    
    // Parse address
    const compAddressElem = compElem.querySelector("PROPERTY_ADDRESS");
    if (compAddressElem) {
      comparable.address = compAddressElem.querySelector("ADDRESS_LINE_TEXT")?.textContent || undefined;
      comparable.city = compAddressElem.querySelector("CITY_NAME")?.textContent || undefined;
      comparable.state = compAddressElem.querySelector("STATE_CODE")?.textContent || undefined;
      comparable.zipCode = compAddressElem.querySelector("POSTAL_CODE")?.textContent || undefined;
    }
    
    // Parse proximity
    comparable.proximityToSubject = compElem.querySelector("PROXIMITY_TO_SUBJECT")?.textContent || undefined;
    
    // Parse sale price
    const salePriceText = compElem.querySelector("SALE_PRICE_AMOUNT")?.textContent;
    if (salePriceText) comparable.salePrice = parseFloat(salePriceText);
    
    // Parse price per sq ft
    const pricePerSqFtText = compElem.querySelector("PRICE_PER_SQUARE_FOOT_AMOUNT")?.textContent;
    if (pricePerSqFtText) comparable.pricePerSqFt = parseFloat(pricePerSqFtText);
    
    // Parse sale date
    const saleDateElem = compElem.querySelector("SALE_DATE");
    if (saleDateElem && saleDateElem.textContent) {
      comparable.saleDate = new Date(saleDateElem.textContent);
    }
    
    // Parse property characteristics
    const compCharElem = compElem.querySelector("PROPERTY_CHARACTERISTICS");
    if (compCharElem) {
      comparable.locationRating = compCharElem.querySelector("LOCATION_RATING_TYPE")?.textContent || undefined;
      
      const siteSizeText = compCharElem.querySelector("LOT_SIZE_AREA")?.textContent;
      if (siteSizeText) comparable.siteSize = parseFloat(siteSizeText);
      
      comparable.siteUnit = compCharElem.querySelector("LOT_SIZE_UNIT_OF_MEASURE_TYPE")?.textContent || undefined;
      
      const glaText = compCharElem.querySelector("GROSS_LIVING_AREA_SQUARE_FEET")?.textContent;
      if (glaText) comparable.grossLivingArea = parseFloat(glaText);
      
      const bedroomsText = compCharElem.querySelector("BEDROOM_COUNT")?.textContent;
      if (bedroomsText) comparable.bedrooms = parseFloat(bedroomsText);
      
      const bathroomsText = compCharElem.querySelector("BATHROOM_COUNT")?.textContent;
      if (bathroomsText) comparable.bathrooms = parseFloat(bathroomsText);
    }
    
    comparables.push(comparable);
  });

  return { report, property, comparables };
}
