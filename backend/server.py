from fastapi import FastAPI, APIRouter, HTTPException, Query, Body, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Union
import uuid
from datetime import datetime, date, timedelta
from enum import Enum
from passlib.context import CryptContext
from jose import JWTError, jwt
import secrets

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


class ResourceType(str, Enum):
    personnel = "personnel"
    vehicle = "vehicle"
    equipment = "equipment"


class ResourceStatus(str, Enum):
    available = "available"
    assigned = "assigned"
    maintenance = "maintenance"
    unavailable = "unavailable"


class InventoryCategory(str, Enum):
    material = "material"
    tool = "tool"
    spare_part = "spare_part"
    consumable = "consumable"


class UserRole(str, Enum):
    admin = "admin"
    manager = "manager"
    supervisor = "supervisor"
    technician = "technician"
    viewer = "viewer"


# Authentication Setup
SECRET_KEY = os.environ.get("SECRET_KEY", secrets.token_hex(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"username": username})
    if user is None:
        raise credentials_exception
    return user


# Base Models
class BaseDBModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# User Models
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.technician
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class User(UserBase, BaseDBModel):
    pass


class UserInDB(User):
    hashed_password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


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
    scheduled_date: Optional[datetime] = None
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
    issue_date: datetime = Field(default_factory=datetime.utcnow)
    due_date: Optional[datetime] = None
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


# Resource Models
class ResourceBase(BaseModel):
    name: str
    type: ResourceType
    status: ResourceStatus = ResourceStatus.available
    description: Optional[str] = None
    identification: Optional[str] = None  # ID, license plate, etc.
    hourly_cost: Optional[float] = None
    specialties: Optional[List[str]] = []
    notes: Optional[str] = None


class ResourceCreate(ResourceBase):
    pass


class Resource(ResourceBase, BaseDBModel):
    assigned_work_orders: List[str] = []  # List of work order IDs
    current_location: Optional[str] = None
    availability_schedule: Optional[Dict[str, Any]] = None
    last_maintenance_date: Optional[datetime] = None
    next_maintenance_date: Optional[datetime] = None


# Inventory Models
class InventoryItemBase(BaseModel):
    name: str
    category: InventoryCategory
    description: Optional[str] = None
    unit: str = "unidad"  # unit, kg, m, etc.
    unit_cost: float
    minimum_stock: Optional[int] = None
    current_stock: int = 0
    location: Optional[str] = None
    supplier_id: Optional[str] = None
    image_url: Optional[str] = None


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItem(InventoryItemBase, BaseDBModel):
    last_restock_date: Optional[datetime] = None
    last_use_date: Optional[datetime] = None
    stock_movement_history: List[Dict[str, Any]] = []


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


# Authentication API Routes
@api_router.post("/auth/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.users.find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@api_router.post("/auth/register", response_model=User)
async def register_user(user: UserCreate):
    # Check if username already exists
    existing_user = await db.users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    existing_email = await db.users.find_one({"email": user.email})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user with hashed password
    hashed_password = get_password_hash(user.password)
    user_data = user.model_dump()
    del user_data["password"]
    
    user_in_db = UserInDB(
        **user_data,
        hashed_password=hashed_password,
        id=str(uuid.uuid4()),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    await db.users.insert_one(user_in_db.model_dump())
    
    # Return the user without the hashed password
    return User(**user_data, id=user_in_db.id, created_at=user_in_db.created_at, updated_at=user_in_db.updated_at)


@api_router.get("/auth/me", response_model=User)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)


# Resource API Routes
@api_router.post("/resources", response_model=Resource)
async def create_resource(resource: ResourceCreate):
    resource_dict = resource.model_dump()
    resource_obj = Resource(**resource_dict)
    resource_data = resource_obj.model_dump()
    result = await db.resources.insert_one(resource_data)
    return resource_obj


@api_router.get("/resources", response_model=List[Resource])
async def get_resources(
    type: Optional[ResourceType] = None,
    status: Optional[ResourceStatus] = None
):
    filter_query = {}
    if type:
        filter_query["type"] = type
    if status:
        filter_query["status"] = status
    
    resources = await db.resources.find(filter_query).to_list(1000)
    return [Resource(**resource) for resource in resources]


@api_router.get("/resources/{resource_id}", response_model=Resource)
async def get_resource(resource_id: str):
    resource = await db.resources.find_one({"id": resource_id})
    if resource:
        return Resource(**resource)
    raise HTTPException(status_code=404, detail="Resource not found")


@api_router.put("/resources/{resource_id}", response_model=Resource)
async def update_resource(resource_id: str, resource_update: dict = Body(...)):
    resource_update["updated_at"] = datetime.utcnow()
    
    result = await db.resources.update_one(
        {"id": resource_id},
        {"$set": resource_update}
    )
    
    if result.modified_count:
        updated_resource = await db.resources.find_one({"id": resource_id})
        return Resource(**updated_resource)
    
    raise HTTPException(status_code=404, detail="Resource not found")


# Inventory API Routes
@api_router.post("/inventory", response_model=InventoryItem)
async def create_inventory_item(item: InventoryItemCreate):
    item_dict = item.model_dump()
    item_obj = InventoryItem(**item_dict)
    item_data = item_obj.model_dump()
    result = await db.inventory.insert_one(item_data)
    return item_obj


@api_router.get("/inventory", response_model=List[InventoryItem])
async def get_inventory_items(
    category: Optional[InventoryCategory] = None,
    low_stock: Optional[bool] = None
):
    filter_query = {}
    if category:
        filter_query["category"] = category
    
    # Add low stock filter if requested
    if low_stock:
        filter_query["$expr"] = {
            "$lte": ["$current_stock", {"$ifNull": ["$minimum_stock", 0]}]
        }
    
    items = await db.inventory.find(filter_query).to_list(1000)
    return [InventoryItem(**item) for item in items]


@api_router.get("/inventory/{item_id}", response_model=InventoryItem)
async def get_inventory_item(item_id: str):
    item = await db.inventory.find_one({"id": item_id})
    if item:
        return InventoryItem(**item)
    raise HTTPException(status_code=404, detail="Inventory item not found")


@api_router.put("/inventory/{item_id}", response_model=InventoryItem)
async def update_inventory_item(item_id: str, item_update: dict = Body(...)):
    item_update["updated_at"] = datetime.utcnow()
    
    # If stock is being updated, add to movement history
    if "current_stock" in item_update:
        current_item = await db.inventory.find_one({"id": item_id})
        if current_item:
            old_stock = current_item.get("current_stock", 0)
            new_stock = item_update["current_stock"]
            change = new_stock - old_stock
            
            movement = {
                "date": datetime.utcnow(),
                "previous_stock": old_stock,
                "new_stock": new_stock,
                "change": change,
                "reason": item_update.get("movement_reason", "Manual update")
            }
            
            await db.inventory.update_one(
                {"id": item_id},
                {"$push": {"stock_movement_history": movement}}
            )
            
            # Update last_restock_date if stock increased
            if change > 0:
                item_update["last_restock_date"] = datetime.utcnow()
            # Update last_use_date if stock decreased
            elif change < 0:
                item_update["last_use_date"] = datetime.utcnow()
    
    result = await db.inventory.update_one(
        {"id": item_id},
        {"$set": item_update}
    )
    
    if result.modified_count:
        updated_item = await db.inventory.find_one({"id": item_id})
        return InventoryItem(**updated_item)
    
    raise HTTPException(status_code=404, detail="Inventory item not found")


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
