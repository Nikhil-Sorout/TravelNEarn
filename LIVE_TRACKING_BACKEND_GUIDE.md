# Live Tracking Backend Integration Guide

This guide explains how to integrate the enhanced socket provider with your backend for real-time consignment tracking.

## Required Socket Events

### Client to Server Events

#### 1. `joinTrackingRoom`
**Purpose**: Customer joins a tracking room to receive location updates
```javascript
socket.emit("joinTrackingRoom", {
  travelId: "travel123",
  consignmentId: "consignment456", 
  userType: "customer"
});
```

#### 2. `leaveTrackingRoom`
**Purpose**: Customer leaves a tracking room
```javascript
socket.emit("leaveTrackingRoom", {
  travelId: "travel123",
  consignmentId: "consignment456",
  userType: "customer"
});
```

### Server to Client Events

#### 1. `locationUpdate:${travelId}`
**Purpose**: Send rider's location to all customers tracking this travel
```javascript
// Server sends to room
io.to(`tracking_${travelId}`).emit(`locationUpdate:${travelId}`, {
  latitude: 28.7041,
  longitude: 77.1025,
  timestamp: new Date().toISOString(),
  accuracy: 10,
  heading: 45
});
```

#### 2. `trackingStarted`
**Purpose**: Confirm tracking has started
```javascript
socket.emit("trackingStarted", {
  consignmentId: "consignment456",
  travelId: "travel123",
  message: "Live tracking started successfully"
});
```

#### 3. `trackingError`
**Purpose**: Notify of tracking errors
```javascript
socket.emit("trackingError", {
  consignmentId: "consignment456",
  message: "Failed to start tracking",
  error: "Driver not connected"
});
```

## Backend Implementation Example (Node.js + Socket.io)

### 1. Socket Connection Handler
```javascript
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  const phoneNumber = socket.handshake.query.phoneNumber;
  const userType = socket.handshake.query.userType;
  
  // Store user info
  socket.userInfo = { phoneNumber, userType };
  
  // Handle tracking room join
  socket.on('joinTrackingRoom', async (data) => {
    try {
      const { travelId, consignmentId, userType } = data;
      const roomName = `tracking_${travelId}`;
      
      // Join the room
      socket.join(roomName);
      
      console.log(`${userType} ${phoneNumber} joined tracking room: ${roomName}`);
      
      // Store tracking relationship
      await storeTrackingRelationship(travelId, consignmentId, phoneNumber, userType);
      
      // Confirm tracking started
      socket.emit('trackingStarted', {
        consignmentId,
        travelId,
        message: 'Live tracking started successfully'
      });
      
      // If rider is already sending location, send latest location
      const latestLocation = await getLatestRiderLocation(travelId);
      if (latestLocation) {
        socket.emit(`locationUpdate:${travelId}`, latestLocation);
      }
      
    } catch (error) {
      console.error('Error joining tracking room:', error);
      socket.emit('trackingError', {
        consignmentId: data.consignmentId,
        message: 'Failed to start tracking',
        error: error.message
      });
    }
  });
  
  // Handle tracking room leave
  socket.on('leaveTrackingRoom', async (data) => {
    try {
      const { travelId, consignmentId } = data;
      const roomName = `tracking_${travelId}`;
      
      socket.leave(roomName);
      console.log(`User ${phoneNumber} left tracking room: ${roomName}`);
      
      // Remove tracking relationship
      await removeTrackingRelationship(travelId, consignmentId, phoneNumber);
      
    } catch (error) {
      console.error('Error leaving tracking room:', error);
    }
  });
  
  // Handle rider location updates (from rider app)
  socket.on('riderLocationUpdate', async (data) => {
    try {
      const { travelId, latitude, longitude, accuracy, heading } = data;
      
      // Validate rider is authorized for this travel
      const isAuthorized = await validateRiderForTravel(phoneNumber, travelId);
      if (!isAuthorized) {
        socket.emit('trackingError', { message: 'Unauthorized location update' });
        return;
      }
      
      const locationData = {
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
        accuracy: accuracy || null,
        heading: heading || null
      };
      
      // Store location in database
      await storeRiderLocation(travelId, locationData);
      
      // Broadcast to all customers tracking this travel
      io.to(`tracking_${travelId}`).emit(`locationUpdate:${travelId}`, locationData);
      
      console.log(`Location update broadcast for travel: ${travelId}`);
      
    } catch (error) {
      console.error('Error handling rider location update:', error);
      socket.emit('trackingError', {
        message: 'Failed to process location update',
        error: error.message
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Clean up any tracking relationships if needed
  });
});
```

### 2. Database Helper Functions
```javascript
// Store tracking relationship
async function storeTrackingRelationship(travelId, consignmentId, phoneNumber, userType) {
  // Implementation depends on your database
  // Store who is tracking what for analytics and cleanup
}

// Get latest rider location
async function getLatestRiderLocation(travelId) {
  // Return latest location for the travel if available
  // This helps when customer joins mid-journey
}

// Store rider location
async function storeRiderLocation(travelId, locationData) {
  // Store location with timestamp for history/analytics
}

// Validate rider authorization
async function validateRiderForTravel(riderPhoneNumber, travelId) {
  // Check if this rider is authorized to send location for this travel
  // Return true/false
}
```

### 3. Rider App Integration
The rider app should send location updates:
```javascript
// In rider app
navigator.geolocation.watchPosition(
  (position) => {
    const { latitude, longitude, accuracy, heading } = position.coords;
    
    socket.emit('riderLocationUpdate', {
      travelId: currentTravelId,
      latitude,
      longitude,
      accuracy,
      heading
    });
  },
  (error) => console.error('Location error:', error),
  {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 1000
  }
);
```

## Security Considerations

1. **Authorization**: Validate that users can only track their own consignments
2. **Rate Limiting**: Limit location update frequency to prevent spam
3. **Data Validation**: Validate all location data before broadcasting
4. **Room Management**: Clean up empty rooms and tracking relationships

## Frontend Usage

The enhanced socket provider automatically handles:
- ✅ Joining/leaving tracking rooms based on consignment status
- ✅ Reconnection and restoration of active tracking
- ✅ Error handling and user feedback
- ✅ Automatic cleanup on component unmount
- ✅ Persistent tracking across app restarts

## Testing

Use the tracking toggle button to manually start/stop tracking and verify:
1. Socket events are sent correctly
2. Location updates are received and displayed
3. Error states are handled gracefully
4. Tracking persists across app background/foreground 