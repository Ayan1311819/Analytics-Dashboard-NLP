import os
import re
from typing import Any, List, Dict
from decimal import Decimal
from datetime import date, datetime
from pathlib import Path

import asyncpg
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path if env_path.exists() else None)

# Configuration
DB_DSN = os.getenv("DATABASE_URL")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
MAX_ROWS = int(os.getenv("MAX_ROWS", "1000"))

if not DB_DSN:
    raise RuntimeError("DATABASE_URL environment variable is required")
if not LLM_API_KEY:
    raise RuntimeError("LLM_API_KEY environment variable is required")

app = FastAPI(title="Vanna NL-to-SQL Service")

# Models
class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    query: str
    generated_sql: str
    results: List[Dict[str, Any]]
    row_count: int

# Database Schema (from Prisma)
DATABASE_SCHEMA = """
Database Schema:

Table: Vendor
Columns: id (PK), name, taxId, address, externalId
Relationships: Has many Invoice

Table: Customer  
Columns: id (PK), name, address, externalId
Relationships: Has many Invoice

Table: Invoice
Columns: id (PK), invoiceCode, invoiceDate, deliveryDate, documentType, totalAmount, subTotal, totalTax, currency, vendorId (FK to Vendor), customerId (FK to Customer)
Relationships: Belongs to Vendor, Belongs to Customer, Has many LineItem, Has many Payment

Table: LineItem
Columns: id (PK), invoiceId (FK to Invoice), description, quantity, unitPrice, totalPrice, sachkonto, buschluessel, vatRate, vatAmount
Relationships: Belongs to Invoice

Table: Payment
Columns: id (PK), invoiceId (FK to Invoice), dueDate, bankAccountNumber, discountedTotal, paymentTerms, netDays, discountPercentage
Relationships: Belongs to Invoice
"""

# SQL Safety
SQL_SAFE_PATTERN = re.compile(r'^\s*SELECT\b', re.IGNORECASE)
SQL_FORBIDDEN = re.compile(
    r'\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|MERGE|EXEC|CALL|EXECUTE)\b',
    re.IGNORECASE
)

def is_sql_safe(sql: str) -> bool:
    if not SQL_SAFE_PATTERN.match(sql):
        return False
    if SQL_FORBIDDEN.search(sql):
        return False
    sql_stripped = sql.strip().rstrip(';')
    if ';' in sql_stripped:
        return False
    return True

def normalize_row(row: asyncpg.Record) -> Dict[str, Any]:
    out = {}
    for k, v in row.items():
        if isinstance(v, Decimal):
            out[k] = float(v)
        elif isinstance(v, (date, datetime)):
            out[k] = v.isoformat()
        elif isinstance(v, (int, float, str, bool)) or v is None:
            out[k] = v
        elif isinstance(v, bytes):
            out[k] = v.decode('utf-8', errors='replace')
        else:
            out[k] = str(v) if v else None
    return out

def extract_sql_from_markdown(text: str) -> str:
    sql_pattern = re.compile(r'```(?:sql)?\s*\n(.*?)\n```', re.DOTALL | re.IGNORECASE)
    match = sql_pattern.search(text)
    return match.group(1).strip() if match else text.strip()

SYSTEM_PROMPT = f"""You are a PostgreSQL expert that converts natural language questions into SQL queries.

DB Schema: {DATABASE_SCHEMA}

EXAMPLES OF CORRECT QUERIES:

Example 1:
Question: "Show me all invoices"
SQL: SELECT * FROM "Invoice"

Example 2:
Question: "Get invoices with their customer names"
SQL: SELECT i.*, c.name as customer_name FROM "Invoice" i JOIN "Customer" c ON i."customerId" = c.id

Example 3:
Question: "Find invoices where invoice code is ABC123"
SQL: SELECT * FROM "Invoice" WHERE "invoiceCode" = 'ABC123'

Example 4:
Question: "Show line items for invoice id 5"
SQL: SELECT * FROM "LineItem" WHERE "invoiceId" = 5

Example 5:
Question: "Get total amount by vendor"
SQL: SELECT v.name, SUM(i."totalAmount") as total FROM "Invoice" i JOIN "Vendor" v ON i."vendorId" = v.id GROUP BY v.name

CRITICAL RULES:
1. ALL table names MUST use double quotes: "Invoice", "Customer", "Vendor", "LineItem", "Payment"
2. ALL camelCase column names MUST use double quotes: "invoiceCode", "customerId", "totalAmount"
3. Simple lowercase columns (id, name, description, address) do NOT need quotes
4. Use EXACT spelling from schema - case matters!
5. Return ONLY the SQL query with no explanations, no markdown, no extra text
"""

# LLM Integration
async def call_llm_generate_sql(user_question: str) -> str:
    headers = {
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": user_question
            }
        ],
        "temperature": 0.1,
        "max_tokens": 1024,
        "stream": False
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(GROQ_API_URL, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            
            if "choices" in data and data["choices"]:
                sql = data["choices"][0]["message"]["content"]
                return extract_sql_from_markdown(sql).strip()
            
            raise HTTPException(status_code=500, detail="Unexpected Groq response")
                
    except httpx.HTTPStatusError as e:
        error_msg = f"Groq API error ({e.response.status_code})"
        try:
            error_json = e.response.json()
            if "error" in error_json:
                error_msg += f": {error_json['error'].get('message', '')}"
        except:
            pass
        raise HTTPException(status_code=502, detail=error_msg)
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Failed to connect to Groq: {str(e)}")

# API Endpoints
@app.on_event("startup")
async def startup():
    try:
        app.state.db = await asyncpg.create_pool(
            dsn=DB_DSN,
            min_size=2,
            max_size=20,
            command_timeout=60
        )
        print("✓ Database connected")
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        raise

@app.on_event("shutdown")
async def shutdown():
    if hasattr(app.state, 'db'):
        await app.state.db.close()
        print("✓ Database closed")

@app.post("/query", response_model=ChatResponse)
async def query_endpoint(body: ChatRequest):
    user_q = body.query.strip()
    if not user_q:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        # Build prompt and get SQL from LLM
        generated_sql = await call_llm_generate_sql(user_q)
        
        # Clean and validate SQL
        generated_sql = generated_sql.strip().rstrip(";")
        generated_sql = extract_sql_from_markdown(generated_sql)
        
        if not is_sql_safe(generated_sql):
            raise HTTPException(
                status_code=400,
                detail="Generated SQL failed safety checks"
            )
        
        # Add LIMIT if missing
        if not re.search(r'\bLIMIT\b', generated_sql, re.IGNORECASE):
            generated_sql = f"{generated_sql} LIMIT {MAX_ROWS}"
        
        # Execute SQL
        async with app.state.db.acquire() as conn:
            rows = await conn.fetch(generated_sql)
            results = [normalize_row(r) for r in rows]
        
        return ChatResponse(
            query=user_q,
            generated_sql=generated_sql,
            results=results,
            row_count=len(results)
        )
        
    except HTTPException:
        raise
    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=400, detail=f"SQL error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/health")
async def health():
    try:
        async with app.state.db.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.get("/")
async def root():
    return {
        "service": "Vanna NL-to-SQL",
        "endpoints": {
            "POST /query": "Convert natural language to SQL",
            "GET /health": "Health check"
        }
    }