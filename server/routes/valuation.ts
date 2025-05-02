import { Router } from 'express';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { costMatrices, incomeSchedules } from '../../shared/schema';
import { CostMatrix, IncomeSchedule } from '../types';

const router = Router();

// Get all cost matrices
router.get('/matrices', async (req, res) => {
  try {
    const matrices = await db.select().from(costMatrices);
    res.json(matrices);
  } catch (error) {
    console.error('Error fetching cost matrices:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching cost matrices',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get a specific matrix by ID
router.get('/matrices/:id', async (req, res) => {
  try {
    const matrix = await db.select().from(costMatrices).where(eq(costMatrices.matrixId, req.params.id));
    
    if (matrix.length === 0) {
      return res.status(404).json({ success: false, message: 'Matrix not found' });
    }
    
    res.json(matrix[0]);
  } catch (error) {
    console.error('Error fetching matrix:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching matrix',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new cost matrix
router.post('/matrices', async (req, res) => {
  try {
    const { name, baseCost, modifiers } = req.body as CostMatrix;
    
    if (!name || baseCost === undefined) {
      return res.status(400).json({ success: false, message: 'Name and baseCost are required' });
    }
    
    const newMatrix = {
      matrixId: uuidv4(),
      name,
      baseCost,
      modifiers: JSON.stringify(modifiers || []),
      createdAt: new Date()
    };
    
    await db.insert(costMatrices).values(newMatrix);
    
    res.status(201).json({
      success: true,
      message: 'Matrix created successfully',
      matrix: { ...newMatrix, modifiers: modifiers || [] }
    });
  } catch (error) {
    console.error('Error creating matrix:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating matrix',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update a cost matrix
router.put('/matrices/:id', async (req, res) => {
  try {
    const { name, baseCost, modifiers } = req.body as CostMatrix;
    
    if (!name || baseCost === undefined) {
      return res.status(400).json({ success: false, message: 'Name and baseCost are required' });
    }
    
    const matrix = await db.select().from(costMatrices).where(eq(costMatrices.matrixId, req.params.id));
    
    if (matrix.length === 0) {
      return res.status(404).json({ success: false, message: 'Matrix not found' });
    }
    
    await db.update(costMatrices)
      .set({
        name,
        baseCost,
        modifiers: JSON.stringify(modifiers || []),
        updatedAt: new Date()
      })
      .where(eq(costMatrices.matrixId, req.params.id));
    
    res.json({
      success: true,
      message: 'Matrix updated successfully'
    });
  } catch (error) {
    console.error('Error updating matrix:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating matrix',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a cost matrix
router.delete('/matrices/:id', async (req, res) => {
  try {
    const matrix = await db.select().from(costMatrices).where(eq(costMatrices.matrixId, req.params.id));
    
    if (matrix.length === 0) {
      return res.status(404).json({ success: false, message: 'Matrix not found' });
    }
    
    await db.delete(costMatrices).where(eq(costMatrices.matrixId, req.params.id));
    
    res.json({
      success: true,
      message: 'Matrix deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting matrix:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting matrix',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// -- Income Schedules Endpoints --

// Get all income schedules
router.get('/schedules', async (req, res) => {
  try {
    const schedules = await db.select().from(incomeSchedules);
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching income schedules:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching income schedules',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get a specific schedule by ID
router.get('/schedules/:id', async (req, res) => {
  try {
    const schedule = await db.select().from(incomeSchedules).where(eq(incomeSchedules.scheduleId, req.params.id));
    
    if (schedule.length === 0) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }
    
    res.json(schedule[0]);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new income schedule
router.post('/schedules', async (req, res) => {
  try {
    const { propertyType, grossIncome, vacancyRate, operatingExpenses, capRate } = req.body as IncomeSchedule;
    
    if (!propertyType || grossIncome === undefined) {
      return res.status(400).json({ success: false, message: 'PropertyType and grossIncome are required' });
    }
    
    const newSchedule = {
      scheduleId: uuidv4(),
      propertyType,
      grossIncome,
      vacancyRate: vacancyRate || 0,
      operatingExpenses: operatingExpenses || 0,
      capRate: capRate || 0,
      createdAt: new Date()
    };
    
    await db.insert(incomeSchedules).values(newSchedule);
    
    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      schedule: newSchedule
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update an income schedule
router.put('/schedules/:id', async (req, res) => {
  try {
    const { propertyType, grossIncome, vacancyRate, operatingExpenses, capRate } = req.body as IncomeSchedule;
    
    if (!propertyType || grossIncome === undefined) {
      return res.status(400).json({ success: false, message: 'PropertyType and grossIncome are required' });
    }
    
    const schedule = await db.select().from(incomeSchedules).where(eq(incomeSchedules.scheduleId, req.params.id));
    
    if (schedule.length === 0) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }
    
    await db.update(incomeSchedules)
      .set({
        propertyType,
        grossIncome,
        vacancyRate: vacancyRate || 0,
        operatingExpenses: operatingExpenses || 0,
        capRate: capRate || 0,
        updatedAt: new Date()
      })
      .where(eq(incomeSchedules.scheduleId, req.params.id));
    
    res.json({
      success: true,
      message: 'Schedule updated successfully'
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete an income schedule
router.delete('/schedules/:id', async (req, res) => {
  try {
    const schedule = await db.select().from(incomeSchedules).where(eq(incomeSchedules.scheduleId, req.params.id));
    
    if (schedule.length === 0) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }
    
    await db.delete(incomeSchedules).where(eq(incomeSchedules.scheduleId, req.params.id));
    
    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;