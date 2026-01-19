import random

import json
import os

def retrieve_recipe(food_item):
    """
    RAG Logic: Search the knowledge base for a matching recipe.
    """
    try:
        with open('data/recipes.json', 'r') as f:
            recipes = json.load(f)
            
        food_item_lower = food_item.lower()
        
        # Simple keyword matching (The "Retrieval" part)
        for recipe in recipes:
            for ingredient in recipe['ingredients']:
                if ingredient in food_item_lower:
                     return f"RAG Suggestion: Try '{recipe['name']}' - {recipe['instructions']}"
                     
        return None
    except Exception as e:
        print(f"RAG Error: {e}")
        return None

def get_leftover_action(item, kg):
    """
    Suggests specific actions for leftovers based on item type and quantity.
    """
    kg = float(kg)
    
    # 1. Try RAG first
    rag_suggestion = retrieve_recipe(item)
    if rag_suggestion:
        return f"{rag_suggestion} ({kg}kg saved)"

    # 2. Fallback to hardcoded logic
    actions = {
        "rice": f"Repurpose into Fried Rice or lemon rice for the next snack session. ({kg}kg saved)",
        "dal": f"Dehydrate for 'Dal Paratha' stuffing or donate to local shelters immediately. ({kg}kg saved)",
        "paneer": f"Refrigerate and use as a topping for sandwiches or rolls tomorrow morning.",
        "poha": f"Mix with fresh spices and vegetables for a quick cutlet base."
    }
    
    item_lower = item.lower()
    for key in actions:
        if key in item_lower:
            return actions[key]
            
    if kg > 10:
        return f"Contact 'Hunger Relief Foundation' for immediate donation of {kg}kg."
    return "Optimize serving size: Use smaller portion scoops to reduce individual plate waste."

def get_ai_insights(data):
    """
    Simulates AI analysis with specific leftover repurposing suggestions.
    """
    if not data:
        return ["Not enough data for analysis. Please input daily records."]
    
    total_produced = sum(float(d.get('produced_kg', 0)) for d in data)
    total_leftover = sum(float(d.get('leftover_kg', 0)) for d in data)
    waste_percentage = (total_leftover / total_produced) * 100 if total_produced > 0 else 0
    
    # Impact Metrics Calculation
    donated_kg = sum(float(d.get('leftover_kg', 0)) for d in data if d.get('diversion_type') == 'Donated')
    composted_kg = sum(float(d.get('leftover_kg', 0)) for d in data if d.get('diversion_type') == 'Compost')
    animal_feed_kg = sum(float(d.get('leftover_kg', 0)) for d in data if d.get('diversion_type') == 'Animal Feed')
    
    meals_saved = int(donated_kg / 0.4) # Approx 0.4kg per meal
    co2_saved = (donated_kg + composted_kg) * 2.5 # Approx 2.5kg CO2e prevented per kg diverted from landfill
    
    insights = [
        f"Average waste percentage: {waste_percentage:.1f}%.",
        f"Key Opportunity: {get_leftover_action(data[-1]['food_item'], data[-1]['leftover_kg'])}",
        f"Staff '{data[-1].get('recorded_by', 'Unknown')}' recorded the latest efficiency check.",
        f"Impact: {meals_saved} meals saved via donation.",
        f"Environment: prevented {co2_saved:.1f}kg of CO2 emissions."
    ]
    
    # Return structured data for dashboard consumption if needed, or just strings for now
    # Ideally we should change the return type to be more structured, but complying with existing frontend:
    return {
        "text_insights": insights,
        "metrics": {
            "meals_saved": meals_saved,
            "co2_saved": co2_saved,
            "donated_kg": donated_kg,
            "composted_kg": composted_kg
        }
    }

# Simple ML Integration (Conceptual Keyword-based fallback but structured as a classifier)
# For a real project, one would use: from sklearn.feature_extraction.text import TfidfVectorizer ...
import os
from dotenv import load_dotenv

# Try to import WatsonX, but don't crash if it's not installed yet (safety)
try:
    from ibm_watsonx_ai import APIClient, Credentials
    from ibm_watsonx_ai.foundation_models import ModelInference
    from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams
    HAS_WATSONX = True
except ImportError:
    HAS_WATSONX = False
    print("Warning: ibm-watsonx-ai not installed. Using fallback chatbot.")

load_dotenv()

# Configuration
API_KEY = os.getenv("WATSONX_API_KEY")
PROJECT_ID = os.getenv("PROJECT_ID")
URL = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")

def get_granite_response(query):
    """
    Connects to IBM WatsonX to get a response from the Granite model.
    """
    if not HAS_WATSONX or not API_KEY or not PROJECT_ID:
        return None

    try:
        credentials = Credentials(url=URL, api_key=API_KEY)
        client = APIClient(credentials)
        
        # Parameters for generation
        params = {
            GenParams.DECODING_METHOD: "greedy",
            GenParams.MAX_NEW_TOKENS: 100,
            GenParams.MIN_NEW_TOKENS: 1,
            GenParams.TEMPERATURE: 0.7,
            GenParams.TOP_K: 50,
            GenParams.TOP_P: 1
        }
        
        # Model ID for Granite (Using a common one, verify specific availability)
        model_id = "ibm/granite-13b-chat-v2" 
        
        model = ModelInference(
            model_id=model_id,
            params=params,
            credentials=credentials,
            project_id=PROJECT_ID
        )
        
        prompt = f"""You are EcoCanteen AI, a helpful assistant for reducing food waste in college canteens.
        Answer the following user query directly and concisely.
        
        User: {query}
        EcoCanteen AI:"""
        
        response = model.generate_text(prompt=prompt)
        return response.strip()
        
    except Exception as e:
        print(f"WatsonX Error: {e}")
        return None

def get_fallback_response(query):
    """
    A simple intent-based classifier fallback.
    """
    intents = {
        "waste_reduction": ["how to reduce", "less waste", "minimize", "stop wasting"],
        "leftover_handling": ["leftover", "what to do with food", "extra food", "repurpose"],
        "sustainability": ["why sustainability", "climate change", "environment", "global warming"],
        "greeting": ["hello", "hi", "hey", "who are you"]
    }
    
    responses = {
        "waste_reduction": "Focus on demand forecasting! Use historical 'Student Attendance' data to adjust cooking batches.",
        "leftover_handling": "Always check if leftovers are safe for donation first. If not, look into composting or repurposing into snack items.",
        "sustainability": "Eating sustainably in a canteen means prioritizing local produce and zero-waste cooking methods.",
        "greeting": "Hello! I am your AI Sustainability Agent. Ask me anything about food waste or green canteen practices!",
        "unknown": "That's an interesting query. I'm learning more every day! Try asking about 'waste reduction' or 'leftover handling'."
    }
    
    query_lower = query.lower()
    scores = {intent: 0 for intent in intents}
    
    for intent, keywords in intents.items():
        for word in keywords:
            if word in query_lower:
                scores[intent] += 1
                
    best_intent = max(scores, key=scores.get)
    if scores[best_intent] == 0:
        return responses["unknown"]
    return responses[best_intent]

def handle_chat_query(query):
    # 1. Try Granite Model
    granite_response = get_granite_response(query)
    if granite_response:
        return granite_response
        
    # 2. Fallback
    return get_fallback_response(query)
