import { storage } from "../../storage";
import { InsertLog } from "@shared/schema";

class LogsService {
  async getLogs(limit: number = 100, service?: string, level?: string) {
    try {
      return await storage.getLogs(limit, service, level);
    } catch (error: any) {
      console.error(`Error fetching logs: ${error.message}`);
      return [];
    }
  }
  
  async createLog(log: InsertLog) {
    try {
      return await storage.createLog(log);
    } catch (error: any) {
      // Just log to console as a fallback if database logging fails
      console.error(`Error creating log entry: ${error.message}`);
      console.log(`LOG [${log.level}] [${log.service}]: ${log.message}`);
      return null;
    }
  }
}

export const logsService = new LogsService();