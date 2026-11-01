import asyncio
import requests
from fastapi import FastAPI
from transformers import pipeline

app = FastAPI()

# Load local BERT model
sentiment_analyzer = pipeline("sentiment-analysis", model="./BERT", tokenizer="./BERT")

NODE_GET_URL = "http://platform-backend:5000/api/trends"
NODE_WEBHOOK_URL = "http://platform-backend:5000/api/trends/sentiment"

# Start the background worker when the FastAPI server boots
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(real_time_nlp_worker())

async def real_time_nlp_worker():
    print("AI Sentiment Engine: Autonomous Polling Active...")
    while True:
        try:
            # 1. Fetch the latest trends from the Node.js backend
            response = requests.get(NODE_GET_URL)
            trends = response.json().get("data", [])

            for trend in trends:
                # 2. Only process trends that haven't been scored by BERT yet
                if "sentiment" not in trend:
                    # In a full Scrapling implementation, you would pass the raw scraped post here.
                    # For now, we run BERT on the hashtag to simulate the pipeline.
                    text = trend.get("hashtag", "") 
                    
                    # 3. Run BERT Inference
                    result = sentiment_analyzer(text)[0]
                    raw_score = result['label']
                    confidence = result['score']
                    
                    # Normalize BERT output for the MongoDB Schema
                    if raw_score.lower() in ["label_2", "positive"]:
                        score = "Positive"
                    elif raw_score.lower() in ["label_0", "negative"]:
                        score = "Negative"
                    else:
                        score = "Neutral"
                    
                    # 4. Basic Named Entity Recognition (NER) Mock
                    # You can replace this with Scrapling or SpaCy logic later to find exact items
                    extracted_item = text.replace("#", "") + " Merchandise"

                    # 5. Fire the Webhook to update MongoDB and Invalidate Redis
                    requests.put(f"{NODE_WEBHOOK_URL}/{trend['_id']}", json={
                        "extractedItem": extracted_item,
                        "sentimentScore": score,
                        "confidence": confidence
                    })
                    print(f"Scored {text}: {score} ({confidence})")
                    
        except Exception as e:
            print(f"NLP Worker Error: {e}")
        
        # Wait 30 seconds before checking the database for new scraped trends
        await asyncio.sleep(30)