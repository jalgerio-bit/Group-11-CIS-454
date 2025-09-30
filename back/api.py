from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Mini Cycle API")


cycles = []          
next_id = 1       

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
    global next_id
    item = {"id": next_id, **body.model_dump()}
    cycles.append(item)
    next_id += 1
    return item

@app.get("/cycles", response_model=List[CycleOut])
def list_cycles():
    return list(reversed(cycles))  

@app.delete("/cycles/{cid}", status_code=204)
def delete_cycle(cid: int):
    idx = next((i for i, it in enumerate(cycles) if it["id"] == cid), None)
    if idx is None:
        raise HTTPException(404, "not found")
    cycles.pop(idx)
    return

