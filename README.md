# Patient CRUD Management System

A React-based patient management application built with TypeScript that allows medical staff to create, read, update, and delete patient records.

## 📋 Features

- **View Patients**: Display all patients in a card-based layout
- **Add Patient**: Create new patient records with name, email, and age
- **Edit Patient**: Modify existing patient information inline
- **Delete Patient**: Remove patients from the system
- **Form Validation**: Basic validation to ensure all fields are completed
- **Loading States**: Visual feedback during API operations

## 🖼️ Interface Screenshot

```
┌─────────────────────────────────────────────────┐
│                Patient Manager                   │
├─────────────────────────────────────────────────┤
│ [Name Input    ] [Email Input     ] [Age Input] │
│ [Add Patient Button]                            │
├─────────────────────────────────────────────────┤
│ Loading...                                      │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ John Doe                                    │ │
│ │ Email: john@example.com                     │ │
│ │ Age: 30                                     │ │
│ │ [Edit] [Delete]                             │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Jane Smith                                  │ │
│ │ Email: jane@example.com                     │ │
│ │ Age: 25                                     │ │
│ │ [Edit] [Delete]                             │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## 🏗️ Architecture Diagram

```mermaid
graph TD
    A[PatientManager Component] --> B[useState Hooks]
    A --> C[useEffect Hook]
    A --> D[API Functions]
    
    B --> E[patients: Patient[]]
    B --> F[Form State: name, email, age]
    B --> G[editingId: number | null]
    B --> H[loading: boolean]
    
    C --> I[fetchPatients on mount]
    
    D --> J[GET /patients]
    D --> K[POST /patients]
    D --> L[PUT /patients/:id]
    D --> M[DELETE /patients/:id]
    
    J --> N[Hospital API Server]
    K --> N
    L --> N
    M --> N
    
    A --> O[Render UI]
    O --> P[Form Inputs]
    O --> Q[Patient Cards]
    O --> R[Action Buttons]
    
    style A fill:#e1f5fe
    style N fill:#fff3e0
    style O fill:#f3e5f5
```

## 🔄 Data Flow

1. **Component Mount**: `useEffect` triggers `fetchPatients()` to load initial data
2. **User Input**: Form inputs update local state via `onChange` handlers
3. **CRUD Operations**: 
   - **Create**: `addPatient()` → POST request → Update local state
   - **Read**: `fetchPatients()` → GET request → Set patients state
   - **Update**: `updatePatient()` → PUT request → Update local state
   - **Delete**: `deletePatient()` → DELETE request → Filter local state
4. **State Updates**: Component re-renders with new data

## 🧪 Testing

The application includes Jest unit tests using React Testing Library:

- ✅ Component rendering tests
- ✅ User interaction tests
- ✅ Form validation tests
- ✅ CRUD operation tests
- ✅ Mock API integration

### Running Tests

```bash
npm test
```

### Test Coverage
- Component rendering and basic UI elements
- Form input handling and validation
- Add patient functionality
- Delete patient functionality
- Edit mode activation

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Start development server
npm start
```

### API Endpoints

The application expects the following REST API endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/patients` | Fetch all patients |
| POST | `/patients` | Create new patient |
| PUT | `/patients/:id` | Update patient by ID |
| DELETE | `/patients/:id` | Delete patient by ID |

### Patient Data Model

```typescript
interface Patient {
  id: number;
  name: string;
  email: string;
  age: number;
}
```

## 📁 Project Structure

```
src/
├── PatientManager.tsx          # Main component
├── PatientManager.test.tsx     # Jest tests
└── types/
    └── Patient.ts             # TypeScript interfaces
```

## 🔧 Technology Stack

- **Frontend**: React 18, TypeScript
- **Testing**: Jest, React Testing Library
- **HTTP Client**: Fetch API
- **Styling**: Inline styles (basic implementation)

## 📝 Notes

This is a basic implementation designed for educational purposes. In a production environment, consider:

- Proper error handling and user feedback
- Loading states for individual operations
- Form validation library (e.g., Formik, React Hook Form)
- CSS-in-JS or styled-components for styling
- State management library for complex scenarios
- Accessibility improvements
- Pagination for large datasets