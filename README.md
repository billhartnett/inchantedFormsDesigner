# inchantedFormsDesigner

A professional monorepo for form design and management tools built with React, TypeScript, and Konva.js

## 📁 Monorepo Structure

```
inchantedFormsDesigner/                (monorepo root)
│
├── frontend/                          (React + TypeScript application)
│   ├── src/
│   │   ├── components/
│   │   │   ├── FormDesigner.tsx       ⭐ Main Konva form designer
│   │   │   └── FormDesigner.css
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                           (API and services)
│   ├── api/                          (Azure Functions / Express API)
│   └── services/                     (Business logic, utilities)
│
├── shared/                           (Shared code across workspaces)
│   ├── types/                       (TypeScript interfaces, types)
│   └── utils/                       (Utility functions)
│
├── docs/                            (Project documentation)
│
├── package.json                     (Root workspace configuration)
├── .gitignore
└── README.md
```

## 🎯 Projects

### Frontend (`/frontend`)
React + TypeScript application with the FormDesigner component using Konva.js

**Key Features:**
- ✅ Professional form designer component
- ✅ Drag & drop text fields and checkboxes
- ✅ Background image support
- ✅ JSON save/load
- ✅ PNG export
- ✅ Responsive design
- ✅ Full TypeScript support

**Quick Start:**
```bash
cd frontend
npm install
npm run dev
```

### Backend (`/backend`)
API and services for form management

**Planned Features:**
- API endpoints for form storage
- Form validation services
- User management
- Database integration

### Shared (`/shared`)
Shared TypeScript types and utilities used across frontend and backend

**Contents:**
- Type definitions
- Utility functions
- Validation schemas

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/billhartnett/inchantedFormsDesigner.git
cd inchantedFormsDesigner

# Install monorepo dependencies
npm install

# Install workspace-specific dependencies
npm install -w frontend
npm install react konva react-konva
```

### Development

```bash
# Start frontend development server
npm run dev -w frontend

# Build all workspaces
npm run build

# Run tests
npm run test
```

## 📦 FormDesigner Component

The main component is located in `frontend/src/components/FormDesigner.tsx`

### Usage

```typescript
import FormDesigner from './components/FormDesigner';

function App() {
  const handleSave = (data) => {
    console.log('Form saved:', data);
  };

  return (
    <FormDesigner 
      stageWidth={800}
      stageHeight={600}
      onSave={handleSave}
    />
  );
}
```

### Features

- **Drag & Drop**: Add and arrange text fields and checkboxes
- **Resizable**: 8-point resize handles via Transformer
- **Properties Panel**: Edit element properties in real-time
- **Background Image**: Load and manage background images
- **JSON Persistence**: Save and load form layouts
- **PNG Export**: Export forms as high-quality PNG images
- **Keyboard Shortcuts**: Delete (remove), Escape (deselect)

## 🎨 Component Props

```typescript
interface FormDesignerProps {
  stageWidth?: number;                    // Default: 800
  stageHeight?: number;                   // Default: 600
  onSave?: (data: FormDesignerData) => void;
}
```

## 📊 Statistics

- **Frontend**: React 18 + TypeScript
- **Component Code**: 920 lines
- **Component Styles**: 350+ lines
- **Type Safe**: 100% (no `any` types)
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## 🔗 Links

- **GitHub**: https://github.com/billhartnett/inchantedFormsDesigner
- **Frontend**: `./frontend`
- **Backend**: `./backend`
- **Shared**: `./shared`

## 📚 Documentation

- Frontend docs: `frontend/README.md`
- Backend docs: `backend/README.md`
- Project docs: `docs/`

## 🛠️ Customization

### Change FormDesigner Colors

Edit `frontend/src/components/FormDesigner.css`:
```css
.toolbar-button.active {
  background: #YOUR_COLOR;
}
```

### Adjust Canvas Size

```typescript
<FormDesigner stageWidth={1200} stageHeight={900} />
```

## 📝 Development

```bash
# Install dependencies
npm install

# Start development
npm run dev -w frontend

# Build production
npm run build

# Run tests
npm run test
```

## 🤝 Contributing

This is a monorepo with multiple workspaces. When contributing:

1. Make changes in the appropriate workspace
2. Commit with descriptive messages
3. Test changes across workspaces as needed

## 📄 License

MIT

## 👤 Author

Bill Hartnett

---

**Status**: ✅ Active Development  
**Last Updated**: January 2024
