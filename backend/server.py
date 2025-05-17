from fastapi import FastAPI, APIRouter, HTTPException, Query, Body
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Union
import uuid
from datetime import datetime, date
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'work_management')]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Enums
class WorkOrderStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class InvoiceStatus(str, Enum):
    draft = "draft"
    pending_dgi = "pending_dgi"
    validated_dgi = "validated_dgi"
    sent = "sent"
    paid = "paid"
    cancelled = "cancelled"


class InvoiceType(str, Enum):
    e_ticket = "e-Ticket"
    e_invoice = "e-Factura"
    credit_note = "Nota de Crédito"
    debit_note = "Nota de Débito"


# Base Models
class BaseDBModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# Client Models
class ClientBase(BaseModel):
    name: str
    rut: str
    business_name: str
    address: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    contact_person: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class Client(ClientBase, BaseDBModel):
    pass


# Work Order Models
class WorkOrderBase(BaseModel):
    title: str
    description: str
    client_id: str
    status: WorkOrderStatus = WorkOrderStatus.pending
    scheduled_date: Optional[date] = None
    location: Optional[str] = None
    priority: Optional[int] = 3  # 1-5 scale, 5 being highest
    estimated_hours: Optional[float] = None
    assigned_personnel: Optional[List[str]] = []  # List of personnel IDs


class WorkOrderCreate(WorkOrderBase):
    pass


class WorkOrder(WorkOrderBase, BaseDBModel):
    completed_date: Optional[datetime] = None
    materials_used: Optional[List[Dict[str, Any]]] = []
    comments: Optional[List[Dict[str, Any]]] = []
    attachments: Optional[List[str]] = []
    invoiced: bool = False
    invoice_id: Optional[str] = None


# Invoice Models
class InvoiceItem(BaseModel):
    description: str
    quantity: float
    unit_price: float
    tax_rate: float = 22.0  # Default IVA in Uruguay


class InvoiceBase(BaseModel):
    client_id: str
    issue_date: date = Field(default_factory=date.today)
    due_date: Optional[date] = None
    invoice_type: InvoiceType = InvoiceType.e_ticket
    work_order_ids: List[str] = []
    items: List[InvoiceItem]
    notes: Optional[str] = None
    payment_terms: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    pass


class Invoice(InvoiceBase, BaseDBModel):
    status: InvoiceStatus = InvoiceStatus.draft
    invoice_number: Optional[str] = None
    subtotal: float = 0
    tax_amount: float = 0
    total_amount: float = 0
    paid_amount: float = 0
    paid_date: Optional[datetime] = None


# Dashboard Stats Models
class DashboardStats(BaseModel):
    active_work_orders: int
    completed_work_orders: int
    pending_invoices: int
    paid_invoices: int
    total_invoiced_amount: float
    total_paid_amount: float
    work_orders_by_status: Dict[str, int]


# API Routes for Clients
@api_router.post("/clients", response_model=Client)
async def create_client(client: ClientCreate):
    client_dict = client.model_dump()
    client_obj = Client(**client_dict)
    client_data = client_obj.model_dump()
    result = await db.clients.insert_one(client_data)
    return client_obj


@api_router.get("/clients", response_model=List[Client])
async def get_clients():
    clients = await db.clients.find().to_list(1000)
    return [Client(**client) for client in clients]


@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str):
    client = await db.clients.find_one({"id": client_id})
    if client:
        return Client(**client)
    raise HTTPException(status_code=404, detail="Client not found")


# API Routes for Work Orders
@api_router.post("/work-orders", response_model=WorkOrder)
async def create_work_order(work_order: WorkOrderCreate):
    # Validate client exists
    client = await db.clients.find_one({"id": work_order.client_id})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    work_order_dict = work_order.model_dump()
    work_order_obj = WorkOrder(**work_order_dict)
    work_order_data = work_order_obj.model_dump()
    result = await db.work_orders.insert_one(work_order_data)
    return work_order_obj


@api_router.get("/work-orders", response_model=List[WorkOrder])
async def get_work_orders(
    status: Optional[WorkOrderStatus] = None,
    client_id: Optional[str] = None
):
    filter_query = {}
    if status:
        filter_query["status"] = status
    if client_id:
        filter_query["client_id"] = client_id
    
    work_orders = await db.work_orders.find(filter_query).to_list(1000)
    return [WorkOrder(**wo) for wo in work_orders]


@api_router.get("/work-orders/{work_order_id}", response_model=WorkOrder)
async def get_work_order(work_order_id: str):
    work_order = await db.work_orders.find_one({"id": work_order_id})
    if work_order:
        return WorkOrder(**work_order)
    raise HTTPException(status_code=404, detail="Work order not found")


@api_router.put("/work-orders/{work_order_id}", response_model=WorkOrder)
async def update_work_order(work_order_id: str, work_order_update: dict = Body(...)):
    # Update the updated_at field
    work_order_update["updated_at"] = datetime.utcnow()
    
    # If status is being changed to completed, set completed_date
    if work_order_update.get("status") == "completed":
        work_order_update["completed_date"] = datetime.utcnow()
    
    result = await db.work_orders.update_one(
        {"id": work_order_id},
        {"$set": work_order_update}
    )
    
    if result.modified_count:
        updated_work_order = await db.work_orders.find_one({"id": work_order_id})
        return WorkOrder(**updated_work_order)
    
    raise HTTPException(status_code=404, detail="Work order not found")


