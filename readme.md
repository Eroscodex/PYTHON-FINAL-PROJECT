# Reporting Demo: Let's Start!

## 🎬 INTRO (0:00 – 0:30)
Hello everyone.
Today, I’m going to demonstrate **Eros Assistant**, a local AI-powered customer service chatbot built using **FastAPI**, **Ollama**, and a custom **Large Language Model configuration**.
This system is designed specifically for a **Philippine laptop and PC e-commerce company**.

---

## 🎬 SYSTEM OVERVIEW (0:30 – 1:00)
The backend is powered by **FastAPI**, which acts as a bridge between the frontend and **Ollama**, our local AI engine.
The frontend is a **JavaScript-based chat interface** that supports:
- Real-time streaming responses
- Chat history
- Model selection

---

## 🎬 STREAMING FLOW EXPLANATION (1:00 – 2:20)
Unlike traditional chat systems that wait for the full response, this project uses **token streaming**.

1. The user sends a message.
2. The frontend sends a **POST request** to `/api/chat`.
3. FastAPI forwards the request to Ollama with **streaming enabled**.
4. Ollama generates text **token by token**.
5. FastAPI forwards each token using **Server-Sent Events (SSE)**.
6. The frontend displays the response **character-by-character**, simulating human typing.

This results in a smooth, modern chat experience.

---

## 🎬 CUSTOM MODELFILE EXPLANATION (2:20 – 3:40)
Eros Assistant is built on top of **llama3.2** with a **temperature of 0.1**.

- Ensures stable and professional responses
- Optimized for customer service

### Role Enforcement
The system prompt defines the assistant as a **real store employee**, not a general AI.

Allowed topics:
- Laptops
- Desktop PCs
- PC parts
- Pricing
- Availability
- Shipping
- Warranty

❌ Any unrelated questions (e.g., cooking, history, entertainment) are **automatically refused**.

🇵🇭 The assistant only serves **customers in the Philippines**.

---

## 🎬 LIVE DEMO – VALID QUESTION (3:40 – 4:30)
**User input:**
> Do you have a good laptop for online classes under 40,000 pesos?

✔ The response streams instantly with real-time typing animation.

---

## 🎬 LIVE DEMO – INVALID QUESTION (4:30 – 4:50)
**User input:**
> How do I cook chicken adobo?

❌ The assistant refuses to answer because it is outside its job role.

---

## 🎬 CONCLUSION (4:50 – 5:00)
This project demonstrates:
- Real-time AI streaming
- Custom role enforcement
- A production-style customer service chatbot

All running **locally**.

---

## 📱 Responsive Output

![Laptop View](/prj-demo-report-output-images/laptop-pc-output.png)
![Mobile View](/prj-demo-report-output-images/mobile-output.png)

---

## 🎥 Full Demo Video

<video src="/prj-demo-report-output-images/REPORT-DEMO-TUTORIAL.mp4" width="600"></video>


### ▶️ Download / Watch the Demo Video
[Click here to download the demo video](./prj-demo-report-output-images/REPORT-DEMO-TUTORIAL.mp4)


---

# Eros Chatbot AI — Laptop & PC E-commerce

A local AI chatbot project with a **Python backend** and a **web frontend**. Users can chat with the AI, save chat history, and manage conversations.

---

## 📁 Folder Structure
```
PYTHON-PROJECT/
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   └── venv/
├── frontend/
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   └── images/
├── Modelfile/
└── README.md
```

---

## 🚀 Quick Start

- Step 0: Download Project
- Step 1: Backend Setup
- Step 2: Frontend Setup
- Step 3: Using the Chatbot

---

## 🖥️ Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload --port 3000
```

Backend runs at:
```
http://localhost:3000
```

---

## 🌐 Frontend Setup
```bash
cd frontend
python -m http.server 8000
```

Open:
```
http://localhost:8000
```

---

## 💬 Using the Chatbot
- Select a model
- Start chatting
- Chat history is stored in `localStorage`

---

## 🤖 Create the Custom Model
```bash
ollama create Eros_Assistant -f Modelfile
```

---

## 📜 License
Educational purposes only.

© 2025 Alondra, Cas, Loresto, Mirandilla

---

✅ **Thank you for using Eros Chatbot AI!**

