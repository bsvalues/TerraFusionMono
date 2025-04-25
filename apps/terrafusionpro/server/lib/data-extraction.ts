import OpenAI from "openai";
import { OrderEmail, ClientInfo, LenderInfo, OrderDetails } from "./email-integration";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Extract property data from email and attachments
export async function extractPropertyDataFromEmail(email: OrderEmail): Promise<{
  clientInfo: ClientInfo;
  lenderInfo: LenderInfo;
  orderDetails: OrderDetails;
}> {
  try {
    // Combine email body and attachment content
    const emailContent = email.htmlBody || email.body;
    
    // Extract text from attachments (PDF, Word, etc)
    const attachmentText = await extractTextFromAttachments(email.attachments);
    
    // Use OpenAI to extract structured data from the email and attachments
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant specialized in extracting appraisal order information from emails and attachments. 
          Extract all relevant information about the property, client, lender, and order details.`
        },
        {
          role: "user",
          content: `Extract all appraisal order information from this email and its attachments.
          
          EMAIL CONTENT:
          ${emailContent}
          
          ATTACHMENT CONTENT:
          ${attachmentText}
          
          Extract and return the following information in JSON format:
          1. Client information (name, company, email, phone, address if available)
          2. Lender information (name, address, contact person, contact email, contact phone if available)
          3. Order details (order number, order date, due date, fee amount, report type, property type, property address, city, state, zip, borrower name, occupancy status, loan type, and any special instructions)`
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the response
    const content = response.choices[0].message.content || "{}";
    const extractedData = JSON.parse(content);
    
    // Format the response
    return {
      clientInfo: {
        name: extractedData.client?.name || "Unknown Client",
        company: extractedData.client?.company || "Unknown Company",
        email: extractedData.client?.email || "unknown@example.com",
        phone: extractedData.client?.phone || "Unknown",
        address: extractedData.client?.address
      },
      lenderInfo: {
        name: extractedData.lender?.name || "Unknown Lender",
        address: extractedData.lender?.address || "Unknown Address",
        contactPerson: extractedData.lender?.contactPerson,
        contactEmail: extractedData.lender?.contactEmail,
        contactPhone: extractedData.lender?.contactPhone
      },
      orderDetails: {
        orderNumber: extractedData.order?.orderNumber || `ORD-${Date.now()}`,
        orderDate: new Date(extractedData.order?.orderDate || Date.now()),
        dueDate: new Date(extractedData.order?.dueDate || Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
        feeAmount: extractedData.order?.feeAmount,
        reportType: extractedData.order?.reportType || "Residential Appraisal Report",
        propertyType: extractedData.order?.propertyType || "Single Family",
        propertyAddress: extractedData.order?.propertyAddress || "Unknown Address",
        propertyCity: extractedData.order?.propertyCity || "Unknown City",
        propertyState: extractedData.order?.propertyState || "Unknown State",
        propertyZip: extractedData.order?.propertyZip || "Unknown Zip",
        borrowerName: extractedData.order?.borrowerName,
        occupancyStatus: extractedData.order?.occupancyStatus,
        loanType: extractedData.order?.loanType,
        specialInstructions: extractedData.order?.specialInstructions
      }
    };
  } catch (error) {
    console.error("Error extracting data from email:", error);
    
    // Return default values if AI extraction fails
    return {
      clientInfo: {
        name: "Unknown Client",
        company: "Unknown Company",
        email: "unknown@example.com",
        phone: "Unknown"
      },
      lenderInfo: {
        name: "Unknown Lender",
        address: "Unknown Address"
      },
      orderDetails: {
        orderNumber: `ORD-${Date.now()}`,
        orderDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        reportType: "Residential Appraisal Report",
        propertyType: "Single Family",
        propertyAddress: "Unknown Address",
        propertyCity: "Unknown City",
        propertyState: "Unknown State",
        propertyZip: "Unknown Zip"
      }
    };
  }
}

// Extract text content from various attachment types
async function extractTextFromAttachments(attachments: any[]): Promise<string> {
  try {
    // In a production environment, we would have specialized parsers for each file type
    // PDF.js for PDFs, mammoth for Word documents, etc.
    
    // For now, we'll just analyze the attachments and return their names and types
    const attachmentInfo = attachments.map(attachment => {
      return `Filename: ${attachment.filename}, Type: ${attachment.contentType}`;
    }).join("\n");
    
    return `Attachments found:\n${attachmentInfo}`;
  } catch (error) {
    console.error("Error extracting text from attachments:", error);
    return "Error processing attachments";
  }
}

// For a production system, we'd implement specific parsers for each file type:

// PDF Parsing
async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  // Placeholder for PDF extraction implementation
  // In a real implementation, we would use a library like pdf-parse or pdf.js
  return "PDF content would be extracted here";
}

// Word Document Parsing
async function extractTextFromWord(docBuffer: Buffer): Promise<string> {
  // Placeholder for Word document extraction implementation
  // In a real implementation, we would use a library like mammoth.js
  return "Word document content would be extracted here";
}

// Image OCR
async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  // Placeholder for image OCR implementation
  // In a real implementation, we would use a library like Tesseract.js or call an OCR API
  return "Image text would be extracted here using OCR";
}