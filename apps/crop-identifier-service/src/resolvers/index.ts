import axios from 'axios';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Base URL for the REST API
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// Helper function to fetch data from the REST API
async function fetchFromApi(endpoint: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}${endpoint}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching from API (${endpoint}):`, error.message);
    throw new Error(`Failed to fetch data: ${error.message}`);
  }
}

// Helper function to post data to the REST API
async function postToApi(endpoint: string, data: any) {
  try {
    const response = await axios.post(`${API_BASE_URL}${endpoint}`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Error posting to API (${endpoint}):`, error.message);
    throw new Error(`Failed to post data: ${error.message}`);
  }
}

// List of common crops for database queries
const commonCrops = [
  {
    name: 'Corn (Maize)',
    scientificName: 'Zea mays',
    family: 'Poaceae',
    growingRegions: ['North America', 'South America', 'Europe', 'Asia', 'Africa'],
    growthStages: [
      {
        name: 'Germination',
        description: 'Seed absorbs water and begins to grow',
        typicalDuration: '4-10 days',
        visualIndicators: ['Emergence of coleoptile', 'First leaf visible']
      },
      {
        name: 'Vegetative',
        description: 'Plant develops stems and leaves',
        typicalDuration: '30-60 days',
        visualIndicators: ['Multiple leaf stages', 'Rapid stem elongation']
      },
      {
        name: 'Reproductive',
        description: 'Plant produces flowers, tassels and ears',
        typicalDuration: '20-30 days',
        visualIndicators: ['Tassel emergence', 'Silking', 'Pollination']
      },
      {
        name: 'Grain filling',
        description: 'Kernels develop and mature',
        typicalDuration: '35-45 days',
        visualIndicators: ['Milk stage', 'Dough stage', 'Dent stage']
      },
      {
        name: 'Maturity',
        description: 'Plant reaches physiological maturity',
        typicalDuration: '7-14 days',
        visualIndicators: ['Black layer formation', 'Leaf senescence', 'Dry down']
      }
    ],
    typicalCharacteristics: ['Tall upright stalks', 'Broad leaves', 'Male tassels at top', 'Female ears on sides'],
    commonVarieties: ['Sweet corn', 'Dent corn', 'Flint corn', 'Popcorn', 'Waxy corn']
  },
  {
    name: 'Wheat',
    scientificName: 'Triticum aestivum',
    family: 'Poaceae',
    growingRegions: ['North America', 'Europe', 'Asia', 'Australia', 'South America'],
    growthStages: [
      {
        name: 'Germination and Seedling',
        description: 'Seed germinates and seedling emerges',
        typicalDuration: '7-14 days',
        visualIndicators: ['First leaf emergence', 'Tillering begins']
      },
      {
        name: 'Tillering',
        description: 'Multiple stems develop from main shoot',
        typicalDuration: '20-30 days',
        visualIndicators: ['Multiple stems', 'Increase in leaf number']
      },
      {
        name: 'Stem Extension',
        description: 'Stem grows taller and joints form',
        typicalDuration: '20-30 days',
        visualIndicators: ['Nodes visible', 'Rapid height increase']
      },
      {
        name: 'Heading and Flowering',
        description: 'Heads emerge and flowering occurs',
        typicalDuration: '10-15 days',
        visualIndicators: ['Spike emergence', 'Anthers visible']
      },
      {
        name: 'Grain Fill and Ripening',
        description: 'Kernels develop and mature',
        typicalDuration: '25-35 days',
        visualIndicators: ['Milk stage', 'Dough stage', 'Hard kernel']
      }
    ],
    typicalCharacteristics: ['Narrow leaves', 'Hollow stems', 'Terminal spike or head', 'Multiple tillers'],
    commonVarieties: ['Hard red winter', 'Hard red spring', 'Soft red winter', 'Durum', 'White wheat']
  }
];

