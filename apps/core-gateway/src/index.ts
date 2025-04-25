import { startGateway } from './gateway';

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Start the Gateway
console.log('Starting TerraFusion Federation Gateway...');
startGateway().catch(error => {
  console.error('Failed to start gateway:', error);
  process.exit(1);
});