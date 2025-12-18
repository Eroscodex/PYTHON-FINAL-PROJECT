from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx
 
# Create the app
app = FastAPI()
 
# Allow frontend to connect
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
 
# What a message looks like
class Message(BaseModel):
   role: str      # "user" or "assistant"
   content: str   # the text
 
# What the frontend sends us
class ChatRequest(BaseModel):
   model: str
   messages: list[Message]
 
# Stream response from Ollama
async def get_ollama_response(data):
   async with httpx.AsyncClient(timeout=None) as client:
       async with client.stream("POST", "http://localhost:11434/api/chat", json=data) as r:
           async for line in r.aiter_lines():
               if line:
                   yield f"data: {line}\n\n"
 
 
 
 
# Health check - is server running?
@app.get("/")
async def home():
   return {"status": "ok"}
 
# Get list of models
@app.get("/api/models")
async def models():
   async with httpx.AsyncClient() as client:
       r = await client.get("http://localhost:11434/api/tags")
       return r.json()
 
# Main chat endpoint
@app.post("/api/chat")
async def chat(req: ChatRequest):
   data = {
       "model": req.model,
       "messages": [{"role": m.role, "content": m.content} for m in req.messages],
       "stream": True
   }
   return StreamingResponse(get_ollama_response(data), media_type="text/event-stream")