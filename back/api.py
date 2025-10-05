from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
import mysql.connector
import os

app = FastAPI(title="Mini Cycle API")


load_dotenv()


db_config = {
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME")
}


def get_db():
    return mysql.connector.connect(**db_config)


def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cycles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            date VARCHAR(50) NOT NULL,
            symptoms TEXT,
            notes TEXT
        );
    """)
    conn.commit()
    cursor.close()
    conn.close()

init_db()  

class CycleIn(BaseModel):
    date: str
    symptoms: Optional[str] = None
    notes: Optional[str] = None

class CycleOut(CycleIn):
    id: int

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/cycles", response_model=CycleOut, status_code=201)
def create_cycle(body: CycleIn):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO cycles (date, symptoms, notes) VALUES (%s, %s, %s)",
        (body.date, body.symptoms, body.notes)
    )
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return {"id": new_id, **body.model_dump()}

@app.get("/cycles", response_model=List[CycleOut])
def list_cycles():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM cycles ORDER BY id DESC;")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

@app.delete("/cycles/{cid}", status_code=204)
def delete_cycle(cid: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM cycles WHERE id = %s", (cid,))
    conn.commit()
    cursor.close()
    conn.close()
    return

