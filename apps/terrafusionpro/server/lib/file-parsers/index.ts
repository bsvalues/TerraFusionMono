/**
 * File Parser Registry
 * 
 * This module provides a registry of file parsers for different formats.
 * It allows the system to detect and use the appropriate parser based on the file content.
 */

import { FileParser } from "./types";
import path from "path";

// Import specific parsers
import { PDFParser } from "./pdf-parser";
import { MISMOXMLParser } from "./mismo-xml-parser";
import { CSVParser } from "./csv-parser";
import { JSONParser } from "./json-parser";
import { WorkFileParser } from "./work-file-parser";

/**
 * Parser Registry for File Import System
 */
export class ParserRegistry {
  private parsers: FileParser[];

  constructor() {
    // Register all available parsers
    this.parsers = [
      new PDFParser(),
      new MISMOXMLParser(),
      new CSVParser(),
      new JSONParser(),
      new WorkFileParser()
    ];
  }

  /**
   * Gets the appropriate parser for a file
   * 
   * @param filename The name of the file
   * @param content The content of the file
   * @returns The appropriate parser or undefined if no parser can handle the file
   */
  getParserForFile(filename: string, content: string): FileParser | undefined {
    // First try to detect by examining the content
    for (const parser of this.parsers) {
      if (parser.canParse(content)) {
        return parser;
      }
    }

    // If no parser was found by content, try to detect by file extension
    const extension = path.extname(filename).toLowerCase();
    
    // Map file extensions to parser types
    if (extension === ".pdf") {
      return this.getParserByName("PDFParser");
    } else if (extension === ".xml") {
      return this.getParserByName("MISMOXMLParser");
    } else if (extension === ".csv") {
      return this.getParserByName("CSVParser");
    } else if (extension === ".json") {
      return this.getParserByName("JSONParser");
    } else if ([".zap", ".aci", ".apr"].includes(extension)) {
      return this.getParserByName("WorkFileParser");
    }

    // No parser found
    return undefined;
  }

  /**
   * Gets a parser by name
   * 
   * @param name The name of the parser
   * @returns The parser or undefined if no parser with that name exists
   */
  getParserByName(name: string): FileParser | undefined {
    return this.parsers.find(parser => parser.name === name);
  }

  /**
   * Gets all registered parsers
   * 
   * @returns Array of all registered parsers
   */
  getAllParsers(): FileParser[] {
    return [...this.parsers];
  }
}