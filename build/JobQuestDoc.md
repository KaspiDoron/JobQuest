# JobQuest Application Technical Documentation

## Table of Contents

1. Core Classes
   - App
   - UIManager
   - JobManager
   - CategoryManager
   - FilterManager
2. UI-Related Classes
   - UIRendering
   - UIBinding
   - UIOverlay
   - UITheme
   - UILoading
3. Data Model Classes
   - Job
   - Category
   - Chip
   - Filter

## Core Classes

### App Class

The central controller managing application state and coordinating between components.

#### Properties

##### `uiManager: UIManager`

- **Purpose**: Primary interface for managing all UI operations and user interactions
- **Interaction**:
  - Coordinates with JobManager to display job data
  - Works with FilterManager to update UI based on filter changes
  - Manages loading states and error displays
- **Usage Example**:

```javascript
// Initialize UI components and bind events
this.uiManager.initializeApp();
// Display error messages
this.uiManager.displayError(errorConfig);
```

- **Implementation Impact**:
  - Critical for UI updates - modifications could affect entire application display
  - Changes should be carefully tested across all UI components

##### `errorMessages: Object`

- **Purpose**: Centralizes error message configuration and management
- **Interaction**: Used by UIManager to display appropriate error messages
- **Usage Example**:

```javascript
const errorConfig = this.errorMessages.fetchingJobs;
this.uiManager.displayError(errorConfig);
```

- **Implementation Impact**:
  - Affects error handling throughout application
  - Modifications should maintain consistent error reporting

#### Methods

##### `initializeApp(): Promise<void>`

- **Purpose**: Bootstraps application by initializing all required components
- **Interaction**:
  - Calls CategoryManager to fetch initial categories
  - Triggers JobManager to load initial jobs
  - Sets up UI components through UIManager
- **Usage Example**:

```javascript
document.addEventListener("DOMContentLoaded", async () => {
  const app = new App();
  await app.initializeApp();
});
```

- **Implementation Impact**:
  - Critical startup sequence - changes affect entire application
  - Must maintain proper initialization order

##### `handleSearchingEvent(eventTarget, source, filterKey, filterValue, id, isActive): Promise<void>`

- **Purpose**: Central handler for search and filter operations
- **Interaction**:
  - Coordinates between FilterManager and JobManager
  - Updates UI state through UIManager
  - Manages loading states
- **Usage Example**:

```javascript
searchButton.addEventListener("click", () => {
  this.handleSearchingEvent(
    searchInput,
    "searchbar",
    "category",
    "Frontend",
    null,
    false
  );
});
```

- **Implementation Impact**:
  - Core search functionality - changes affect main user interaction
  - Must maintain performance with large datasets

### UIManager Class

Manages all UI-related operations and coordinates UI subcomponents.

#### Properties

##### `uiRendering: UIRendering`

- **Purpose**: Handles DOM manipulation and content rendering
- **Interaction**:
  - Takes data from JobManager
  - Updates DOM through targeted manipulations
- **Usage Example**:

```javascript
this.uiRendering.renderJobs(jobs, filterKey, filterValue);
```

- **Implementation Impact**:
  - Direct DOM updates - performance critical
  - Changes affect visual presentation

### JobManager Class

Handles job-related operations and data management.

#### Properties

##### `apiEndpoint`: String

- **Purpose**: API endpoint for job data
- **Example**: "https://remotive.com/api/remote-jobs"

##### `jobsDisplayed`: Array

- **Purpose**: Currently visible jobs
- **Interaction**: Updated by FilterManager when filters change
- **Example**: Shows filtered jobs when user selects a category

#### Methods

##### `fetchJobs(source, filterKey, filterValue, limit)`

- **Purpose**: Retrieves jobs from API based on filters
- **Interaction**: Used by App class during search/filter operations
- **Example**: `jobManager.fetchJobs('searchbar', 'location', 'USA', 10)`

### CategoryManager Class

Manages job categories and filtering options.

#### Properties

##### `categories`: Array

- **Purpose**: Available job categories
- **Interaction**: Used by FilterManager for validation
- **Example**: ['Frontend', 'Backend', 'DevOps']

#### Methods

##### `fetchCategories()`

- **Purpose**: Retrieves available job categories
- **Interaction**: Called during app initialization
- **Example**: `categoryManager.fetchCategories()` populates category chips

### FilterManager Class

Handles filter state and operations.

#### Properties

##### `activeFilters`: Array

- **Purpose**: Currently applied filters
- **Interaction**: Used by JobManager to filter displayed jobs
- **Example**: [{key: 'category', value: 'Frontend'}, {key: 'location', value: 'Remote'}]

#### Methods

##### `toggleActiveFilter(eventTarget, id, filterKey, filterValue, isActive)`

- **Purpose**: Toggles filter state
- **Interaction**: Updates UI through UIManager when filters change
- **Example**: Called when user clicks filter chip - `filterBtn.addEventListener('click', toggleActiveFilter)`

## Data Model Classes

### Job Class

Represents a job posting.

#### Properties

##### `title`: String

- **Purpose**: Job title
- **Example**: "Senior Frontend Developer"

##### `company`: String

- **Purpose**: Company name
- **Example**: "TechCorp Inc"

#### Methods

##### `validateAndFormatDate(dateString)`

- **Purpose**: Formats posting date
- **Example**: Converts "2024-01-15" to "Jan 15, 2024"

### Filter Class

Represents a job filter.

#### Properties

##### `key`: String

- **Purpose**: Filter type
- **Example**: "category", "location"

##### `value`: String

- **Purpose**: Filter value
- **Example**: "Frontend", "Remote"

## Data Flow Examples

1. User Searches for Jobs:

```javascript
// User enters "Frontend" in search
searchBar.value = "Frontend";
// App handles search
app.handleSearchingEvent(
  searchBar,
  "searchbar",
  "category",
  "Frontend",
  null,
  false
);
// JobManager fetches filtered jobs
jobManager.fetchJobs("search", "category", "Frontend");
// UIManager updates display
uiManager.updateUI(filteredJobs, null, null, "category", "Frontend");
```

2. User Toggles Filter:

```javascript
// User clicks category filter
filterBtn.addEventListener("click", () => {
  // FilterManager updates state
  filterManager.toggleActiveFilter(
    filterBtn,
    "filter1",
    "category",
    "Backend",
    false
  );
  // JobManager updates displayed jobs
  jobManager.removeActiveFiltersJobs("category", "Backend");
  // UIManager refreshes view
  uiManager.updateUI(displayedJobs, null, null, null, null);
});
```
