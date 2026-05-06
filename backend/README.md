# Backend

API and services for inchantedFormsDesigner monorepo.

## 📁 Structure

```
backend/
├── api/                          # API endpoints
│   ├── forms/                   # Form management endpoints
│   └── health/                  # Health check endpoints
│
└── services/                    # Business logic
    ├── formService.ts
    └── validation.ts
```

## 🚀 Getting Started

```bash
cd backend
npm install
npm run dev
```

## API Endpoints

- `POST /api/forms` - Save form layout
- `GET /api/forms/:id` - Get form layout
- `DELETE /api/forms/:id` - Delete form

## 📝 Development

Add your backend implementation here.
