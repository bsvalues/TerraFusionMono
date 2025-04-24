# Test Images for Crop Analysis

This directory contains test images that can be used with the OpenAI integration for crop analysis.

## Usage Instructions

1. Place your crop image files in this directory
2. Run the test script with:
   ```
   node ../test-openai.js ./your-image-filename.jpg
   ```
3. To test the API endpoint instead of directly using OpenAI:
   ```
   node ../test-openai.js ./your-image-filename.jpg --api
   ```

## Sample Images

You should use real crop images for testing. The OpenAI vision model works best with clear, well-lit photos of crops showing signs of health or disease.

Example image types to use:
- Close-up of crop leaves showing possible disease spots
- Field photos showing overall crop growth patterns
- Images of crops with nutrient deficiencies
- Photos of crops affected by pests

## Notes for Effective Results

- Use high-resolution images whenever possible
- Ensure good lighting conditions in the photos
- Include different angles/views of the same crop for better diagnosis
- If testing nutrient deficiencies, include both affected and healthy parts
- For best results with disease identification, capture clear images of the symptoms

The OpenAI analysis will use visual cues to identify crop type, health status, potential issues, and recommend actions for farmers.