# API Routes for Invoices
@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice_create: InvoiceCreate):
    # Validate client exists
    client = await db.clients.find_one({"id": invoice_create.client_id})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Validate work orders exist and update them
    for wo_id in invoice_create.work_order_ids:
        work_order = await db.work_orders.find_one({"id": wo_id})
        if not work_order:
            raise HTTPException(status_code=404, detail=f"Work order {wo_id} not found")
        
        # Check if work order is already invoiced
        if work_order.get("invoiced", False):
            raise HTTPException(status_code=400, detail=f"Work order {wo_id} is already invoiced")
    
    # Calculate financial fields
    subtotal = sum(item.quantity * item.unit_price for item in invoice_create.items)
    tax_amount = sum(item.quantity * item.unit_price * (item.tax_rate / 100) for item in invoice_create.items)
    total_amount = subtotal + tax_amount
    
    # Create invoice number (simplified for simulation)
    current_year = datetime.now().year
    invoice_count = await db.invoices.count_documents({})
    invoice_number = f"A-{current_year}-{invoice_count + 1:05d}"
    
    # Create invoice object
    invoice_dict = invoice_create.model_dump()
    invoice_obj = Invoice(
        **invoice_dict,
        invoice_number=invoice_number,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total_amount=total_amount
    )
    
    # Store in database
    invoice_data = invoice_obj.model_dump()
    await db.invoices.insert_one(invoice_data)
    
    # Update work orders as invoiced
    for wo_id in invoice_create.work_order_ids:
        await db.work_orders.update_one(
            {"id": wo_id},
            {"$set": {"invoiced": True, "invoice_id": invoice_obj.id}}
        )
    
    return invoice_obj


@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices(
    status: Optional[InvoiceStatus] = None,
    client_id: Optional[str] = None
):
    filter_query = {}
    if status:
        filter_query["status"] = status
    if client_id:
        filter_query["client_id"] = client_id
    
    invoices = await db.invoices.find(filter_query).to_list(1000)
    return [Invoice(**invoice) for invoice in invoices]


@api_router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str):
    invoice = await db.invoices.find_one({"id": invoice_id})
    if invoice:
        return Invoice(**invoice)
    raise HTTPException(status_code=404, detail="Invoice not found")


@api_router.put("/invoices/{invoice_id}/status", response_model=Invoice)
async def update_invoice_status(invoice_id: str, status: InvoiceStatus):
    update_data = {
        "status": status,
        "updated_at": datetime.utcnow()
    }
    
    # If status is paid, set paid date and amount
    if status == InvoiceStatus.paid:
        invoice = await db.invoices.find_one({"id": invoice_id})
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        update_data["paid_date"] = datetime.utcnow()
        update_data["paid_amount"] = invoice.get("total_amount", 0)
    
    result = await db.invoices.update_one(
        {"id": invoice_id},
        {"$set": update_data}
    )
    
    if result.modified_count:
        updated_invoice = await db.invoices.find_one({"id": invoice_id})
        return Invoice(**updated_invoice)
    
    raise HTTPException(status_code=404, detail="Invoice not found")


# Dashboard API
@api_router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats():
    # Count work orders by status
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_counts = await db.work_orders.aggregate(pipeline).to_list(100)
    work_orders_by_status = {item["_id"]: item["count"] for item in status_counts}
    
    # Count active and completed work orders
    active_work_orders = sum(
        work_orders_by_status.get(status, 0) 
        for status in [WorkOrderStatus.pending, WorkOrderStatus.in_progress]
    )
    completed_work_orders = work_orders_by_status.get(WorkOrderStatus.completed, 0)
    
    # Get invoice statistics
    pending_invoices = await db.invoices.count_documents({"status": {"$in": [
        InvoiceStatus.draft, 
        InvoiceStatus.pending_dgi, 
        InvoiceStatus.validated_dgi,
        InvoiceStatus.sent
    ]}})
    
    paid_invoices = await db.invoices.count_documents({"status": InvoiceStatus.paid})
    
    # Calculate invoice amounts
    total_invoiced = await db.invoices.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]).to_list(1)
    
    total_paid = await db.invoices.aggregate([
        {"$match": {"status": InvoiceStatus.paid}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]).to_list(1)
    
    total_invoiced_amount = total_invoiced[0]["total"] if total_invoiced else 0
    total_paid_amount = total_paid[0]["total"] if total_paid else 0
    
    return DashboardStats(
        active_work_orders=active_work_orders,
        completed_work_orders=completed_work_orders,
        pending_invoices=pending_invoices,
        paid_invoices=paid_invoices,
        total_invoiced_amount=total_invoiced_amount,
        total_paid_amount=total_paid_amount,
        work_orders_by_status=work_orders_by_status
    )


# Basic health check
@api_router.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow()}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
