# Shared

Shared TypeScript types and utilities for inchantedFormsDesigner monorepo.

## 📁 Structure

```
shared/
├── types/                       # TypeScript interfaces
│   └── forms.ts                # Form-related types
│
└── utils/                      # Utility functions
    └── validation.ts           # Validation helpers
```

## 🎯 Usage

Import types and utilities in frontend and backend:

```typescript
import type { FormDesignerData } from '@shared/types';
import { validateForm } from '@shared/utils';
```

## 📝 Adding New Types

Add new types in the `types/` directory.

## 📝 Adding New Utilities

Add new utilities in the `utils/` directory.
