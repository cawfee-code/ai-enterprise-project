import asyncio
import requests
import numpy as np
import spacy
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
from sklearn.cluster import KMeans

app = FastAPI()

# --- CRITICAL FIX: Allow React to communicate with this Python API ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- FEATURE 6: NLP Sentiment Engine ---
sentiment_analyzer = pipeline("sentiment-analysis", model="./BERT", tokenizer="./BERT")
nlp = spacy.load("en_core_web_sm")
NODE_GET_URL = "http://platform-backend:5000/api/trends"
NODE_WEBHOOK_URL = "http://platform-backend:5000/api/trends/sentiment"


def extract_product_item(text):
    """Identifies the likely physical product/item from the trend text using
    noun-phrase extraction. Falls back to the cleaned raw text if nothing is found —
    never fabricates a product name that isn't grounded in the actual text."""
    clean_text = text.replace("#", " ").strip()
    if not clean_text:
        return clean_text
    doc = nlp(clean_text)
    noun_chunks = [chunk.text.strip() for chunk in doc.noun_chunks if chunk.text.strip()]
    if noun_chunks:
        return max(noun_chunks, key=len)
    return clean_text


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(real_time_nlp_worker())

async def real_time_nlp_worker():
    print("AI Sentiment Engine: Autonomous Polling Active...")
    while True:
        try:
            response = requests.get(NODE_GET_URL)
            trends = response.json().get("data", [])
            for trend in trends:
                if "sentiment" not in trend:
                    text = trend.get("hashtag", "") 
                    result = sentiment_analyzer(text)[0]
                    raw_score = result['label']
                    confidence = result['score']
                    
                    if raw_score.lower() in ["label_2", "positive"]:
                        score = "Positive"
                    elif raw_score.lower() in ["label_0", "negative"]:
                        score = "Negative"
                    else:
                        score = "Neutral"
                    
                    extracted_item = extract_product_item(text)

                    requests.put(f"{NODE_WEBHOOK_URL}/{trend['_id']}", json={
                        "extractedItem": extracted_item,
                        "sentimentScore": score,
                        "confidence": confidence
                    })
        except Exception as e:
            pass
        
        await asyncio.sleep(30)

# --- FEATURE 7: K-Means Customer Segmentation ---
# CRITICAL FIX: Point to the unprotected internal route
NODE_CUSTOMERS_URL = "http://platform-backend:5000/api/internal/customers"
NODE_CLUSTER_WEBHOOK = "http://platform-backend:5000/api/customers"

@app.post("/cluster-customers")
async def run_customer_clustering():
    try:
        # 1. Fetch customers using the internal API bypass
        response = requests.get(NODE_CUSTOMERS_URL, params={"limit": 1000})
        customers = response.json().get("data", [])
        
        if len(customers) < 3:
            return {"status": "error", "message": "Not enough data to cluster"}

        # 2. Extract spending and frequency vectors
        X = []
        user_ids = []
        for c in customers:
            cluster_data = c.get("aiCluster", {})
            X.append([cluster_data.get("totalSpent", 0), cluster_data.get("orderFrequency", 0)])
            user_ids.append(c["_id"])
            
        X = np.array(X)

        # 3. Execute K-Means
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(X)
        
        # 4. Map cluster IDs based on centroid spending
        centroids = kmeans.cluster_centers_
        sorted_indices = np.argsort(centroids[:, 0])
        
        segment_map = {
            sorted_indices[0]: "Churn Risk",
            sorted_indices[1]: "Regular",
            sorted_indices[2]: "VIP"
        }

        # 5. Push results back to Node.js webhook
        for i, user_id in enumerate(user_ids):
            cluster_id = int(clusters[i])
            requests.put(f"{NODE_CLUSTER_WEBHOOK}/{user_id}/cluster", json={
                "clusterId": cluster_id,
                "segmentName": segment_map[cluster_id]
            })
            
        return {"status": "success", "message": "Customer base segmented and updated."}
    except Exception as e:
        return {"status": "error", "message": str(e)}