// GraphQL resolvers
export const resolvers = {
  Query: {
    // Crop Identification Queries
    cropIdentification: async (_: any, { id }: { id: string }) => {
      try {
        const response = await fetchFromApi(`/api/crop-identifications/${id}`);
        return response.identification;
      } catch (error) {
        console.error(`Error fetching crop identification with ID ${id}:`, error);
        throw error;
      }
    },
    
    cropIdentifications: async (_: any, { 
      userId, 
      limit, 
      parcelId 
    }: { 
      userId: number;
      limit?: number;
      parcelId?: string;
    }) => {
      try {
        let url = `/api/crop-identifications?userId=${userId}`;
        if (limit) url += `&limit=${limit}`;
        if (parcelId) url += `&parcelId=${parcelId}`;
        
        const response = await fetchFromApi(url);
        return response.identifications;
      } catch (error) {
        console.error(`Error fetching crop identifications for user ${userId}:`, error);
        throw error;
      }
    },
    
    cropIdentificationHistory: async (_: any, { userId }: { userId: number }) => {
      try {
        const identifications = await fetchFromApi(`/api/crop-identifications?userId=${userId}&limit=100`);
        
        // Process the identifications to create history statistics
        const identificationsList = identifications.identifications || [];
        
        // Count occurrences of each crop type
        const cropCounts: Record<string, number> = {};
        identificationsList.forEach((identification: any) => {
          const cropName = identification.cropName;
          cropCounts[cropName] = (cropCounts[cropName] || 0) + 1;
        });
        
        // Create frequency list
        const totalIdentifications = identificationsList.length;
        const frequentCrops = Object.entries(cropCounts).map(([cropName, count]) => ({
          cropName,
          count,
          percentage: (count / totalIdentifications) * 100
        })).sort((a, b) => b.count - a.count);
        
        // Group by month
        const monthCounts: Record<string, number> = {};
        identificationsList.forEach((identification: any) => {
          const date = new Date(identification.timestamp);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthCounts[key] = (monthCounts[key] || 0) + 1;
        });
        
        // Create monthly counts
        const identificationsByMonth = Object.entries(monthCounts).map(([yearMonth, count]) => {
          const [year, month] = yearMonth.split('-');
          return {
            month: getMonthName(parseInt(month)),
            year: parseInt(year),
            count
          };
        }).sort((a, b) => {
          // Sort by year (descending) then by month (descending)
          if (a.year !== b.year) return b.year - a.year;
          return getMonthIndex(b.month) - getMonthIndex(a.month);
        });
        
        return {
          userId,
          totalIdentifications,
          recentIdentifications: identificationsList.slice(0, 10), // Latest 10
          frequentCrops,
          identificationsByMonth
        };
      } catch (error) {
        console.error(`Error fetching crop identification history for user ${userId}:`, error);
        throw error;
      }
    },
    
    // Crop Database Queries
    cropDatabase: async (_: any, { filter }: { filter?: string }) => {
      try {
        // For the MVP, we'll return a static list of crops
        // In a real implementation, this would come from a database
        let cropTypes = commonCrops;
        
        // Apply filter if provided
        if (filter) {
          const filterLower = filter.toLowerCase();
          cropTypes = cropTypes.filter(crop => 
            crop.name.toLowerCase().includes(filterLower) || 
            crop.scientificName.toLowerCase().includes(filterLower) ||
            crop.family.toLowerCase().includes(filterLower) ||
            crop.growingRegions.some(region => region.toLowerCase().includes(filterLower)) ||
            crop.typicalCharacteristics.some(char => char.toLowerCase().includes(filterLower)) ||
            crop.commonVarieties.some(variety => variety.toLowerCase().includes(filterLower))
          );
        }
        
        return {
          cropTypes,
          count: cropTypes.length
        };
      } catch (error) {
        console.error(`Error fetching crop database:`, error);
        throw error;
      }
    },
    
    cropType: async (_: any, { name }: { name: string }) => {
      try {
        // Find the specified crop in our dataset
        const crop = commonCrops.find(c => 
          c.name.toLowerCase() === name.toLowerCase() || 
          c.scientificName.toLowerCase() === name.toLowerCase()
        );
        
        if (!crop) {
          throw new Error(`Crop type '${name}' not found in database`);
        }
        
        return crop;
      } catch (error) {
        console.error(`Error fetching crop type '${name}':`, error);
        throw error;
      }
    }
  },
  
  Mutation: {
    // Crop Identification Mutations
    identifyCrop: async (_: any, { 
      userId,
      parcelId,
      imageBase64
    }: { 
      userId: number;
      parcelId?: string;
      imageBase64: string;
    }) => {
      try {
        // Create a FormData object for the file upload
        const formData = new FormData();
        formData.append('userId', userId.toString());
        if (parcelId) formData.append('parcelId', parcelId);
        
        // Convert base64 to blob
        const imageBuffer = Buffer.from(imageBase64, 'base64');
        const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
        formData.append('image', blob, 'crop-image.jpg');
        
        // If API fails or is not available, use OpenAI directly
        try {
          // Call the REST API
          const response = await postToApi('/api/crop-identification', formData);
          return {
            success: true,
            identification: response.identification
          };
        } catch (apiError) {
          console.error('REST API failed for crop identification, using OpenAI directly:', apiError);
          
          // Use OpenAI directly
          const response = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
            messages: [
              {
                role: "system",
                content: 
                  "You are an agricultural expert specializing in crop identification. " +
                  "Analyze the provided crop image and identify the crop type. " +
                  "Structure your response as detailed JSON with the following fields: " +
                  "cropName (string), scientificName (string), confidence (0-1), " +
                  "estimatedGrowthStage (string), details (string), characteristics (array of strings), " +
                  "and possibleAlternatives (array of strings).",
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: 'Identify this crop from the image.'
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/jpeg;base64,${imageBase64}`
                    }
                  }
                ],
              },
            ],
            response_format: { type: "json_object" },
          });
          
          // Process the OpenAI response
          const content = response.choices[0].message.content || '{}';
          const cropData = JSON.parse(content);
          
          // Create a mock identification object
          const identification = {
            id: `id-${Date.now()}`,
            userId,
            parcelId,
            cropName: cropData.cropName,
            scientificName: cropData.scientificName,
            confidence: cropData.confidence,
            estimatedGrowthStage: cropData.estimatedGrowthStage,
            details: cropData.details,
            characteristics: cropData.characteristics || [],
            possibleAlternatives: cropData.possibleAlternatives || [],
            timestamp: new Date().toISOString(),
            verified: false
          };
          
          return {
            success: true,
            identification
          };
        }
      } catch (error: any) {
        console.error('Error identifying crop:', error);
        return {
          success: false,
          message: `Failed to identify crop: ${error.message}`
        };
      }
    },
    
    // Feedback Mutations
    verifyCropIdentification: async (_: any, { 
      id,
      userId,
      verified,
      feedback
    }: { 
      id: string;
      userId: number;
      verified: boolean;
      feedback?: string;
    }) => {
      try {
        // Call the REST API to update the identification
        const response = await postToApi(`/api/crop-identifications/${id}`, {
          userId,
          verified,
          feedback
        });
        
        return response.identification;
      } catch (error: any) {
        console.error(`Error verifying crop identification ${id}:`, error);
        throw new Error(`Failed to verify crop identification: ${error.message}`);
      }
    }
  },
  
  // Reference resolvers for federation
  CropIdentification: {
    __resolveReference: async (reference: { id: string }) => {
      const { id } = reference;
      try {
        const response = await fetchFromApi(`/api/crop-identifications/${id}`);
        return response.identification;
      } catch (error) {
        console.error(`Error resolving reference for crop identification ${id}:`, error);
        throw error;
      }
    }
  }
};

// Helper functions
function getMonthName(monthNumber: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[monthNumber - 1] || 'Unknown';
}

function getMonthIndex(monthName: string): number {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames.indexOf(monthName);
}