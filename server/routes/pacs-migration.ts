import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { insertPacsConnectionSchema, insertMigrationJobSchema, insertSchemaMappingSchema, insertMigrationExecutionSchema } from '@shared/schema';

const router = Router();

// PACS Connections routes
router.get('/connections', async (req: Request, res: Response) => {
  try {
    const connections = await storage.getPacsConnections();
    res.json(connections);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

router.get('/connections/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const connection = await storage.getPacsConnection(id);
    
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    res.json(connection);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

router.post('/connections', async (req: Request, res: Response) => {
  try {
    const validatedData = insertPacsConnectionSchema.parse(req.body);
    const connection = await storage.createPacsConnection(validatedData);
    
    // Log connection creation
    await storage.createLog({
      level: 'INFO',
      service: 'pacs-migration',
      message: `PACS connection '${connection.name}' created`
    });
    
    res.status(201).json(connection);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  }
});

router.put('/connections/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const connection = await storage.getPacsConnection(id);
    
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    const updates = req.body;
    const updatedConnection = await storage.updatePacsConnection(id, updates);
    
    // Log connection update
    await storage.createLog({
      level: 'INFO',
      service: 'pacs-migration',
      message: `PACS connection '${connection.name}' updated`
    });
    
    res.json(updatedConnection);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  }
});

router.post('/connections/:id/test', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const connection = await storage.getPacsConnection(id);
    
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    const result = await storage.testPacsConnection(id);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

router.delete('/connections/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const connection = await storage.getPacsConnection(id);
    
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    await storage.deletePacsConnection(id);
    
    // Log connection deletion
    await storage.createLog({
      level: 'INFO',
      service: 'pacs-migration',
      message: `PACS connection '${connection.name}' deleted`
    });
    
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

// Migration Job routes
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const jobs = await storage.getMigrationJobs();
    res.json(jobs);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

router.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const job = await storage.getMigrationJob(id);
    
    if (!job) {
      return res.status(404).json({ error: 'Migration job not found' });
    }
    
    res.json(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

router.post('/jobs', async (req: Request, res: Response) => {
  try {
    const validatedData = insertMigrationJobSchema.parse(req.body);
    const job = await storage.createMigrationJob(validatedData);
    
    // Log job creation
    await storage.createLog({
      level: 'INFO',
      service: 'pacs-migration',
      message: `Migration job '${job.name}' created`
    });
    
    res.status(201).json(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  }
});

router.put('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const job = await storage.getMigrationJob(id);
    
    if (!job) {
      return res.status(404).json({ error: 'Migration job not found' });
    }
    
    const updates = req.body;
    const updatedJob = await storage.updateMigrationJob(id, updates);
    
    // Log job update
    await storage.createLog({
      level: 'INFO',
      service: 'pacs-migration',
      message: `Migration job '${job.name}' updated`
    });
    
    res.json(updatedJob);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  }
});

router.delete('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const job = await storage.getMigrationJob(id);
    
    if (!job) {
      return res.status(404).json({ error: 'Migration job not found' });
    }
    
    await storage.deleteMigrationJob(id);
    
    // Log job deletion
    await storage.createLog({
      level: 'INFO',
      service: 'pacs-migration',
      message: `Migration job '${job.name}' deleted`
    });
    
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

// Migration Execution routes
router.get('/jobs/:jobId/executions', async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.jobId);
    const job = await storage.getMigrationJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Migration job not found' });
    }
    
    const executions = await storage.getMigrationExecutions(jobId);
    res.json(executions);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

router.get('/executions/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const execution = await storage.getMigrationExecution(id);
    
    if (!execution) {
      return res.status(404).json({ error: 'Migration execution not found' });
    }
    
    res.json(execution);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

router.post('/jobs/:jobId/executions', async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.jobId);
    const job = await storage.getMigrationJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Migration job not found' });
    }
    
    // Prepare execution data
    const executionData = {
      ...req.body,
      jobId,
      runBy: req.user?.id
    };
    
    const validatedData = insertMigrationExecutionSchema.parse(executionData);
    const execution = await storage.createMigrationExecution(validatedData);
    
    // Log execution creation
    await storage.createLog({
      level: 'INFO',
      service: 'pacs-migration',
      message: `Migration execution #${execution.id} started for job '${job.name}'`
    });
    
    res.status(201).json(execution);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  }
});

router.put('/executions/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const execution = await storage.getMigrationExecution(id);
    
    if (!execution) {
      return res.status(404).json({ error: 'Migration execution not found' });
    }
    
    const updates = req.body;
    const updatedExecution = await storage.updateMigrationExecution(id, updates);
    
    // If status was updated to completed, add end time and log
    if (updates.status === 'completed' && !execution.endTime) {
      await storage.updateMigrationExecution(id, { endTime: new Date() });
      
      // Get the job
      const job = await storage.getMigrationJob(execution.jobId);
      
      // Log execution completion
      await storage.createLog({
        level: 'INFO',
        service: 'pacs-migration',
        message: `Migration execution #${execution.id} completed for job '${job?.name}'. Processed: ${updatedExecution.processedRecords}, Success: ${updatedExecution.successRecords}, Failed: ${updatedExecution.failedRecords}`
      });
    }
    
    res.json(updatedExecution);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  }
});

