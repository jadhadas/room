import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Wallet, Plus, User, Search, ArrowDown, ArrowUp
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

const DepositManagementPage: React.FC = () => {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    tenant_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: 0,
    type: 'deduction',
    reason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all deposit transactions
      const { data: depositData, error: depositError } = await supabase
        .from('deposit_transactions')
        .select(`
          id, date, amount, type, reason,
          tenants(id, name, phone, deposit_amount)
        `)
        .order('date', { ascending: false });
      
      if (depositError) throw depositError;
      
      setDeposits(depositData || []);
      
      // Fetch active tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select(`
          id, name, phone, deposit_amount
        `)
        .is('leave_date', null)
        .order('name');
      
      if (tenantsError) throw tenantsError;
      
      setTenants(tenantsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('deposit_transactions')
        .insert([{
          tenant_id: formData.tenant_id,
          date: formData.date,
          amount: formData.amount,
          type: formData.type,
          reason: formData.reason
        }]);
      
      if (error) throw error;
      
      toast.success('Deposit transaction added successfully');
      setFormData({
        tenant_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: 0,
        type: 'deduction',
        reason: ''
      });
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error('Error adding deposit transaction:', error);
      toast.error('Failed to add deposit transaction');
    }
  };

  const filteredDeposits = deposits.filter(deposit => 
    deposit.tenants.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deposit.tenants.phone.includes(searchQuery) ||
    deposit.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalInitialDeposits = tenants.reduce((sum, tenant) => sum + tenant.deposit_amount, 0);
  const totalDeductions = deposits
    .filter(d => d.type === 'deduction')
    .reduce((sum, d) => sum + d.amount, 0);
  const totalRefunds = deposits
    .filter(d => d.type === 'refund')
    .reduce((sum, d) => sum + d.amount, 0);
  const currentDepositsHeld = totalInitialDeposits - totalDeductions + totalRefunds;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Deposit Management</h1>
        
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus size={18} className="mr-2" />
            Add Transaction
          </button>
        </div>
      </div>
      
      {/* Add Transaction Form */}
      {showAddForm && (
        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle>Add Deposit Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddDeposit} className="space-y-4">
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
                        {tenant.name} (Initial Deposit: ₹{tenant.deposit_amount})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Transaction Type
                  </label>
                  <select
                    id="type"
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="deduction">Deduction (from deposit)</option>
                    <option value="refund">Refund (to deposit)</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    required
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Transaction Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                    Reason
                  </label>
                  <input
                    type="text"
                    id="reason"
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="E.g., Damage repair, Last month rent, etc."
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
                  Add Transaction
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by tenant name, phone, or reason..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 focus:ring-blue-500 focus:border-blue-500 block w-full sm:w-80 shadow-sm sm:text-sm border-gray-300 rounded-md"
        />
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500">Initial Deposits</h2>
                <p className="text-2xl font-semibold text-gray-800">₹{totalInitialDeposits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <ArrowDown className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500">Total Deductions</h2>
                <p className="text-2xl font-semibold text-gray-800">₹{totalDeductions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <ArrowUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500">Total Refunds</h2>
                <p className="text-2xl font-semibold text-gray-800">₹{totalRefunds}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Wallet className="w-6 h-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500">Current Balance</h2>
                <p className="text-2xl font-semibold text-gray-800">₹{currentDepositsHeld}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Deposit Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet size={18} className="mr-2" />
            Deposit Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : filteredDeposits.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDeposits.map((deposit) => (
                    <tr key={deposit.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={20} className="text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{deposit.tenants.name}</div>
                            <div className="text-sm text-gray-500">{deposit.tenants.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(deposit.date), 'dd MMM yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {deposit.type === 'deduction' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Deduction
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Refund
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          deposit.type === 'deduction' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {deposit.type === 'deduction' ? '-' : '+'}₹{deposit.amount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{deposit.reason}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          to={`/tenants/${deposit.tenants.id}`} 
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
                <Wallet size={32} className="text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No transactions found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery ? 'Try a different search term' : 'No deposit transactions recorded yet'}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus size={18} className="mr-2" />
                    Add Transaction
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

export default DepositManagementPage;