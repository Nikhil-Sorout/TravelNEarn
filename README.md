# Travel N Earn – Developer Documentation

## Introduction

**Travel N Earn** is a React Native application that connects travelers and customers for consignment delivery. Travelers can publish their travel plans, and customers can search for travelers to carry their consignments. The app features real-time tracking, profile management, KYC verification, payment handling, and a robust notification system.

---

## Project Structure Overview

```
trav/
  App.js
  Src/
    API/
    Components/
    Context/
    Customer Traveller/
    DLT/
    payment/
    Screens/
    Utils/
    styles.js
    header.js
    Images/
```

### Key Directories

#### 1. `API/`
- **Purpose:** Contains modules for all backend API interactions (authentication, address, feedback, location, profile, search).
- **Example:** `Login.js` handles OTP-based authentication, `Profile.js` manages user profile fetch and update, `Location.js` fetches location suggestions.

#### 2. `Components/`
- **Purpose:** Reusable UI components and error boundaries.
- **Example:** `ErrorBoundary.js` for global error handling, `MapFailsafeView.js` for map fallback UI, `SocketDebugOverlay.js` for socket debugging.

#### 3. `Context/`
- **Purpose:** Provides global state and socket management using React Context.
- **Files:**
  - `Context.js`: Manages notifications and unread count, provides a socket context.
  - `socketprovider.js`: Handles socket connection, reconnection, and exposes hooks for socket usage.

#### 4. `Customer Traveller/`
- **Purpose:** Contains screens and logic for the customer and traveler flows, including consignment search, request, details, and status updates.
- **Example:** `SearchRide.js` for searching available travelers, `ConsignmentDetails.js` for consignment info, `TravelDetails.js` for travel info and live tracking.

#### 5. `DLT/`
- **Purpose:** Handles KYC (Know Your Customer) verification, including Driving License and PAN card verification using external APIs.

#### 6. `payment/`
- **Purpose:** Handles payment logic and integration (e.g., payment handler for consignment/travel payments).

#### 7. `Screens/`
- **Purpose:** Main app screens, organized by user flow (Home, Menu, PublishConsignment, PublishTravel, Started, etc.).
- **Example:** 
  - `Home/`: Account, Notification, Publish, Search, Wallet.
  - `Menu/`: AddAddress, AddressBook, Profile, Help, Feedback, Policy screens.
  - `PublishConsignment/` and `PublishTravel/`: Flows for publishing consignments and travel plans.
  - `Started/`: Onboarding, OTP, Terms, Region selection, Verification.

#### 8. `Utils/`
- **Purpose:** Utility functions for address parsing, geocoding, responsive design, route calculations, and socket event monitoring.

#### 9. `styles.js`
- **Purpose:** Centralized common styles and color definitions for consistent theming.

#### 10. `header.js`
- **Purpose:** Custom header component styling.

---

## Application Flow

### 1. **Onboarding & Authentication**
- User starts at the onboarding screen (`Started/Start.js`), agrees to terms, and enters their phone number.
- OTP is sent and verified (`Started/Otp.js`).
- New users complete profile and KYC (`Started/Verification.js`, `DLT/Dlt.js`).

### 2. **Main Navigation**
- After login, users land on the main navigation (`Screens/BottomNavigation/Navigation.js`), which provides three main tabs:
  - **Search:** Find travelers or consignments.
  - **Publish:** Publish travel plans or consignments.
  - **Account:** Manage profile, view history, access support.

### 3. **Consignment & Travel Flows**
- **Customers** can search for travelers, view travel details, and send consignment requests.
- **Travelers** can publish travel plans, view consignment requests, and update status (including live tracking).

### 4. **Real-Time Features**
- **Socket.IO** is used for real-time notifications and live location tracking.
- The socket context is provided globally via `Context/socketprovider.js`.

### 5. **KYC & Profile**
- Users must verify their identity using Driving License and PAN card (`DLT/Dlt.js`).
- Profile management and image upload are handled in `Screens/Menu/Profile.js` and `API/Profile.js`.

### 6. **Payment**
- Payment flows are handled in `payment/paymenthandler.js` and related screens (`CustomerFlow/PayNowScreen.js`, etc.).

---

## Technical Highlights

### **API Layer**
- All backend communication is abstracted in the `API/` directory.
- Uses `axios` for HTTP requests.
- Handles authentication, profile, address, feedback, and search endpoints.

### **State & Socket Management**
- Global state (notifications, unread count) and socket connection are managed via React Context.
- Socket events include real-time notifications, location updates, and tracking.

### **UI & Theming**
- Common styles and color palette are defined in `styles.js`.
- Responsive design utilities in `Utils/responsive.js`.
- Custom headers and consistent UI components.

### **Utilities**
- Address parsing and geocoding (`Utils/addressResolver.js`).
- Route calculation and map utilities (`Utils/routeUtils.js`).
- Responsive scaling for different device sizes.

### **Testing & Debugging**
- Error boundaries and socket debug overlays are available in `Components/`.
- Address parsing can be tested via `Utils/addressParserTest.js`.

---

## How to Get Started as a Developer

1. **Setup:**
   - Install dependencies: `npm install`
   - Start the app: `npm start` (or use Expo if configured)
   - Ensure you have access to the backend API endpoints.

2. **Explore the Codebase:**
   - Start with `App.js` to understand the navigation and initial setup.
   - Review the `Screens/` directory for main user flows.
   - Check `API/` for backend integration logic.
   - Look at `Context/` for global state and socket management.

3. **Key Flows to Understand:**
   - Onboarding and authentication (OTP, KYC)
   - Publishing and searching for travel/consignments
   - Real-time tracking and notifications
   - Payment and wallet integration

4. **Styling and Theming:**
   - Use `styles.js` for common styles.
   - Use responsive utilities for cross-device compatibility.

5. **Extending Functionality:**
   - Add new API calls in `API/`.
   - Add new screens in `Screens/` and update navigation in `App.js`.
   - Use context for new global state or socket events.

---

## Additional Notes

- **Environment Variables:** API base URLs are set in AsyncStorage during app initialization.
- **Testing:** Use the test utilities in `Utils/` for address parsing and other helpers.
- **Error Handling:** Use `ErrorBoundary.js` for catching UI errors.

---

This documentation should serve as a solid starting point for any new developer joining the project. If you need a more detailed breakdown of any specific module or flow, please refer to the respective directory or file, or contact the project maintainer. 