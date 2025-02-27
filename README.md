# Restaurant Finder

A modern web application that helps users find restaurants based on location, preferences, and dietary requirements. The application uses Flask for the backend and integrates with Google's Gemini AI for intelligent restaurant suggestions.

## Features

- Search restaurants by location and radius
- Filter by establishment type (Restaurant, Cafe, Fast Food, etc.)
- Filter by cuisine type
- Specify dietary preferences (Pure Veg, Jain, Healthy)
- Modern and responsive UI
- Real-time search results with loading indicators

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd restaurant-finder
```

2. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env` file in the root directory and add your Gemini API key:
```
GEMINI_API_KEY=your_api_key_here
```

5. Run the application:
```bash
python app.py
```

The application will be available at `http://localhost:5000`

## Deployment

This application is configured for deployment on Vercel. Make sure to:

1. Set up your Vercel account and install the Vercel CLI
2. Add your Gemini API key to Vercel's environment variables
3. Deploy using:
```bash
vercel
```

## Technologies Used

- Backend: Flask (Python)
- Frontend: HTML, CSS (Tailwind CSS), JavaScript
- AI Integration: Google Gemini AI
- Deployment: Vercel

## Contributing

Feel free to open issues and pull requests for any improvements you'd like to contribute.

## License

MIT License 