// Schema Mapping routes
router.get('/jobs/:jobId/mappings', async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.jobId);
    const job = await storage.getMigrationJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Migration job not found' });
    }
    
    const mappings = await storage.getSchemaMappings(jobId);
    res.json(mappings);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

router.get('/mappings/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const mapping = await storage.getSchemaMapping(id);
    
    if (!mapping) {
      return res.status(404).json({ error: 'Schema mapping not found' });
    }
    
    res.json(mapping);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

router.post('/jobs/:jobId/mappings', async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.jobId);
    const job = await storage.getMigrationJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Migration job not found' });
    }
    
    // Prepare mapping data
    const mappingData = {
      ...req.body,
      jobId
    };
    
    const validatedData = insertSchemaMappingSchema.parse(mappingData);
    const mapping = await storage.createSchemaMapping(validatedData);
    
    // Log mapping creation
    await storage.createLog({
      level: 'INFO',
      service: 'pacs-migration',
      message: `Schema mapping '${mapping.name}' created for job '${job.name}'`
    });
    
    res.status(201).json(mapping);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  }
});

router.put('/mappings/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const mapping = await storage.getSchemaMapping(id);
    
    if (!mapping) {
      return res.status(404).json({ error: 'Schema mapping not found' });
    }
    
    const updates = req.body;
    const updatedMapping = await storage.updateSchemaMapping(id, updates);
    
    // Log mapping update
    await storage.createLog({
      level: 'INFO',
      service: 'pacs-migration',
      message: `Schema mapping '${mapping.name}' updated`
    });
    
    res.json(updatedMapping);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  }
});

router.delete('/mappings/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const mapping = await storage.getSchemaMapping(id);
    
    if (!mapping) {
      return res.status(404).json({ error: 'Schema mapping not found' });
    }
    
    await storage.deleteSchemaMapping(id);
    
    // Log mapping deletion
    await storage.createLog({
      level: 'INFO',
      service: 'pacs-migration',
      message: `Schema mapping '${mapping.name}' deleted`
    });
    
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

// Transformation Log routes
router.get('/executions/:executionId/logs', async (req: Request, res: Response) => {
  try {
    const executionId = parseInt(req.params.executionId);
    const execution = await storage.getMigrationExecution(executionId);
    
    if (!execution) {
      return res.status(404).json({ error: 'Migration execution not found' });
    }
    
    const options = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      status: req.query.status as string,
      sourceTable: req.query.sourceTable as string
    };
    
    const logs = await storage.getTransformationLogs(executionId, options);
    res.json(logs);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

router.get('/transformationlogs/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const log = await storage.getTransformationLog(id);
    
    if (!log) {
      return res.status(404).json({ error: 'Transformation log not found' });
    }
    
    res.json(log);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

// Overall Migration Statistics & Dashboard
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get all migration jobs
    const jobs = await storage.getMigrationJobs();
    
    // Get counts by status
    const jobsByStatus = {
      pending: jobs.filter(job => job.status === 'pending').length,
      inProgress: jobs.filter(job => job.status === 'in_progress').length,
      completed: jobs.filter(job => job.status === 'completed').length,
      failed: jobs.filter(job => job.status === 'failed').length
    };
    
    // Get counts by source system
    const jobsBySourceSystem = {
      pacs: jobs.filter(job => job.sourceSystem === 'pacs').length,
      cama: jobs.filter(job => job.sourceSystem === 'cama').length,
      gis: jobs.filter(job => job.sourceSystem === 'gis').length,
      other: jobs.filter(job => job.sourceSystem === 'other').length
    };
    
    // Get active connections
    const connections = await storage.getPacsConnections({ status: 'active' });
    
    res.json({
      totalJobs: jobs.length,
      jobsByStatus,
      jobsBySourceSystem,
      activeConnections: connections.length,
      stats: {
        lastRun: new Date(),
        totalMigratedRecords: 0, // In a real system, would calculate this from all executions
        successRate: 0 // In a real system, would calculate this from all executions
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

export default router;