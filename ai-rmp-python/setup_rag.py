from dotenv import load_dotenv
load_dotenv()
from pinecone import Pinecone, ServerlessSpec
from groq import Groq
import os
import json

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

pc.create_index(
    name="rag",
    dimension=1536,
    metric="cosine",
    spec=ServerlessSpec(cloud="aws", region="us-east-1"),
)