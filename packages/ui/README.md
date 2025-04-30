# TerraFusion UI Components

This package contains atomic design components for the TerraFusion platform following best practices from the TerraFusion Developer Kit.

## Atomic Design Structure

Components are organized following the Atomic Design methodology:

- **Atoms**: Fundamental building blocks (buttons, inputs, icons, etc.)
- **Molecules**: Groups of atoms working together (form fields, search bars, etc.)
- **Organisms**: Complex UI components composed of molecules and atoms (navigation bars, forms, etc.)

## Using Components

Import components from their respective categories:

```tsx
// Import atoms
import { Button } from '@packages/ui/atoms';

// Import molecules
import { FormField } from '@packages/ui/molecules';

// Import organisms
import { NavigationBar } from '@packages/ui/organisms';
```

## Development Guidelines

When creating new components:

1. Place each component in the appropriate category based on its complexity
2. Ensure components are fully typed with TypeScript
3. Use Tailwind CSS for styling
4. Create Storybook stories for visual testing
5. Include unit tests for complex components