# TerraField Mobile Integration

TerraField is a mobile companion app for the AppraisalCore platform, designed for real estate appraisers working in the field. It provides offline-first capabilities for data collection, photo capture, and property assessment.

## Key Features

### 1. Offline-First Data Synchronization

TerraField uses Conflict-free Replicated Data Types (CRDT) to enable robust offline-first operation:

- Create and edit data without an internet connection
- Automatic synchronization when connectivity is restored
- Conflict resolution using CRDT merge algorithms
- Real-time updates via WebSocket when online

### 2. AI-Powered Photo Enhancement

The app integrates with OpenAI and Anthropic for advanced photo processing:

- Automatic lighting and perspective correction
- Property feature detection and identification
- Image quality improvements
- Removal of distracting elements

### 3. Field Data Collection

Comprehensive tools for collecting property data in the field:

- Parcel notes with offline capabilities
- Photo management with metadata
- GPS location integration
- Date and time tracking
- Offline queuing and batch synchronization

## Architecture

### Mobile App (React Native)

- **ApiService**: Handles all REST and WebSocket communication with the backend
- **PhotoSyncService**: Manages offline photo synchronization
- **CRDT Package**: Shared between client and server for data synchronization
- **Screens**:
  - **HomeScreen**: Dashboard of reports and properties
  - **ParcelDetailScreen**: Property details and notes
  - **PhotoEnhancementScreen**: AI-powered photo improvements
  - **ParcelNoteScreen**: CRDT-backed collaborative notes

### Backend (Node.js/Express)

- **Photo Sync Routes**: CRDT-based endpoints for photo synchronization
- **Photo Enhancement Service**: AI integration for photo processing
- **WebSocket Server**: Real-time data synchronization
- **Database Integration**: PostgreSQL storage for synchronized data

## Implementation Details

### CRDT Implementation (packages/crdt)

The core library providing Conflict-free Replicated Data Types functionality:

```typescript
// Creating a photo store
const photoStore = createPhotoStore('report123');

// Adding a photo
const photoId = addPhoto(photoStore.store, {
  id: 'photo1',
  reportId: 'report123',
  photoType: 'SUBJECT',
  caption: 'Front view',
  dateTaken: new Date().toISOString(),
  latitude: 37.7749,
  longitude: -122.4194,
  isOffline: true,
  status: 'pending'
});

// Updating photo metadata
updatePhotoMetadata(photoStore.store, photoId, {
  caption: 'Updated caption'
});

// Syncing with server
const encodedUpdate = encodeDocUpdate(photoStore.doc);
const response = await fetch('/api/sync/reports/123/photos', {
  method: 'POST',
  body: JSON.stringify({ update: encodedUpdate })
});
const { mergedUpdate } = await response.json();
applyEncodedUpdate(photoStore.doc, mergedUpdate);
```

### WebSocket Integration

Real-time updates are handled via WebSocket connections:

```typescript
// Server-side
const wss = new WebSocketServer({ 
  server: httpServer, 
  path: '/ws' 
});

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    switch (data.type) {
      case 'join':
        // Join a specific document
        break;
      case 'update':
        // Apply and broadcast update
        break;
    }
  });
});

// Client-side
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${window.location.host}/ws`;
const ws = new WebSocket(wsUrl);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'update') {
    // Apply update to local doc
  }
};
```

### AI Photo Enhancement

Integration with OpenAI and Anthropic for image processing:

```typescript
// Enhance photo using OpenAI
const response = await openai.images.edit({
  model: 'dall-e-3',
  image: Buffer.from(base64Image, 'base64'),
  prompt: 'Enhance this real estate property photo, improve lighting, correct perspective distortion',
  n: 1,
  size: '1024x1024',
  quality: 'standard',
  response_format: 'b64_json',
});

// Analyze photo using Anthropic
const response = await anthropic.messages.create({
  model: 'claude-3-7-sonnet-20250219',
  max_tokens: 1024,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Analyze this property photo and identify key features.' },
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } }
      ]
    }
  ],
});
```

## Testing

The implementation includes comprehensive testing capabilities:

- **PhotoSyncTestPage**: Web interface for testing CRDT synchronization
- **CRDTTestPage**: Testing parcel note synchronization
- **PhotoEnhancementPage**: Testing AI photo enhancement capabilities

## Future Enhancements

Planned future enhancements for the TerraField mobile integration:

1. **Push Notifications**: Real-time alerts for synchronization status and collaborative changes
2. **Offline Maps**: Downloaded property maps for navigation without internet
3. **Voice Notes**: AI-powered transcription for spoken property observations
4. **Multi-User Collaboration**: Real-time field collaboration between multiple appraisers
5. **Enhanced Analytics**: AI-driven insights from collected field data

## Getting Started

1. Start the backend server: `npm run dev` in the root directory
2. Access the web testing interface at `https://localhost:5000/photo-sync-test`
3. For mobile app development, navigate to `apps/terrafield-mobile` and run:
   ```
   npm install
   npx expo start
   ```

4. Connect to the Expo development server using the Expo Go app on your device or emulator

## API Documentation

For detailed API documentation, see [docs/TerraFieldMobileIntegration.md](docs/TerraFieldMobileIntegration.md).