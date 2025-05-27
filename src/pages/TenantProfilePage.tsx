import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  User, Home, CreditCard, Calendar, Utensils, 
  ArrowLeft, Plus, ChevronDown, ChevronUp, PlusCircle, 
  MinusCircle, Check, X 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

const TenantProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<any>(null);
  const [rentPayments, setRentPayments] = useState<any[]>([]);
  const [messPayments, setMessPayments] = useState<any[]>([]);
  const [depositTransactions, setDepositTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showRentForm, setShowRentForm] = useState(false);
  const [showMessForm, setShowMessForm] = useState(false);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [rentFormData, setRentFormData] = useState({
    month: format(new Date(), 'yyyy-MM-01'),
    amount_paid: 0,
    payment_date: format(new Date(), 'yyyy-MM-dd')
  });
  const [messFormData, setMessFormData] = useState({
    month: format(new Date(), 'yyyy-MM-01'),
    mess_charge: 0,
    payment_date: format(new Date(), 'yyyy-MM-dd')
  });
  const [depositFormData, setDepositFormData] = useState({
    amount: 0,
    type: 'deduction',
    reason: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });
  
  const currentDepositBalance = tenant?.deposit_amount - depositTransactions
    .filter(t => t.type === 'deduction')
    .reduce((sum, t) => sum + t.amount, 0) + depositTransactions
    .filter(t => t.type === 'refund')
    .reduce((sum, t) => sum + t.amount, 0);

  useEffect(() => {
    if (id) {
      fetchTenantData();
    }
  }, [id]);

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      
      // Fetch tenant data
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select(`
          id, name, phone, join_date, leave_date, uses_mess, deposit_amount,
          rooms(id, name, rent)
        `)
        .eq('id', id)
        .single();
      
      if (tenantError) throw tenantError;
      
      setTenant(tenantData);
      
      // Fetch rent payments
      const { data: rentData, error: rentError } = await supabase
        .from('rent_payments')
        .select('*')
        .eq('tenant_id', id)
        .order('month', { ascending: false });
      
      if (rentError) throw rentError;
      
      setRentPayments(rentData || []);
      
      // Fetch mess payments
      const { data: messData, error: messError } = await supabase
        .from('mess_payments')
        .select('*')
        .eq('tenant_id', id)
        .order('month', { ascending: false });
      
      if (messError) throw messError;
      
      setMessPayments(messData || []);
      
      // Fetch deposit transactions
      const { data: depositData, error: depositError } = await supabase
        .from('deposit_transactions')
        .select('*')
        .eq('tenant_id', id)
        .order('date', { ascending: false });
      
      if (depositError) throw depositError;
      
      setDepositTransactions(depositData || []);
      
      // Set default amounts for forms based on tenant data
      if (tenantData) {
        setRentFormData(prev => ({ ...prev, amount_paid: tenantData.rooms.rent }));
      }
    } catch (error) {
      console.error('Error fetching tenant data:', error);
      toast.error('Failed to load tenant data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRentPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('rent_payments')
        .insert([{
          tenant_id: id,
          month: rentFormData.month,
          amount_paid: rentFormData.amount_paid,
          payment_date: rentFormData.payment_date
        }]);
      
      if (error) throw error;
      
      toast.success('Rent payment added successfully');
      setShowRentForm(false);
      fetchTenantData();
    } catch (error) {
      console.error('Error adding rent payment:', error);
      toast.error('Failed to add rent payment');
    }
  };

  const handleAddMessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('mess_payments')
        .insert([{
          tenant_id: id,
          month: messFormData.month,
          mess_charge: messFormData.mess_charge,
          payment_date: messFormData.payment_date
        }]);
      
      if (error) throw error;
      
      toast.success('Mess payment added successfully');
      setShowMessForm(false);
      fetchTenantData();
    } catch (error) {
      console.error('Error adding mess payment:', error);
      toast.error('Failed to add mess payment');
    }
  };

  const handleAddDepositTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('deposit_transactions')
        .insert([{
          tenant_id: id,
          date: depositFormData.date,
          amount: depositFormData.amount,
          type: depositFormData.type,
          reason: depositFormData.reason
        }]);
      
      if (error) throw error;
      
      toast.success('Deposit transaction added successfully');
      setShowDepositForm(false);
      fetchTenantData();
    } catch (error) {
      console.error('Error adding deposit transaction:', error);
      toast.error('Failed to add deposit transaction');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-800">Tenant not found</h2>
        <p className="mt-2 text-gray-600">The tenant you're looking for doesn't exist or has been removed.</p>
        <Link to="/tenants" className="mt-6 inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft size={16} className="mr-2" />
          Back to Tenants
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/tenants" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft size={16} className="mr-2" />
          Back to Tenants
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-gray-200 bg-blue-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
                  <User size={28} className="text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-800">{tenant.name}</h1>
                <div className="flex items-center mt-1 text-gray-600">
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-1" />
                    <span className="text-sm">
                      Joined: {format(new Date(tenant.join_date), 'dd MMM yyyy')}
                    </span>
                  </div>
                  {tenant.leave_date && (
                    <div className="flex items-center ml-4">
                      <Calendar size={16} className="mr-1" />
                      <span className="text-sm">
                        Left: {format(new Date(tenant.leave_date), 'dd MMM yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0">
              {tenant.leave_date ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <X size={14} className="mr-1" />
                  Inactive
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <Check size={14} className="mr-1" />
                  Active
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-3">
              <div className="flex items-center">
                <CreditCard size={18} className="text-gray-500 mr-2" />
                <span className="text-gray-700">Phone: {tenant.phone}</span>
              </div>
              
              <div className="flex items-center">
                <Home size={18} className="text-gray-500 mr-2" />
                <span className="text-gray-700">
                  Room: {tenant.rooms?.name} (₹{tenant.rooms?.rent}/month)
                </span>
              </div>
              
              <div className="flex items-center">
                <Utensils size={18} className="text-gray-500 mr-2" />
                <span className="text-gray-700">
                  Mess: {tenant.uses_mess ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Deposit Details</h3>
                  <span className="font-semibold text-lg text-blue-700">
                    ₹{currentDepositBalance}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Initial deposit: ₹{tenant.deposit_amount} | 
                  {depositTransactions.length > 0 ? (
                    <span> {depositTransactions.length} transactions</span>
                  ) : (
                    <span> No transactions yet</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'overview'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('rent')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'rent'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Rent History
        </button>
        {tenant.uses_mess && (
          <button
            onClick={() => setActiveTab('mess')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'mess'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Mess History
          </button>
        )}
        <button
          onClick={() => setActiveTab('deposit')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'deposit'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Deposit History
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <CreditCard size={18} className="mr-2" />
                    Recent Rent Payments
                  </CardTitle>
                  {!tenant.leave_date && (
                    <button
                      onClick={() => setShowRentForm(!showRentForm)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Payment
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {showRentForm && (
                  <form onSubmit={handleAddRentPayment} className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-3">Add Rent Payment</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Month</label>
                        <input
                          type="date"
                          value={rentFormData.month}
                          onChange={(e) => setRentFormData({ ...rentFormData, month: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                        <input
                          type="number"
                          value={rentFormData.amount_paid}
                          onChange={(e) => setRentFormData({ ...rentFormData, amount_paid: parseInt(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                        <input
                          type="date"
                          value={rentFormData.payment_date}
                          onChange={(e) => setRentFormData({ ...rentFormData, payment_date: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowRentForm(false)}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </form>
                )}
                
                {rentPayments.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {rentPayments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="py-3 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {format(new Date(payment.month), 'MMMM yyyy')}
                          </p>
                          <p className="text-xs text-gray-500">
                            Paid on {format(new Date(payment.payment_date), 'dd MMM yyyy')}
                          </p>
                        </div>
                        <span className="font-medium text-gray-900">₹{payment.amount_paid}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No rent payments recorded</p>
                  </div>
                )}
                
                {rentPayments.length > 5 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setActiveTab('rent')}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center mx-auto"
                    >
                      View all payments
                      <ChevronDown size={16} className="ml-1" />
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {tenant.uses_mess && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Utensils size={18} className="mr-2" />
                      Recent Mess Payments
                    </CardTitle>
                    {!tenant.leave_date && (
                      <button
                        onClick={() => setShowMessForm(!showMessForm)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <Plus size={16} className="mr-1" />
                        Add Payment
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {showMessForm && (
                    <form onSubmit={handleAddMessPayment} className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-3">Add Mess Payment</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Month</label>
                          <input
                            type="date"
                            value={messFormData.month}
                            onChange={(e) => setMessFormData({ ...messFormData, month: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                          <input
                            type="number"
                            value={messFormData.mess_charge}
                            onChange={(e) => setMessFormData({ ...messFormData, mess_charge: parseInt(e.target.value) })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                          <input
                            type="date"
                            value={messFormData.payment_date}
                            onChange={(e) => setMessFormData({ ...messFormData, payment_date: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setShowMessForm(false)}
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                  
                  {messPayments.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {messPayments.slice(0, 5).map((payment) => (
                        <div key={payment.id} className="py-3 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {format(new Date(payment.month), 'MMMM yyyy')}
                            </p>
                            <p className="text-xs text-gray-500">
                              Paid on {format(new Date(payment.payment_date), 'dd MMM yyyy')}
                            </p>
                          </div>
                          <span className="font-medium text-gray-900">₹{payment.mess_charge}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No mess payments recorded</p>
                    </div>
                  )}
                  
                  {messPayments.length > 5 && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setActiveTab('mess')}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center mx-auto"
                      >
                        View all payments
                        <ChevronDown size={16} className="ml-1" />
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            <Card className={tenant.uses_mess ? 'md:col-span-2' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <CreditCard size={18} className="mr-2" />
                    Deposit Transactions
                  </CardTitle>
                  {!tenant.leave_date && (
                    <button
                      onClick={() => setShowDepositForm(!showDepositForm)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Transaction
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {showDepositForm && (
                  <form onSubmit={handleAddDepositTransaction} className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-3">Add Deposit Transaction</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                          value={depositFormData.type}
                          onChange={(e) => setDepositFormData({ ...depositFormData, type: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="deduction">Deduction</option>
                          <option value="refund">Refund</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                        <input
                          type="number"
                          value={depositFormData.amount}
                          onChange={(e) => setDepositFormData({ ...depositFormData, amount: parseInt(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Reason</label>
                        <input
                          type="text"
                          value={depositFormData.reason}
                          onChange={(e) => setDepositFormData({ ...depositFormData, reason: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="E.g., Rent adjustment, Damage repair, etc."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                          type="date"
                          value={depositFormData.date}
                          onChange={(e) => setDepositFormData({ ...depositFormData, date: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowDepositForm(false)}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </form>
                )}
                
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Current Balance:</span>
                    <span className="font-semibold text-lg text-blue-700">₹{currentDepositBalance}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Initial deposit: ₹{tenant.deposit_amount}
                  </div>
                </div>
                
                {depositTransactions.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {depositTransactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="py-3 flex justify-between items-center">
                        <div>
                          <div className="flex items-center">
                            {transaction.type === 'deduction' ? (
                              <MinusCircle size={16} className="mr-2 text-red-500" />
                            ) : (
                              <PlusCircle size={16} className="mr-2 text-green-500" />
                            )}
                            <p className="text-sm font-medium text-gray-800">
                              {transaction.reason}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">
                            {format(new Date(transaction.date), 'dd MMM yyyy')}
                          </p>
                        </div>
                        <span className={`font-medium ${
                          transaction.type === 'deduction' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.type === 'deduction' ? '-' : '+'}₹{transaction.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No deposit transactions recorded</p>
                  </div>
                )}
                
                {depositTransactions.length > 5 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setActiveTab('deposit')}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center mx-auto"
                    >
                      View all transactions
                      <ChevronDown size={16} className="ml-1" />
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Rent History Tab */}
        {activeTab === 'rent' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <CreditCard size={18} className="mr-2" />
                  Rent Payment History
                </CardTitle>
                {!tenant.leave_date && (
                  <button
                    onClick={() => setShowRentForm(!showRentForm)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Payment
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showRentForm && (
                <form onSubmit={handleAddRentPayment} className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">Add Rent Payment</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Month</label>
                      <input
                        type="date"
                        value={rentFormData.month}
                        onChange={(e) => setRentFormData({ ...rentFormData, month: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                      <input
                        type="number"
                        value={rentFormData.amount_paid}
                        onChange={(e) => setRentFormData({ ...rentFormData, amount_paid: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                      <input
                        type="date"
                        value={rentFormData.payment_date}
                        onChange={(e) => setRentFormData({ ...rentFormData, payment_date: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowRentForm(false)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              )}
              
              {rentPayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Month
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rentPayments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {format(new Date(payment.month), 'MMMM yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(payment.payment_date), 'dd MMM yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{payment.amount_paid}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No rent payments recorded</p>
                  {!tenant.leave_date && (
                    <button
                      onClick={() => setShowRentForm(true)}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus size={16} className="mr-2" />
                      Add First Payment
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Mess History Tab */}
        {activeTab === 'mess' && tenant.uses_mess && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Utensils size={18} className="mr-2" />
                  Mess Payment History
                </CardTitle>
                {!tenant.leave_date && (
                  <button
                    onClick={() => setShowMessForm(!showMessForm)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Payment
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showMessForm && (
                <form onSubmit={handleAddMessPayment} className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">Add Mess Payment</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Month</label>
                      <input
                        type="date"
                        value={messFormData.month}
                        onChange={(e) => setMessFormData({ ...messFormData, month: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                      <input
                        type="number"
                        value={messFormData.mess_charge}
                        onChange={(e) => setMessFormData({ ...messFormData, mess_charge: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                      <input
                        type="date"
                        value={messFormData.payment_date}
                        onChange={(e) => setMessFormData({ ...messFormData, payment_date: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowMessForm(false)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              )}
              
              {messPayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Month
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {messPayments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {format(new Date(payment.month), 'MMMM yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(payment.payment_date), 'dd MMM yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{payment.mess_charge}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No mess payments recorded</p>
                  {!tenant.leave_date && (
                    <button
                      onClick={() => setShowMessForm(true)}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus size={16} className="mr-2" />
                      Add First Payment
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Deposit History Tab */}
        {activeTab === 'deposit' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <CreditCard size={18} className="mr-2" />
                  Deposit Transaction History
                </CardTitle>
                {!tenant.leave_date && (
                  <button
                    onClick={() => setShowDepositForm(!showDepositForm)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Transaction
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showDepositForm && (
                <form onSubmit={handleAddDepositTransaction} className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">Add Deposit Transaction</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <select
                        value={depositFormData.type}
                        onChange={(e) => setDepositFormData({ ...depositFormData, type: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="deduction">Deduction</option>
                        <option value="refund">Refund</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                      <input
                        type="number"
                        value={depositFormData.amount}
                        onChange={(e) => setDepositFormData({ ...depositFormData, amount: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reason</label>
                      <input
                        type="text"
                        value={depositFormData.reason}
                        onChange={(e) => setDepositFormData({ ...depositFormData, reason: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="E.g., Rent adjustment, Damage repair, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="date"
                        value={depositFormData.date}
                        onChange={(e) => setDepositFormData({ ...depositFormData, date: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowDepositForm(false)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              )}
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Current Balance:</span>
                  <span className="font-semibold text-lg text-blue-700">₹{currentDepositBalance}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Initial deposit: ₹{tenant.deposit_amount}
                </div>
              </div>
              
              {depositTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {depositTransactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(transaction.date), 'dd MMM yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {transaction.type === 'deduction' ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Deduction
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Refund
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.reason}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <span className={transaction.type === 'deduction' ? 'text-red-600' : 'text-green-600'}>
                              {transaction.type === 'deduction' ? '-' : '+'}₹{transaction.amount}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No deposit transactions recorded</p>
                  {!tenant.leave_date && (
                    <button
                      onClick={() => setShowDepositForm(true)}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus size={16} className="mr-2" />
                      Add First Transaction
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TenantProfilePage;