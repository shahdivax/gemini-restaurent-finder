from flask import Flask, render_template, request, jsonify
import base64
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
import logging
import json

load_dotenv()

app = Flask(__name__)

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def generate_restaurant_suggestions(location, radius_range, preferences):
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )

    model = "gemini-2.0-flash"
    prompt = f"""Generate a list of restaurants within {radius_range} from {location} with the following preferences: {preferences}. 
    Return ONLY a valid JSON object with no additional text, comments or markdown formatting.
    
    The JSON should follow this exact format:
    {{
        "restaurants": [
            {{
                "name": "Restaurant Name",
                "cuisine": "Cuisine Type",
                "features": ["Feature 1", "Feature 2"],
                "distance": "X.X km",
                "priceRange": "₹₹₹",
                "rating": "4.5",
                "image": "restaurant-type",
                "location": {{
                    "address": "Full address"
                }},
                "links": {{
                    "zomato": "https://zomato.com/restaurant",
                    "swiggy": "https://swiggy.com/restaurant",
                    "googleMaps": "https://maps.google.com/..."
                }},
                "openingHours": "10:00 AM - 11:00 PM",
                "popularDishes": ["Dish 1", "Dish 2"],
                "averageCost": "Cost for two"
            }}
        ]
    }}
    
    Include Almost all the restaurants. The 'image' field should be one of: fine-dining, casual, cafe, fast-food.
    Do not include placeholder URLs or coordinates. Only include real restaurant information.
    
    Dont include links if you dont have any links, just Return NA for links, instead of providing generic place holder links.
    """

    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)],
        ),
    ]
    
    tools = [types.Tool(google_search=types.GoogleSearch())]
    generate_content_config = types.GenerateContentConfig(
        temperature=0.7,  # Reduced temperature for more focused results
        top_p=0.8,
        top_k=40,
        max_output_tokens=8192,
        tools=tools,
        response_mime_type="text/plain",
    )

    try:
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=generate_content_config,
        )
        
        # Clean up the response text
        response_text = response.text
        
        # Remove any markdown code blocks if present
        response_text = response_text.replace("```json", "").replace("```", "").strip()
        
        # Validate JSON before returning
        try:
            json.loads(response_text)
            logger.debug(f"Successfully generated and validated JSON: {response_text[:200]}...")
            return response_text
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON generated: {e}")
            logger.debug(f"Problematic response: {response_text}")
            raise ValueError("Generated response is not valid JSON")
            
    except Exception as e:
        logger.error(f"Error in generate_restaurant_suggestions: {str(e)}")
        raise

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search():
    try:
        data = request.json
        logger.debug(f"Received search request with data: {data}")
        
        if not data or 'location' not in data:
            return jsonify({"success": False, "error": "Location is required"})
        
        location = data.get('location')
        radius = data.get('radius', '10km')
        preferences = []
        
        if data.get('establishment_type'):
            preferences.append(data['establishment_type'])
        if data.get('food_type'):
            preferences.append(data['food_type'])
        if data.get('dietary_preferences'):
            preferences.extend(data['dietary_preferences'])
        
        preferences_str = ", ".join(filter(None, preferences))
        logger.debug(f"Processing search with location: {location}, radius: {radius}, preferences: {preferences_str}")
        
        try:
            results = generate_restaurant_suggestions(location, radius, preferences_str)
            parsed_results = json.loads(results)  # Validate JSON
            
            if not isinstance(parsed_results, dict) or 'restaurants' not in parsed_results:
                raise ValueError("Invalid response structure")
                
            return jsonify({
                "success": True,
                "results": results
            })
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON format: {e}")
            return jsonify({
                "success": False,
                "error": "Invalid response format from AI"
            })
        except ValueError as e:
            logger.error(f"Value error: {str(e)}")
            return jsonify({
                "success": False,
                "error": str(e)
            })
        except Exception as e:
            logger.error(f"Error generating suggestions: {str(e)}")
            return jsonify({
                "success": False,
                "error": "Error generating restaurant suggestions"
            })
            
    except Exception as e:
        logger.error(f"Unexpected error in search endpoint: {str(e)}")
        return jsonify({
            "success": False,
            "error": "An unexpected error occurred"
        })

if __name__ == '__main__':
    app.run(debug=True) 