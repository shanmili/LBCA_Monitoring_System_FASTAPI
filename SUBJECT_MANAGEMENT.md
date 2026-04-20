# Subject Management - Frontend Implementation

## Overview
A complete subject management system for the class management module, following the backend API logic from the FastAPI server. Subjects are linked to grade levels and can be managed through an intuitive interface.

## Architecture

### Components

#### 1. **SubjectTable.jsx** (`src/components/modules/setup/SubjectTable.jsx`)
Main component displaying subjects organized by grade level.

**Features:**
- Collapsible accordion view grouped by grade level
- Real-time subject listing with status indicators
- Add/Edit/Delete functionality
- Error handling and retry mechanism
- Responsive table layout

**Props:** None (uses hooks internally)

**State Management:**
- Uses `useSubjectState` hook for core logic
- Fetches grade levels and subjects on mount
- Manages modal state for CRUD operations

#### 2. **SubjectModal.jsx** (`src/components/modules/setup/SubjectModal.jsx`)
Modal form for creating and editing subjects.

**Fields:**
- **Grade Level** - Required dropdown
- **Subject Name** - Required text input (e.g., "Mathematics")
- **Subject Code** - Required unique code (e.g., "MATH101")
- **Active Status** - Toggle checkbox

**Features:**
- Form validation with error messages
- Duplicate subject code detection
- Auto-enable/disable based on saving state
- Matches backend validation rules

#### 3. **useSubjectState.js** (`src/hooks/useSubjectState.js`)
Custom hook managing subject state and API interactions.

**State Variables:**
- `subjects` - Array of all subjects
- `loading` - Loading state
- `error` - Error message
- `modalOpen` - Modal visibility
- `editingItem` - Currently editing subject
- `saving` - Save operation state

**Methods:**
- `fetchSubjects(gradeLevelId)` - Fetch subjects, optionally filtered by grade
- `handleDelete(id)` - Delete subject with confirmation
- `handleSave(data)` - Create or update subject
- `openModal(item)` - Open modal for adding/editing
- `setModalOpen` - Control modal visibility

### API Integration

#### API Endpoints (`src/services/api.js`)
```javascript
export const subjectApi = {
  list: (gradeLevelId = null) => request(...),
  get: (id) => request(...),
  create: (data) => request(...),
  update: (id, data) => request(...),
  delete: (id) => request(...),
};
```

**Query Parameters:**
- `gradeLevelId` - Optional filter for listing subjects by grade level

**Data Structure:**
```json
{
  "subject_id": 1,
  "grade_level_id": 1,
  "subject_name": "Mathematics",
  "subject_code": "MATH101",
  "is_active": true
}
```

### Styling

#### Main Stylesheet (`src/styles/setup/SubjectTable.css`)

**Key Classes:**
- `.subject-section` - Main container
- `.subject-header` - Header with title and add button
- `.subject-accordion` - Accordion container
- `.subject-table` - Table display
- `.subject-badge` - Status badge (active/inactive)
- `.subject-btn-*` - Action buttons

**Responsive Design:**
- Mobile breakpoint: 768px
- Adapts to single-column layout on small screens
- Touch-friendly button sizes

## Data Flow

```
SetupPage
├── SubjectTable (mounted)
│   ├── useSubjectState (hook)
│   │   └── subjectApi (service)
│   │       └── FastAPI Backend
│   ├── SubjectModal
│   │   └── Form submission → handleSave()
│   └── Display subjects grouped by grade level
```

## Error Handling

1. **Duplicate Subject Code**
   - Backend returns 400 error
   - Modal displays "Subject code must be unique" message
   - Form field highlighted as error

2. **Network Errors**
   - Top-level error banner with retry button
   - Specific error messages displayed to user

3. **Validation**
   - Client-side validation before submission
   - Required field checks
   - Error messages under each field

## Features

### ✅ Implemented
- [x] List subjects by grade level
- [x] Create new subject with validation
- [x] Edit existing subject
- [x] Delete subject with confirmation
- [x] Toggle subject active status
- [x] Unique subject code enforcement
- [x] Error handling and recovery
- [x] Responsive design
- [x] Collapsible grade level sections
- [x] Status badges (Active/Inactive)

### 🔄 Integration Points
- Integrates with existing `SetupPage.jsx`
- Uses consistent styling with other setup components
- Follows same modal pattern as `SectionModal` and `GradeLevelModal`
- Compatible with existing grade level management

## Backend Validation

The frontend follows backend validation rules:

| Field | Rule | Constraint |
|-------|------|-----------|
| grade_level_id | Required | Must exist in grade_levels |
| subject_name | Required | String (max 255 chars) |
| subject_code | Required + Unique | String (max 50 chars) |
| is_active | Optional | Boolean (default: true) |

## Usage Example

To display subject management in the class management setup:

```jsx
import SetupPage from './components/modules/setup/SetupPage';

function ClassManagement() {
  return <SetupPage />;
}
```

The SubjectTable is automatically rendered as part of SetupPage and requires no additional configuration.

## Future Enhancements

- [ ] Bulk operations (import/export subjects)
- [ ] Subject prerequisites management
- [ ] Subject to teacher assignment
- [ ] Subject description/notes field
- [ ] Search and filter functionality
- [ ] Subject templates by grade level
- [ ] Duplicate subject detection warnings

## Technical Notes

- Uses React hooks for state management (no Redux needed)
- Async/await for API calls
- Error boundaries could be added for robustness
- Could benefit from pagination for large subject lists
- Modal styling reuses SetupModal.css for consistency
