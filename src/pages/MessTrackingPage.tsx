import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Utensils, Calendar, Plus, User, Search, Check, AlertCircle 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

const MessTrackingPage: React.FC = () => {
  const [messPayments, setMessPayments] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [pendingMess, setPendingMess] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    tenant_id: '',
    month: format(new Date(), 'yyyy-MM-01'),
    mess_charge: 0,
    payment_date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const firstDayOfMonth = `${selectedMonth}-01`;
      
      // Fetch mess payments for the selected month
      const { data: messData, error: messError } = await supabase
        .from('mess_payments')
        .select(`
          id, mess_charge, payment_date,
          tenants(id, name, phone)
        `)
        .eq('month', firstDayOfMonth);
      
      if (messError) throw messError;
      
      setMessPayments(messData || []);
      
      // Fetch active tenants who use mess
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select(`
          id, name, phone, join_date
        `)
        .is('leave_date', null)
        .eq('uses_mess', true)
        .order('name');
      
      if (tenantsError) throw tenantsError;
      
      setTenants(tenantsData || []);
      
      // Calculate tenants who haven't paid mess for the month
      const paidTenantIds = messData?.map(payment => payment.tenants.id) || [];
      const pendingTenants = tenantsData?.filter(tenant => !paidTenantIds.includes(tenant.id)) || [];
      
      setPendingMess(pendingTenants);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('mess_payments')
        .insert([{
          tenant_id: formData.tenant_id,
          month: formData.month,
          mess_charge: formData.mess_charge,
          payment_date: formData.payment_date
        }]);
      
      if (error) throw error;
      
      toast.success('Mess payment added successfully');
      setFormData({
        tenant_id: '',
        month: format(new Date(), 'yyyy-MM-01'),
        mess_charge: 0,
        payment_date: format(new Date(), 'yyyy-MM-dd')
      });
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error('Error adding mess payment:', error);
      toast.error('Failed to add mess payment');
    }
  };

  const filteredMessPayments = messPayments.filter(payment => 
    payment.tenants.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.tenants.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Mess Tracking</h1>
        
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus size={18} className="mr-2" />
            Add Payment
          </button>
        </div>
      </div>
      
      {/* Add Payment Form */}
      {showAddForm && (
        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle>Add Mess Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMessPayment} className="space-y-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="tenant_id" className="block text-sm font-medium text-gray-700">
                    Tenant
                  </label>
                  <select
                    id="tenant_id"
                    required
                    value={formData.tenant_id}
                    onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Select a tenant</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="month" className="block text-sm font-medium text-gray-700">
                    Month
                  </label>
                  <input
                    type="date"
                    id="month"
                    required
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="mess_charge" className="block text-sm font-medium text-gray-700">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    id="mess_charge"
                    required
                    min="0"
                    value={formData.mess_charge}
                    onChange={(e) => setFormData({ ...formData, mess_charge: parseInt(e.target.value) })}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    id="payment_date"
                    required
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
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
                  Add Payment
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      {/* Month Selection and Search */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-2">
          <Calendar size={18} className="text-gray-500" />
          <span className="text-sm text-gray-500">Month:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="mt-1 block py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
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
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Utensils className="w-6 h-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500">Total Mess Collected</h2>
                <p className="text-2xl font-semibold text-gray-800">
                  ₹{messPayments.reduce((sum, payment) => sum + payment.mess_charge, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500">Payments Received</h2>
                <p className="text-2xl font-semibold text-gray-800">{messPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500">Pending Payments</h2>
                <p className="text-2xl font-semibold text-gray-800">{pendingMess.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Pending Mess Payments */}
      {pendingMess.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle size={18} className="mr-2 text-red-500" />
              Pending Mess Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingMess.map((tenant) => (
                    <tr key={tenant.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <User size={20} className="text-amber-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                            <div className="text-sm text-gray-500">{tenant.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setFormData({ ...formData, tenant_id: tenant.id });
                            setShowAddForm(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Record Payment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Mess Payments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Utensils size={18} className="mr-2" />
            Mess Payments for {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : filteredMessPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMessPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <User size={20} className="text-amber-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{payment.tenants.name}</div>
                            <div className="text-sm text-gray-500">{payment.tenants.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(payment.payment_date), 'dd MMM yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₹{payment.mess_charge}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          to={`/tenants/${payment.tenants.id}`} 
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Tenant
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                <Utensils size={32} className="text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No payments found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery ? 'Try a different search term' : `No mess payments recorded for ${format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}`}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus size={18} className="mr-2" />
                    Add Payment
                  </button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MessTrackingPage;