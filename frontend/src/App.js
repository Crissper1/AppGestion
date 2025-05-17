import React, { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { Dialog, Menu, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  Bars3Icon, 
  HomeIcon, 
  ClipboardDocumentListIcon, 
  CurrencyDollarIcon, 
  UserGroupIcon,
  TruckIcon,
  BuildingStorefrontIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './App.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Navigation configuration
const navigation = [
  { name: 'Dashboard', href: '#', icon: HomeIcon, current: true },
  { name: 'Órdenes de Trabajo', href: '#', icon: ClipboardDocumentListIcon, current: false },
  { name: 'Facturación', href: '#', icon: CurrencyDollarIcon, current: false },
  { name: 'Clientes', href: '#', icon: UserGroupIcon, current: false },
  { name: 'Recursos', href: '#', icon: TruckIcon, current: false },
  { name: 'Inventario', href: '#', icon: BuildingStorefrontIcon, current: false },
];

// User dropdown options
const userNavigation = [
  { name: 'Mi Perfil', href: '#' },
  { name: 'Configuración', href: '#' },
  { name: 'Cerrar Sesión', href: '#' },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Dashboard Component
function Dashboard({ stats, workOrders }) {
  // Pie chart data
  const pieData = {
    labels: ['Pendientes', 'En Progreso', 'Completadas', 'Canceladas'],
    datasets: [
      {
        label: 'Órdenes de Trabajo',
        data: [
          stats.work_orders_by_status?.pending || 0,
          stats.work_orders_by_status?.in_progress || 0,
          stats.work_orders_by_status?.completed || 0,
          stats.work_orders_by_status?.cancelled || 0,
        ],
        backgroundColor: [
          'rgba(255, 159, 64, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 99, 132, 0.7)',
        ],
        borderColor: [
          'rgba(255, 159, 64, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Bar chart data for invoices
  const barData = {
    labels: ['Facturación'],
    datasets: [
      {
        label: 'Facturado',
        data: [stats.total_invoiced_amount || 0],
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
      },
      {
        label: 'Cobrado',
        data: [stats.total_paid_amount || 0],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
    ],
  };

  const barOptions = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      title: {
        display: true,
        text: 'Facturación (UYU)',
      },
    },
  };

  return (
    <div className="dashboard">
      <div className="hero-section">
        <img
          src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40"
          alt="Dashboard Hero"
          className="hero-image"
        />
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="text-2xl font-bold text-white">Sistema de Gestión de Trabajo</h1>
          <p className="text-white text-opacity-80">Optimiza tus operaciones diarias de mantenimiento y proyectos</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon bg-amber-100 text-amber-700">
            <ClockIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="stat-title">OTs Activas</h3>
            <p className="stat-value">{stats.active_work_orders || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-green-100 text-green-700">
            <CheckCircleIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="stat-title">OTs Completadas</h3>
            <p className="stat-value">{stats.completed_work_orders || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-blue-100 text-blue-700">
            <CurrencyDollarIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="stat-title">Facturas Pendientes</h3>
            <p className="stat-value">{stats.pending_invoices || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-teal-100 text-teal-700">
            <CurrencyDollarIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="stat-title">Facturas Pagadas</h3>
            <p className="stat-value">{stats.paid_invoices || 0}</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">Estado de Órdenes de Trabajo</h3>
          <div className="h-60">
            <Pie data={pieData} />
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Facturación vs Cobros</h3>
          <div className="h-60">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      <div className="recent-orders">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Órdenes de Trabajo Recientes</h3>
          <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
            <ArrowPathIcon className="h-4 w-4 mr-1" /> Actualizar
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Programada
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.client_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={classNames(
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    )}>
                      {order.status === 'pending' ? 'Pendiente' :
                       order.status === 'in_progress' ? 'En Progreso' :
                       order.status === 'completed' ? 'Completada' :
                       'Cancelada'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.scheduled_date ? new Date(order.scheduled_date).toLocaleDateString() : 'No programada'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={classNames(
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                      order.priority >= 4 ? 'bg-red-100 text-red-800' :
                      order.priority === 3 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    )}>
                      {order.priority >= 4 ? 'Alta' :
                       order.priority === 3 ? 'Media' :
                       'Baja'}
                    </span>
                  </td>
                </tr>
              ))}
              {workOrders.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay órdenes de trabajo para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Work Order Form Component
function WorkOrderForm({ onSubmit, clients }) {
  const [workOrder, setWorkOrder] = useState({
    title: '',
    description: '',
    client_id: '',
    status: 'pending',
    scheduled_date: null,
    location: '',
    priority: 3,
    estimated_hours: 0,
    assigned_personnel: []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setWorkOrder(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setWorkOrder(prev => ({ ...prev, scheduled_date: date }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(workOrder);
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Nueva Orden de Trabajo</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Título
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              value={workOrder.title}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              required
              value={workOrder.description}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
              Cliente
            </label>
            <select
              id="client_id"
              name="client_id"
              required
              value={workOrder.client_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Seleccione un cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              id="status"
              name="status"
              value={workOrder.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="pending">Pendiente</option>
              <option value="in_progress">En Progreso</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>

          <div>
            <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700">
              Fecha Programada
            </label>
            <DatePicker
              id="scheduled_date"
              selected={workOrder.scheduled_date}
              onChange={handleDateChange}
              dateFormat="dd/MM/yyyy"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Ubicación
            </label>
            <input
              type="text"
              name="location"
              id="location"
              value={workOrder.location}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              Prioridad
            </label>
            <select
              id="priority"
              name="priority"
              value={workOrder.priority}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="1">Baja (1)</option>
              <option value="2">Baja (2)</option>
              <option value="3">Media (3)</option>
              <option value="4">Alta (4)</option>
              <option value="5">Alta (5)</option>
            </select>
          </div>

          <div>
            <label htmlFor="estimated_hours" className="block text-sm font-medium text-gray-700">
              Horas Estimadas
            </label>
            <input
              type="number"
              name="estimated_hours"
              id="estimated_hours"
              min="0"
              step="0.5"
              value={workOrder.estimated_hours}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Crear Orden de Trabajo
          </button>
        </div>
      </form>
    </div>
  );
}

// Work Orders Component
function WorkOrders({ workOrders, clients, onCreateWorkOrder }) {
  const [showForm, setShowForm] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState(workOrders);
  const [filter, setFilter] = useState({
    status: '',
    client_id: '',
  });

  useEffect(() => {
    // Apply filters
    let filtered = [...workOrders];
    
    if (filter.status) {
      filtered = filtered.filter(order => order.status === filter.status);
    }
    
    if (filter.client_id) {
      filtered = filtered.filter(order => order.client_id === filter.client_id);
    }
    
    setFilteredOrders(filtered);
  }, [workOrders, filter]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateWorkOrder = (workOrderData) => {
    onCreateWorkOrder(workOrderData);
    setShowForm(false);
  };

  return (
    <div className="work-orders-page">
      <div className="header-section">
        <div className="header-image-container">
          <img
            src="https://images.unsplash.com/photo-1621905251918-48416bd8575a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxtYWludGVuYW5jZSUyMHdvcmtlciUyMGhhcmRoYXR8ZW58MHx8fHwxNzQ3NTAzMzE3fDA&ixlib=rb-4.1.0&q=85"
            alt="Work Orders"
            className="header-image"
          />
          <div className="header-overlay"></div>
          <div className="header-content">
            <h1 className="text-2xl font-bold text-white">Órdenes de Trabajo</h1>
            <p className="text-white text-opacity-80">Gestiona y da seguimiento a todas tus órdenes de trabajo</p>
          </div>
        </div>
      </div>

      <div className="controls-section">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="in_progress">En Progreso</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
            
            <select
              name="client_id"
              value={filter.client_id}
              onChange={handleFilterChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todos los clientes</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {showForm ? 'Cancelar' : 'Nueva Orden de Trabajo'}
          </button>
        </div>

        {showForm && (
          <WorkOrderForm onSubmit={handleCreateWorkOrder} clients={clients} />
        )}
      </div>

      <div className="orders-table mt-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Programada
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horas Estimadas
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facturado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.client_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={classNames(
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    )}>
                      {order.status === 'pending' ? 'Pendiente' :
                       order.status === 'in_progress' ? 'En Progreso' :
                       order.status === 'completed' ? 'Completada' :
                       'Cancelada'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.scheduled_date ? new Date(order.scheduled_date).toLocaleDateString() : 'No programada'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={classNames(
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                      order.priority >= 4 ? 'bg-red-100 text-red-800' :
                      order.priority === 3 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    )}>
                      {order.priority >= 4 ? 'Alta' :
                       order.priority === 3 ? 'Media' :
                       'Baja'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.estimated_hours}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.invoiced ? (
                      <span className="text-green-600">Sí</span>
                    ) : (
                      <span className="text-red-600">No</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay órdenes de trabajo que coincidan con los filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Invoice Form Component
function InvoiceForm({ onSubmit, clients, workOrders }) {
  const [invoice, setInvoice] = useState({
    client_id: '',
    issue_date: new Date(),
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    invoice_type: 'e-Ticket',
    work_order_ids: [],
    items: [{ description: '', quantity: 1, unit_price: 0, tax_rate: 22 }],
    notes: '',
    payment_terms: 'Pago a 30 días'
  });

  const [selectedWorkOrders, setSelectedWorkOrders] = useState([]);

  useEffect(() => {
    // When client changes, filter available work orders
    if (invoice.client_id) {
      const filteredWOs = workOrders.filter(
        wo => wo.client_id === invoice.client_id && !wo.invoiced
      );
      setSelectedWorkOrders(filteredWOs);
    } else {
      setSelectedWorkOrders([]);
    }
  }, [invoice.client_id, workOrders]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvoice(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (field, date) => {
    setInvoice(prev => ({ ...prev, [field]: date }));
  };

  const handleWorkOrderSelection = (e, workOrderId) => {
    const isChecked = e.target.checked;
    
    setInvoice(prev => {
      let newWorkOrderIds = [...prev.work_order_ids];
      
      if (isChecked && !newWorkOrderIds.includes(workOrderId)) {
        newWorkOrderIds.push(workOrderId);
      } else if (!isChecked) {
        newWorkOrderIds = newWorkOrderIds.filter(id => id !== workOrderId);
      }
      
      return { ...prev, work_order_ids: newWorkOrderIds };
    });
  };

  const handleItemChange = (index, field, value) => {
    setInvoice(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 0, tax_rate: 22 }]
    }));
  };

  const removeItem = (index) => {
    setInvoice(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: newItems.length ? newItems : [{ description: '', quantity: 1, unit_price: 0, tax_rate: 22 }] };
    });
  };

  const calculateSubtotal = () => {
    return invoice.items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0);
  };

  const calculateTax = () => {
    return invoice.items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) * parseFloat(item.unit_price) * (parseFloat(item.tax_rate) / 100));
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...invoice,
      items: invoice.items.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        tax_rate: parseFloat(item.tax_rate)
      }))
    });
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Nuevo Comprobante Fiscal Electrónico (CFE)</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
              Cliente
            </label>
            <select
              id="client_id"
              name="client_id"
              required
              value={invoice.client_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Seleccione un cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} (RUT: {client.rut})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="invoice_type" className="block text-sm font-medium text-gray-700">
              Tipo de Comprobante
            </label>
            <select
              id="invoice_type"
              name="invoice_type"
              value={invoice.invoice_type}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="e-Ticket">e-Ticket</option>
              <option value="e-Factura">e-Factura</option>
              <option value="Nota de Crédito">Nota de Crédito e-Ticket</option>
              <option value="Nota de Débito">Nota de Débito e-Ticket</option>
            </select>
          </div>

          <div>
            <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700">
              Fecha de Emisión
            </label>
            <DatePicker
              id="issue_date"
              selected={invoice.issue_date}
              onChange={(date) => handleDateChange('issue_date', date)}
              dateFormat="dd/MM/yyyy"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
              Fecha de Vencimiento
            </label>
            <DatePicker
              id="due_date"
              selected={invoice.due_date}
              onChange={(date) => handleDateChange('due_date', date)}
              dateFormat="dd/MM/yyyy"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="payment_terms" className="block text-sm font-medium text-gray-700">
              Condiciones de Pago
            </label>
            <input
              type="text"
              name="payment_terms"
              id="payment_terms"
              value={invoice.payment_terms}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {invoice.client_id && selectedWorkOrders.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Órdenes de Trabajo Disponibles</h4>
            <div className="bg-gray-50 p-4 rounded-md">
              {selectedWorkOrders.map((wo) => (
                <div key={wo.id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={`wo-${wo.id}`}
                    checked={invoice.work_order_ids.includes(wo.id)}
                    onChange={(e) => handleWorkOrderSelection(e, wo.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`wo-${wo.id}`} className="ml-2 block text-sm text-gray-900">
                    {wo.title} - {wo.status === 'completed' ? 'Completada' : 'En progreso'}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Detalles de Ítems</h4>
          {invoice.items.map((item, index) => (
            <div key={index} className="mb-4 bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor={`item-desc-${index}`} className="block text-xs font-medium text-gray-700">
                    Descripción
                  </label>
                  <input
                    type="text"
                    id={`item-desc-${index}`}
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs"
                  />
                </div>
                <div>
                  <label htmlFor={`item-qty-${index}`} className="block text-xs font-medium text-gray-700">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    id={`item-qty-${index}`}
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    required
                    min="0.01"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs"
                  />
                </div>
                <div>
                  <label htmlFor={`item-price-${index}`} className="block text-xs font-medium text-gray-700">
                    Precio Unitario
                  </label>
                  <input
                    type="number"
                    id={`item-price-${index}`}
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs"
                  />
                </div>
                <div>
                  <label htmlFor={`item-tax-${index}`} className="block text-xs font-medium text-gray-700">
                    IVA (%)
                  </label>
                  <select
                    id={`item-tax-${index}`}
                    value={item.tax_rate}
                    onChange={(e) => handleItemChange(index, 'tax_rate', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs"
                  >
                    <option value="0">Exento (0%)</option>
                    <option value="10">Tasa Reducida (10%)</option>
                    <option value="22">Tasa Básica (22%)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-900"
                    disabled={invoice.items.length === 1}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addItem}
            className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Agregar Ítem
          </button>
        </div>

        <div className="mt-6">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notas
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={invoice.notes}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div className="mt-6 bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-500">Subtotal:</span>
            <span className="text-sm font-medium">$ {calculateSubtotal().toFixed(2)} UYU</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-500">IVA:</span>
            <span className="text-sm font-medium">$ {calculateTax().toFixed(2)} UYU</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Total:</span>
            <span className="text-sm font-bold">$ {calculateTotal().toFixed(2)} UYU</span>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Crear Comprobante
          </button>
        </div>
      </form>
    </div>
  );
}

// Invoices Component
function Invoices({ invoices, clients, workOrders, onCreateInvoice }) {
  const [showForm, setShowForm] = useState(false);
  const [filteredInvoices, setFilteredInvoices] = useState(invoices);
  const [filter, setFilter] = useState({
    status: '',
    client_id: '',
  });

  useEffect(() => {
    // Apply filters
    let filtered = [...invoices];
    
    if (filter.status) {
      filtered = filtered.filter(invoice => invoice.status === filter.status);
    }
    
    if (filter.client_id) {
      filtered = filtered.filter(invoice => invoice.client_id === filter.client_id);
    }
    
    setFilteredInvoices(filtered);
  }, [invoices, filter]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateInvoice = (invoiceData) => {
    onCreateInvoice(invoiceData);
    setShowForm(false);
  };

  // Find client name by id
  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente desconocido';
  };

  return (
    <div className="invoices-page">
      <div className="header-section">
        <div className="header-image-container">
          <img
            src="https://images.unsplash.com/photo-1735825764451-d2186b7f4bf9"
            alt="Invoices"
            className="header-image"
          />
          <div className="header-overlay"></div>
          <div className="header-content">
            <h1 className="text-2xl font-bold text-white">Facturación Electrónica</h1>
            <p className="text-white text-opacity-80">Gestión de comprobantes fiscales electrónicos (CFE)</p>
          </div>
        </div>
      </div>

      <div className="controls-section">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="pending_dgi">Pendiente DGI</option>
              <option value="validated_dgi">Validado DGI</option>
              <option value="sent">Enviado</option>
              <option value="paid">Pagado</option>
              <option value="cancelled">Anulado</option>
            </select>
            
            <select
              name="client_id"
              value={filter.client_id}
              onChange={handleFilterChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todos los clientes</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {showForm ? 'Cancelar' : 'Nuevo Comprobante'}
          </button>
        </div>

        {showForm && (
          <InvoiceForm 
            onSubmit={handleCreateInvoice} 
            clients={clients} 
            workOrders={workOrders.filter(wo => !wo.invoiced && wo.status === 'completed')} 
          />
        )}
      </div>

      <div className="invoices-table mt-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nº CFE
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Emisión
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getClientName(invoice.client_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.invoice_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.issue_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={classNames(
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                      invoice.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      invoice.status === 'pending_dgi' ? 'bg-yellow-100 text-yellow-800' :
                      invoice.status === 'validated_dgi' ? 'bg-blue-100 text-blue-800' :
                      invoice.status === 'sent' ? 'bg-indigo-100 text-indigo-800' :
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    )}>
                      {invoice.status === 'draft' ? 'Borrador' :
                       invoice.status === 'pending_dgi' ? 'Pendiente DGI' :
                       invoice.status === 'validated_dgi' ? 'Validado DGI' :
                       invoice.status === 'sent' ? 'Enviado' :
                       invoice.status === 'paid' ? 'Pagado' :
                       'Anulado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    $ {invoice.total_amount.toFixed(2)} UYU
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-900 mr-2">Ver PDF</button>
                    <button className="text-blue-600 hover:text-blue-900 mr-2">Enviar</button>
                    {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                      <button className="text-green-600 hover:text-green-900">Registrar Pago</button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay comprobantes que coincidan con los filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Client Form Component
function ClientForm({ onSubmit }) {
  const [client, setClient] = useState({
    name: '',
    rut: '',
    business_name: '',
    address: '',
    email: '',
    phone: '',
    contact_person: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClient(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(client);
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Nuevo Cliente</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre Comercial
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              value={client.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="rut" className="block text-sm font-medium text-gray-700">
              RUT
            </label>
            <input
              type="text"
              name="rut"
              id="rut"
              required
              value={client.rut}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">
              Razón Social
            </label>
            <input
              type="text"
              name="business_name"
              id="business_name"
              required
              value={client.business_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Dirección Fiscal
            </label>
            <input
              type="text"
              name="address"
              id="address"
              required
              value={client.address}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={client.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <input
              type="text"
              name="phone"
              id="phone"
              value={client.phone}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700">
              Persona de Contacto
            </label>
            <input
              type="text"
              name="contact_person"
              id="contact_person"
              value={client.contact_person}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Crear Cliente
          </button>
        </div>
      </form>
    </div>
  );
}

// Clients Component
function Clients({ clients, onCreateClient }) {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState(clients);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClients(clients);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredClients(
        clients.filter(
          client =>
            client.name.toLowerCase().includes(term) ||
            client.business_name.toLowerCase().includes(term) ||
            client.rut.toLowerCase().includes(term)
        )
      );
    }
  }, [clients, searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCreateClient = (clientData) => {
    onCreateClient(clientData);
    setShowForm(false);
  };

  return (
    <div className="clients-page">
      <div className="header-section-simple">
        <h1 className="text-2xl font-bold">Gestión de Clientes</h1>
        <p className="text-gray-600">Administra la información de tus clientes para facturación y órdenes de trabajo</p>
      </div>

      <div className="controls-section">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar clientes..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {showForm ? 'Cancelar' : 'Nuevo Cliente'}
          </button>
        </div>

        {showForm && (
          <ClientForm onSubmit={handleCreateClient} />
        )}
      </div>

      <div className="clients-grid mt-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="client-card">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium text-gray-900">{client.name}</h3>
              <Menu as="div" className="relative inline-block text-left">
                <div>
                  <Menu.Button className="flex items-center text-gray-400 hover:text-gray-600">
                    <span className="sr-only">Open options</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </Menu.Button>
                </div>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href="#"
                            className={classNames(
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                              'block px-4 py-2 text-sm'
                            )}
                          >
                            Editar
                          </a>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href="#"
                            className={classNames(
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                              'block px-4 py-2 text-sm'
                            )}
                          >
                            Ver órdenes de trabajo
                          </a>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href="#"
                            className={classNames(
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                              'block px-4 py-2 text-sm'
                            )}
                          >
                            Ver facturas
                          </a>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
            
            <div className="mt-2">
              <p className="text-sm text-gray-500">RUT: {client.rut}</p>
              <p className="text-sm text-gray-500">Razón Social: {client.business_name}</p>
            </div>
            
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="flex items-center text-sm text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {client.email || 'No registrado'}
              </div>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {client.phone || 'No registrado'}
              </div>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {client.address || 'No registrada'}
              </div>
            </div>
            
            {client.contact_person && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Contacto:</span> {client.contact_person}
                </p>
              </div>
            )}
          </div>
        ))}
        
        {filteredClients.length === 0 && (
          <div className="col-span-full p-4 text-center text-gray-500">
            No se encontraron clientes que coincidan con la búsqueda
          </div>
        )}
      </div>
    </div>
  );
}

// Main App Component
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('Dashboard');
  const [dashboardStats, setDashboardStats] = useState({
    active_work_orders: 0,
    completed_work_orders: 0,
    pending_invoices: 0,
    paid_invoices: 0,
    total_invoiced_amount: 0,
    total_paid_amount: 0,
    work_orders_by_status: {}
  });
  const [clients, setClients] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get the backend URL from environment variables
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // Fetch all required data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard stats
        const statsResponse = await fetch(`${backendUrl}/api/dashboard`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setDashboardStats(statsData);
        }
        
        // Fetch clients
        let clientsData = []; // Define clientsData outside the if block
        const clientsResponse = await fetch(`${backendUrl}/api/clients`);
        if (clientsResponse.ok) {
          clientsData = await clientsResponse.json();
          setClients(clientsData);
        }
        
        // Fetch work orders
        const workOrdersResponse = await fetch(`${backendUrl}/api/work-orders`);
        if (workOrdersResponse.ok) {
          const workOrdersData = await workOrdersResponse.json();
          
          // Enhance work orders with client names
          const clientsMap = clientsData.reduce((map, client) => {
            map[client.id] = client.name;
            return map;
          }, {});
          
          const enhancedWorkOrders = workOrdersData.map(wo => ({
            ...wo,
            client_name: clientsMap[wo.client_id] || 'Cliente Desconocido'
          }));
          
          setWorkOrders(enhancedWorkOrders);
        }
        
        // Fetch invoices
        const invoicesResponse = await fetch(`${backendUrl}/api/invoices`);
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json();
          setInvoices(invoicesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [backendUrl]);

  // Create a new client
  const handleCreateClient = async (clientData) => {
    try {
      const response = await fetch(`${backendUrl}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
      
      if (response.ok) {
        const newClient = await response.json();
        setClients(prevClients => [...prevClients, newClient]);
      }
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  // Create a new work order
  const handleCreateWorkOrder = async (workOrderData) => {
    try {
      const response = await fetch(`${backendUrl}/api/work-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workOrderData),
      });
      
      if (response.ok) {
        const newWorkOrder = await response.json();
        
        // Add client name to the work order
        const client = clients.find(c => c.id === newWorkOrder.client_id);
        const enhancedWorkOrder = {
          ...newWorkOrder,
          client_name: client ? client.name : 'Cliente Desconocido'
        };
        
        setWorkOrders(prevWorkOrders => [...prevWorkOrders, enhancedWorkOrder]);
        
        // Refresh dashboard stats
        const statsResponse = await fetch(`${backendUrl}/api/dashboard`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setDashboardStats(statsData);
        }
      }
    } catch (error) {
      console.error('Error creating work order:', error);
    }
  };

  // Create a new invoice
  const handleCreateInvoice = async (invoiceData) => {
    try {
      const response = await fetch(`${backendUrl}/api/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });
      
      if (response.ok) {
        const newInvoice = await response.json();
        setInvoices(prevInvoices => [...prevInvoices, newInvoice]);
        
        // Update work orders that were just invoiced
        setWorkOrders(prevWorkOrders => 
          prevWorkOrders.map(wo => 
            invoiceData.work_order_ids.includes(wo.id) 
              ? { ...wo, invoiced: true, invoice_id: newInvoice.id } 
              : wo
          )
        );
        
        // Refresh dashboard stats
        const statsResponse = await fetch(`${backendUrl}/api/dashboard`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setDashboardStats(statsData);
        }
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  return (
    <div className="app-container">
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex flex-shrink-0 items-center px-4">
                  <h1 className="text-lg font-bold text-gray-900">Sistema de Gestión</h1>
                </div>
                <div className="mt-5 h-0 flex-1 overflow-y-auto">
                  <nav className="space-y-1 px-2">
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className={classNames(
                          item.name === currentTab
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                          'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentTab(item.name);
                          setSidebarOpen(false);
                        }}
                      >
                        <item.icon
                          className={classNames(
                            item.name === currentTab ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                            'mr-4 flex-shrink-0 h-6 w-6'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </a>
                    ))}
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
            <div className="w-14 flex-shrink-0" aria-hidden="true">
              {/* Dummy element to force sidebar to shrink to fit close icon */}
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white pt-5">
          <div className="flex flex-shrink-0 items-center px-4">
            <h1 className="text-lg font-bold text-gray-900">Sistema de Gestión</h1>
          </div>
          <div className="mt-5 flex flex-grow flex-col">
            <nav className="flex-1 space-y-1 px-2 pb-4">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    item.name === currentTab
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentTab(item.name);
                  }}
                >
                  <item.icon
                    className={classNames(
                      item.name === currentTab ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 flex-shrink-0 h-6 w-6'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="md:pl-64">
        <div className="mx-auto flex max-w-full flex-col">
          <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow">
            <button
              type="button"
              className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="flex flex-1 justify-between px-4">
              <div className="flex flex-1">
                <h2 className="text-xl font-semibold text-gray-800 self-center">
                  {currentTab}
                </h2>
              </div>
              <div className="ml-4 flex items-center md:ml-6">
                {/* Profile dropdown */}
                <Menu as="div" className="relative ml-3">
                  <div>
                    <Menu.Button className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                      <span className="sr-only">Open user menu</span>
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                        <span>A</span>
                      </div>
                      <span className="ml-2 hidden md:block text-sm font-medium text-gray-700">Admin</span>
                      <ChevronDownIcon className="ml-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {userNavigation.map((item) => (
                        <Menu.Item key={item.name}>
                          {({ active }) => (
                            <a
                              href={item.href}
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block px-4 py-2 text-sm text-gray-700'
                              )}
                            >
                              {item.name}
                            </a>
                          )}
                        </Menu.Item>
                      ))}
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
          </div>

          <main className="flex-1">
            <div className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                {loading ? (
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                      <p className="mt-4 text-gray-600">Cargando...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {currentTab === 'Dashboard' && (
                      <Dashboard 
                        stats={dashboardStats} 
                        workOrders={workOrders.slice(0, 5)}
                      />
                    )}
                    
                    {currentTab === 'Órdenes de Trabajo' && (
                      <WorkOrders 
                        workOrders={workOrders} 
                        clients={clients} 
                        onCreateWorkOrder={handleCreateWorkOrder}
                      />
                    )}
                    
                    {currentTab === 'Facturación' && (
                      <Invoices 
                        invoices={invoices} 
                        clients={clients} 
                        workOrders={workOrders}
                        onCreateInvoice={handleCreateInvoice}
                      />
                    )}
                    
                    {currentTab === 'Clientes' && (
                      <Clients 
                        clients={clients} 
                        onCreateClient={handleCreateClient}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
