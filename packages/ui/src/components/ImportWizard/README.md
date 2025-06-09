# Import Wizard Component

The Import Wizard is a multi-step component designed to streamline the process of importing various data formats into the TerraFusion platform. This component is part of the TerraFusion DevOps Kit and follows the platform's design and development standards.

## Features

- Multi-step wizard interface for data import
- File upload with drag-and-drop support
- Column mapping for CSV and Excel files
- Data validation with detailed error reporting
- Progress tracking during import process
- Responsive design for desktop and mobile

## Components

The Import Wizard consists of the following components:

- **ImportWizard** - Main container component that manages the wizard state and flow
- **Stepper** - Navigation component showing progress through wizard steps
- **FileUpload** - File selection and upload component with drag-and-drop support
- **ColumnMapper** - Interface for mapping source columns to destination fields
- **ValidationReport** - Display validation results with issue highlighting
- **ConfirmationStep** - Final step showing import summary and confirmation

## Usage

```tsx
import { ImportWizard } from '@/components/ImportWizard/ImportWizard';

function ImportPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Import Data</h1>
      <ImportWizard 
        importType="pacs" 
        onComplete={(result) => console.log('Import completed:', result)} 
      />
    </div>
  );
}
```

## Props

### ImportWizard Props

| Prop | Type | Description |
|------|------|-------------|
| `importType` | string | Type of data being imported (e.g., 'pacs', 'geospatial') |
| `onComplete` | (result: ImportResult) => void | Callback function called when import is complete |
| `initialStep` | number | (Optional) Initial step to display (defaults to 0) |
| `className` | string | (Optional) Additional CSS classes to apply |

## API Integration

The Import Wizard interacts with the following API endpoints:

- `POST /api/import/:type/upload` - Upload and validate a file
- `POST /api/import/:type/import` - Import validated data

See the [Import API Documentation](../../../docs/import-wizard-api.md) for details.

## Testing

To test the Import Wizard API endpoints:

```bash
# Run the API tests locally
./devops/test-import-api.sh

# Test against a deployed environment
./devops/test-import-api.sh https://your-deployment-url.com
```

## CI/CD Integration

The Import Wizard components and API are automatically tested in the CI/CD pipeline using the workflow defined in `.github/workflows/import-api-tests.yml`.

## Extending the Import Wizard

To add support for a new data type:

1. Add a new import type key in the `supportedImportTypes` object in `ImportWizard.tsx`
2. Create any custom validation or mapping logic in the backend for the new type
3. Update the API endpoints to handle the new type
4. Update the verification scripts and tests to include the new type