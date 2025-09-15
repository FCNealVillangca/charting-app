# Charting App

A full-stack financial charting application with AI-powered analysis capabilities. Built with React/TypeScript frontend and Python/FastAPI backend.

## 🚀 Features

- **Interactive Financial Charts**: Real-time charting with drawing tools and technical indicators
- **AI-Powered Analysis**: Machine learning models for market analysis and predictions
- **Multi-Asset Support**: Support for various currency pairs and financial instruments
- **Drawing Tools**: Professional charting tools for technical analysis
- **Technical Indicators**: EMA, MACD, RSI, SMA and more
- **Responsive Design**: Modern, mobile-friendly interface

## 🏗️ Architecture

```
charting app/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── charts/    # Chart-specific components
│   │   │   └── ...
│   │   ├── pages/         # Page components
│   │   └── data/          # Sample data files
│   └── package.json
├── backend/           # Python + FastAPI
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── models/       # Database models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── core/         # Core configuration
│   ├── ai/              # AI/ML models and training
│   └── requirements.txt
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Plotly.js** for interactive charts
- **Tailwind CSS** for styling
- **ESLint** for code quality

### Backend
- **Python 3.11+**
- **FastAPI** for API framework
- **SQLAlchemy** for ORM
- **Alembic** for database migrations
- **Pydantic** for data validation
- **Docker** for containerization

### AI/ML
- **Scikit-learn** for machine learning
- **Pandas** for data manipulation
- **NumPy** for numerical computing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Git

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd charting-app
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 📁 Project Structure

### Frontend (`/frontend`)
- `src/components/charts/` - Chart components and drawing tools
- `src/pages/` - Application pages
- `src/data/` - Sample data and configurations
- `src/types/` - TypeScript type definitions

### Backend (`/backend`)
- `app/api/v1/` - API route handlers
- `app/models/` - SQLAlchemy database models
- `app/schemas/` - Pydantic request/response schemas
- `app/core/` - Configuration and utilities
- `ai/` - Machine learning models and training scripts

## 🔧 Configuration

### Environment Variables

Create `.env` files in both frontend and backend directories:

**Backend `.env`:**
```env
DATABASE_URL=sqlite:///./charting_app.db
SECRET_KEY=your-secret-key-here
DEBUG=True
```

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:8000
```

## 📊 Data

The application includes sample EUR/USD data for testing. Place your own CSV data files in the appropriate directories:
- Backend: `backend/app/`
- Frontend: `frontend/src/data/`

## 🤖 AI Features

The AI module provides:
- Market trend analysis
- Price prediction models
- Technical indicator optimization
- Pattern recognition

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 🐳 Docker

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 📝 API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🔮 Roadmap

- [ ] Real-time data integration
- [ ] Advanced AI models
- [ ] Mobile app
- [ ] Social trading features
- [ ] Portfolio management
- [ ] Alert system
- [ ] Backtesting framework

---

**Happy Trading! 📈**
"# charting-app" 
