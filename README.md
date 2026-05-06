# inchantedFormsDesigner

A comprehensive monorepo for form design and management tools.

## 📁 Repository Structure

```
inchantedFormsDesigner/
├── azure-swa-project/                 # React + Azure Static Web Apps frontend
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   ├── FormDesigner.tsx    # Main Konva-based form designer component
│       │   │   └── FormDesigner.css    # FormDesigner styles
│       │   ├── App.tsx
│       │   └── main.tsx
│       └── package.json
├── docs/                              # Project documentation
│   ├── FORMDESIGNER-GUIDE.md          # Complete FormDesigner guide
│   └── README.md                      # This file
├── Web Forms Designer/                # Legacy form design project
├── xfdl Parser/                       # XFDL (XDP Forms Document Language) parser
└── (other directories)
```

## 🎯 Projects

### 1. **FormDesigner** (NEW)
A professional React + TypeScript form designer component using Konva.js

**Features:**
- ✅ Drag & drop form elements (text fields, checkboxes)
- ✅ Resizable elements with Transformer
- ✅ Background image support
- ✅ JSON export/import
- ✅ PNG export
- ✅ Real-time property editing
- ✅ Keyboard shortcuts (Delete, Escape)

**Location:** `azure-swa-project/frontend/src/components/FormDesigner`

**Quick Start:**
```tsx
import FormDesigner from './components/FormDesigner';

<FormDesigner stageWidth={800} stageHeight={600} />
```

### 2. **Azure SWA Project**
React + TypeScript frontend for Azure Static Web Apps with authentication and API integration.

**Location:** `azure-swa-project/`

### 3. **Web Forms Designer**
Legacy form design tool.

### 4. **XFDL Parser**
Parser for XFDL (XDP Forms Document Language) format.

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

# Install frontend dependencies
cd azure-swa-project/frontend
npm install

# Install required packages for FormDesigner
npm install react konva react-konva
```

### Running the Frontend

```bash
cd azure-swa-project/frontend
npm run dev
```

The application will be available at `http://localhost:5173`

## 📦 FormDesigner Component

### Usage

```typescript
import FormDesigner from './components/FormDesigner';

function App() {
  const handleSave = (data) => {
    console.log('Form saved:', data);
    // Save to backend or local storage
  };

  return (
    <FormDesigner 
      stageWidth={900}
      stageHeight={700}
      onSave={handleSave}
    />
  );
}
```

### Features

#### Canvas
- 50x50px grid background
- Optional background image (50% opacity)
- Configurable stage size

#### Text Fields
- Drag to move
- Resize with 8-point handles
- Customize: font, size, color, family, placeholder, name

#### Checkboxes
- Drag to move
- Toggle checked state
- Customize: label, size, name

#### Data Management
- Export as JSON (includes base64 background image)
- Import from JSON
- Export as PNG (2x quality)

#### Keyboard Support
- `Delete` - Remove selected element
- `Escape` - Deselect element
- Drag to move
- Drag corners to resize

### Type Definitions

```typescript
interface TextFieldConfig {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  placeholder?: string;
  name?: string;
}

interface CheckboxConfig {
  id: string;
  x: number;
  y: number;
  size: number;
  checked: boolean;
  label: string;
  name?: string;
}

interface FormDesignerData {
  version: string;
  backgroundImage?: string;
  textFields: TextFieldConfig[];
  checkboxes: CheckboxConfig[];
  stageWidth: number;
  stageHeight: number;
}
```

## 📚 Documentation

- **[FormDesigner Complete Guide](./docs/FORMDESIGNER-GUIDE.md)** - Detailed technical documentation
- **[Quick Start Guide](./docs/FORMDESIGNER-QUICK-START.md)** - Setup and usage guide
- **[API Reference](./docs/FORMDESIGNER-GUIDE.md#api-reference)** - Complete API documentation

## 🎨 Customization

### Change Primary Color
Edit `FormDesigner.css` and replace `#1976d2`:
```css
.toolbar-button.active {
  background: #YOUR_COLOR;
}
```

### Adjust Canvas Size
```tsx
<FormDesigner stageWidth={1200} stageHeight={900} />
```

### Improve PNG Export Quality
In `FormDesigner.tsx`, modify the `exportAsPNG` method:
```typescript
const dataURL = stageRef.current.toDataURL({ pixelRatio: 3 }); // Higher quality
```

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📝 File Structure

```
azure-swa-project/frontend/
├── src/
│   ├── components/
│   │   ├── FormDesigner.tsx       (920 lines)
│   │   └── FormDesigner.css       (350+ lines)
│   ├── assets/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🔒 Security

- ✅ No eval or dynamic code execution
- ✅ Safe JSON parsing with error handling
- ✅ CORS-aware image loading
- ✅ Client-side processing only
- ✅ Base64 image encoding

## 📄 License

Part of the inchantedFormsDesigner project.

## 👤 Author

Bill Hartnett

## 🔗 Repository

[https://github.com/billhartnett/inchantedFormsDesigner](https://github.com/billhartnett/inchantedFormsDesigner)

---

**Last Updated:** January 2024  
**Status:** Active Development
