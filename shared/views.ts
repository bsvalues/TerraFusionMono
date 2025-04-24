import { sql } from 'drizzle-orm';
import { db } from '../server/db';

// Defining view creation function
export async function createViews() {
  try {
    // 1. Parcel Summary View - Shows summary statistics for each parcel
    await db.execute(sql`
      CREATE OR REPLACE VIEW parcel_summary_view AS
      SELECT 
        p.external_id as parcel_id,
        p.name as parcel_name,
        p.area_hectares as parcel_area,
        p.description as parcel_description,
        p.current_crop as parcel_crop_type,
        p.status as parcel_status,
        (SELECT COUNT(*) FROM parcel_notes WHERE parcel_id = p.external_id) as note_count,
        (SELECT COUNT(*) FROM parcel_measurements WHERE parcel_id = p.external_id) as measurement_count,
        (SELECT COUNT(*) FROM crop_health_analyses WHERE parcel_id = p.external_id) as health_analysis_count,
        (SELECT COUNT(*) FROM soil_analyses WHERE parcel_id = p.external_id) as soil_analysis_count,
        (SELECT COUNT(*) FROM yield_predictions WHERE parcel_id = p.external_id) as yield_prediction_count,
        (SELECT COUNT(*) FROM crop_health_images WHERE parcel_id = p.external_id) as image_count,
        (SELECT COUNT(*) FROM weather_data WHERE parcel_id = p.external_id) as weather_data_count,
        (SELECT AVG(health_score) FROM crop_health_analyses WHERE parcel_id = p.external_id) as avg_health_score,
        (SELECT MAX(created_at) FROM parcel_notes WHERE parcel_id = p.external_id) as last_note_date,
        (SELECT MAX(created_at) FROM crop_health_analyses WHERE parcel_id = p.external_id) as last_health_analysis_date
      FROM parcels p
      GROUP BY p.external_id, p.name, p.area_hectares, p.description, p.current_crop, p.status;
    `);

    // 2. Crop Health Dashboard View - Aggregated crop health data for dashboard displays
    await db.execute(sql`
      CREATE OR REPLACE VIEW crop_health_dashboard_view AS
      SELECT 
        p.external_id as parcel_id,
        p.name as parcel_name,
        p.current_crop as crop_type,
        cha.id as analysis_id,
        cha.overall_health as health_status,
        cha.health_score as health_score,
        cha.confidence_level as confidence_level,
        cha.growth_stage as growth_stage,
        cha.growth_progress as growth_progress,
        cha.estimated_harvest_date as harvest_date,
        cha.created_at as analysis_date,
        (SELECT COUNT(*) FROM disease_detections WHERE analysis_id = cha.id) as disease_count,
        (SELECT string_agg(disease_name, ', ') FROM disease_detections WHERE analysis_id = cha.id) as diseases,
        (SELECT AVG(confidence) FROM disease_detections WHERE analysis_id = cha.id) as avg_disease_confidence
      FROM parcels p
      LEFT JOIN crop_health_analyses cha ON p.external_id = cha.parcel_id
      WHERE cha.id IS NOT NULL
      GROUP BY p.external_id, p.name, p.current_crop, cha.id, cha.overall_health, cha.health_score, 
               cha.confidence_level, cha.growth_stage, cha.growth_progress, cha.estimated_harvest_date, cha.created_at
      ORDER BY cha.created_at DESC;
    `);

    // 3. Soil Analysis Trends View - Track soil health over time
    await db.execute(sql`
      CREATE OR REPLACE VIEW soil_analysis_trends_view AS
      SELECT 
        p.external_id as parcel_id,
        p.name as parcel_name,
        sa.id as analysis_id,
        sa.soil_type as soil_type,
        sa.ph as ph,
        sa.organic_matter as organic_matter,
        sa.nitrogen_level as nitrogen_level,
        sa.phosphorus_level as phosphorus_level,
        sa.potassium_level as potassium_level,
        sa.water_retention as water_retention,
        sa.suitability_score as suitability_score,
        sa.created_at as analysis_date,
        sa.ai_generated as ai_generated,
        sa.lab_verified as lab_verified
      FROM parcels p
      JOIN soil_analyses sa ON p.external_id = sa.parcel_id
      GROUP BY p.external_id, p.name, sa.id, sa.soil_type, sa.ph, sa.organic_matter, 
               sa.nitrogen_level, sa.phosphorus_level, sa.potassium_level, sa.water_retention, 
               sa.suitability_score, sa.created_at, sa.ai_generated, sa.lab_verified
      ORDER BY p.external_id, sa.created_at;
    `);

    // 4. Yield Prediction Summary View - Consolidated yield predictions
    await db.execute(sql`
      CREATE OR REPLACE VIEW yield_prediction_summary_view AS
      SELECT 
        p.external_id as parcel_id,
        p.name as parcel_name,
        p.area_hectares as parcel_area,
        p.current_crop as crop_type,
        yp.predicted_yield_value as predicted_yield,
        yp.predicted_yield_unit as yield_unit,
        yp.yield_per_hectare as yield_per_hectare,
        yp.confidence_low as confidence_low,
        yp.confidence_high as confidence_high,
        yp.confidence_level as confidence,
        yp.comparison_to_average as comparison_to_avg,
        yp.harvest_date_estimate as harvest_date,
        yp.market_value_per_unit as market_value_per_unit,
        yp.market_value_total as market_value_total,
        yp.scenario as scenario,
        yp.created_at as prediction_date
      FROM parcels p
      JOIN yield_predictions yp ON p.external_id = yp.parcel_id
      GROUP BY p.external_id, p.name, p.area_hectares, p.current_crop, 
               yp.predicted_yield_value, yp.predicted_yield_unit, yp.yield_per_hectare,
               yp.confidence_low, yp.confidence_high, yp.confidence_level, 
               yp.comparison_to_average, yp.harvest_date_estimate, 
               yp.market_value_per_unit, yp.market_value_total, yp.scenario, yp.created_at
      ORDER BY yp.created_at DESC;
    `);

    // 5. Weather Data Overview - Summarized weather conditions
    await db.execute(sql`
      CREATE OR REPLACE VIEW weather_data_overview_view AS
      SELECT 
        p.external_id as parcel_id,
        p.name as parcel_name,
        wd.data_type as data_type,
        wd.source as source,
        wd.temperature_min as temp_min,
        wd.temperature_max as temp_max,
        wd.temperature_avg as temp_avg,
        wd.humidity as humidity,
        wd.precipitation as precipitation,
        wd.wind_speed as wind_speed,
        wd.conditions as conditions,
        wd.created_at as observation_date
      FROM parcels p
      JOIN weather_data wd ON p.external_id = wd.parcel_id
      GROUP BY p.external_id, p.name, wd.data_type, wd.source, wd.temperature_min, 
               wd.temperature_max, wd.temperature_avg, wd.humidity, wd.precipitation, 
               wd.wind_speed, wd.conditions, wd.created_at
      ORDER BY wd.created_at DESC;
    `);

    console.log('Database views created successfully');
  } catch (error) {
    console.error('Error creating database views:', error);
    throw error;
  }
}