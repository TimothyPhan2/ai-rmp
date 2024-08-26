from dotenv import load_dotenv
load_dotenv()
from pinecone import Pinecone, ServerlessSpec
import os
import json
import requests
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

pc.create_index(
    name="rag",
    dimension=384,
    metric="cosine",
    spec=ServerlessSpec(cloud="aws", region="us-east-1"),
)

model_id="sentence-transformers/all-MiniLM-L6-v2"
hf_token=os.getenv("HF_TOKEN")

data = json.load(open("reviews.json"))
processed_data = []



def get_embedding(text):
    api_url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{model_id}"
    headers = {"Authorization": f"Bearer {hf_token}"}

    response = requests.post(api_url, headers=headers, json={"inputs": text, "options":{"wait_for_model":True}})
    return response.json()

for review in data["profReviews"]:
    response = get_embedding(review["review"])
   
    processed_data.append(
        {
            "values": response,
            "id": review["professor"],
            "metadata": {
                "review": review["review"],
                "course": review["course"],
                "stars": review["stars"],
            }

        }
    )
index = pc.Index("rag")
upsert_response = index.upsert(
        vectors=processed_data,
        namespace="ns1"
    )
print(f"Upserted count: {upsert_response['upserted_count']}")

    # Print index statistics
print(index.describe_index_stats())