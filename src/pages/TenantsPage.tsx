import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  UserPlus, Search, Filter, Check, X, Phone, 
  Calendar, Home as HomeIcon, CreditCard 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

const TenantsPage: React.FC = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    room_id: '',
    join_date: format(new Date(), 'yyyy-MM-dd'),
    uses_mess: false,
    deposit_amount: 0
  });
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'left'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTenants();
    fetchRooms();
  }, [filter]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('tenants')
        .select(`
          id, name, phone, join_date, leave_date, uses_mess, deposit_amount,
          rooms(id, name, rent)
        `)
        .order('name');

      if (filter === 'active') {
        query = query.is('leave_date', null);
      } else if (filter === 'left') {
        query = query.not('leave_date', 'is', null);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, rent')
        .order('name');
      
      if (error) throw error;
      
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to load rooms');
    }
  };

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('tenants')
        .insert([
          {
            name: formData.name,
            phone: formData.phone,
            room_id: formData.room_id,
            join_date: formData.join_date,
            uses_mess: formData.uses_mess,
            deposit_amount: formData.deposit_amount
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Also add deposit transaction
      if (formData.deposit_amount > 0) {
        await supabase
          .from('deposit_transactions')
          .insert([
            {
              tenant_id: data[0].id,
              date: formData.join_date,
              amount: formData.deposit_amount,
              type: 'deduction',
              reason: 'Initial deposit collection'
            }
          ]);
      }
      
      toast.success('Tenant added successfully');
      setFormData({
        name: '',
        phone: '',
        room_id: '',
        join_date: format(new Date(), 'yyyy-MM-dd'),
        uses_mess: false,
        deposit_amount: 0
      });
      setShowAddForm(false);
      fetchTenants();
    } catch (error) {
      console.error('Error adding tenant:', error);
      toast.error('Failed to add tenant');
    }
  };

  const handleMarkAsLeft = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ leave_date: format(new Date(), 'yyyy-MM-dd') })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Tenant marked as left');
      fetchTenants();
    } catch (error) {
      console.error('Error marking tenant as left:', error);
      toast.error('Failed to update tenant');
    }
  };

  const filteredTenants = tenants.filter(tenant => 
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Tenants</h1>
        
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <UserPlus size={18} className="mr-2" />
            Add Tenant
          </button>
        </div>
      </div>
      
      {/* Add Tenant Form */}
      {showAddForm && (
        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle>Add New Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTenant} className="space-y-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="room_id" className="block text-sm font-medium text-gray-700">
                    Room
                  </label>
                  <select
                    id="room_id"
                    required
                    value={formData.room_id}
                    onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Select a room</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name} (₹{room.rent}/month)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="join_date" className="block text-sm font-medium text-gray-700">
                    Join Date
                  </label>
                  <input
                    type="date"
                    id="join_date"
                    required
                    value={formData.join_date}
                    onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="deposit_amount" className="block text-sm font-medium text-gray-700">
                    Deposit Amount (₹)
                  </label>
                  <input
                    type="number"
                    id="deposit_amount"
                    required
                    min="0"
                    value={formData.deposit_amount}
                    onChange={(e) => setFormData({ ...formData, deposit_amount: parseInt(e.target.value) })}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="flex items-center h-full pt-6">
                  <input
                    type="checkbox"
                    id="uses_mess"
                    checked={formData.uses_mess}
                    onChange={(e) => setFormData({ ...formData, uses_mess: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="uses_mess" className="ml-2 block text-sm text-gray-700">
                    Uses Mess
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Tenant
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      {/* Search and Filter */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search tenants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 focus:ring-blue-500 focus:border-blue-500 block w-full sm:w-80 shadow-sm sm:text-sm border-gray-300 rounded-md"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter size={18} className="text-gray-500" />
          <span className="text-sm text-gray-500">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Tenants</option>
            <option value="active">Active Only</option>
            <option value="left">Left Only</option>
          </select>
        </div>
      </div>
      
      {/* Tenants List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTenants.length > 0 ? (
            filteredTenants.map((tenant) => (
              <Card key={tenant.id} className="transition-all duration-200 hover:shadow-md">
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{tenant.name}</h3>
                        <div className="flex items-center mt-1 text-gray-500">
                          <Phone size={16} className="mr-1" />
                          <span className="text-sm">{tenant.phone}</span>
                        </div>
                      </div>
                      
                      <div>
                        {tenant.leave_date ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <X size={12} className="mr-1" />
                            Left
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check size={12} className="mr-1" />
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-sm">
                        <HomeIcon size={16} className="mr-2 text-gray-500" />
                        <span className="text-gray-700">{tenant.rooms?.name || 'N/A'} - ₹{tenant.rooms?.rent || 0}/month</span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Calendar size={16} className="mr-2 text-gray-500" />
                        <span className="text-gray-700">
                          Joined: {format(new Date(tenant.join_date), 'dd MMM yyyy')}
                        </span>
                      </div>
                      
                      {tenant.leave_date && (
                        <div className="flex items-center text-sm">
                          <Calendar size={16} className="mr-2 text-gray-500" />
                          <span className="text-gray-700">
                            Left: {format(new Date(tenant.leave_date), 'dd MMM yyyy')}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm">
                        <CreditCard size={16} className="mr-2 text-gray-500" />
                        <span className="text-gray-700">
                          Deposit: ₹{tenant.deposit_amount}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between">
                    <Link
                      to={`/tenants/${tenant.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </Link>
                    
                    {!tenant.leave_date && (
                      <button
                        onClick={() => handleMarkAsLeft(tenant.id)}
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Mark as Left
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 text-center">
              <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                <UserPlus size={32} className="text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No tenants found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery ? 'Try a different search term' : 'Add a new tenant to get started'}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <UserPlus size={18} className="mr-2" />
                    Add Tenant
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TenantsPage;