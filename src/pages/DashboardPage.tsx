import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Users, Home, CreditCard, Utensils, TrendingUp, AlertCircle } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    activeTenantsCount: 0,
    inactiveTenantsCount: 0,
    totalRooms: 0,
    currentMonthRent: 0,
    currentMonthMess: 0,
    pendingRentCount: 0,
    pendingMessCount: 0
  });
  const [recentTenants, setRecentTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = format(new Date(), 'yyyy-MM-01');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch active tenants count
        const { count: activeCount } = await supabase
          .from('tenants')
          .select('*', { count: 'exact', head: true })
          .is('leave_date', null);
        
        // Fetch inactive tenants count
        const { count: inactiveCount } = await supabase
          .from('tenants')
          .select('*', { count: 'exact', head: true })
          .not('leave_date', 'is', null);
        
        // Fetch rooms count
        const { count: roomsCount } = await supabase
          .from('rooms')
          .select('*', { count: 'exact', head: true });
        
        // Fetch current month rent payments
        const { data: rentPayments } = await supabase
          .from('rent_payments')
          .select('amount_paid')
          .eq('month', currentMonth);
        
        // Fetch current month mess payments
        const { data: messPayments } = await supabase
          .from('mess_payments')
          .select('mess_charge')
          .eq('month', currentMonth);
        
        // Calculate total rent and mess for current month
        const totalRent = rentPayments?.reduce((sum, payment) => sum + payment.amount_paid, 0) || 0;
        const totalMess = messPayments?.reduce((sum, payment) => sum + payment.mess_charge, 0) || 0;
        
        // Fetch active tenants who haven't paid rent this month
        const { count: pendingRentCount } = await supabase.rpc('get_tenants_without_rent_payment', {
          month_param: currentMonth
        });
        
        // Fetch active tenants who use mess and haven't paid mess this month
        const { count: pendingMessCount } = await supabase.rpc('get_tenants_without_mess_payment', {
          month_param: currentMonth
        });
        
        // Fetch recent tenants
        const { data: recent } = await supabase
          .from('tenants')
          .select(`
            id, name, phone, join_date, leave_date,
            rooms(name)
          `)
          .order('created_at', { ascending: false })
          .limit(5);
        
        setStats({
          activeTenantsCount: activeCount || 0,
          inactiveTenantsCount: inactiveCount || 0,
          totalRooms: roomsCount || 0,
          currentMonthRent: totalRent,
          currentMonthMess: totalMess,
          pendingRentCount: pendingRentCount || 0,
          pendingMessCount: pendingMessCount || 0
        });
        
        setRecentTenants(recent || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [currentMonth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Tenants */}
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Active Tenants</h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.activeTenantsCount}</p>
            </div>
          </div>
        </div>
        
        {/* Rooms */}
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-teal-100 rounded-lg">
              <Home className="w-6 h-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Total Rooms</h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.totalRooms}</p>
            </div>
          </div>
        </div>
        
        {/* Monthly Rent */}
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Current Month Rent</h2>
              <p className="text-2xl font-semibold text-gray-800">₹{stats.currentMonthRent}</p>
            </div>
          </div>
        </div>
        
        {/* Mess Income */}
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Utensils className="w-6 h-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Current Month Mess</h2>
              <p className="text-2xl font-semibold text-gray-800">₹{stats.currentMonthMess}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Alerts and Income */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pending Payments */}
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 lg:col-span-1">
          <h2 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
            <AlertCircle size={20} className="mr-2 text-red-500" />
            Pending Payments
          </h2>
          
          <div className="space-y-4">
            {stats.pendingRentCount > 0 && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard size={18} className="text-red-500 mr-2" />
                    <span className="text-gray-700">Pending Rent</span>
                  </div>
                  <span className="font-semibold text-gray-800">{stats.pendingRentCount} tenants</span>
                </div>
                <div className="mt-2">
                  <Link 
                    to="/rent" 
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View details →
                  </Link>
                </div>
              </div>
            )}
            
            {stats.pendingMessCount > 0 && (
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Utensils size={18} className="text-orange-500 mr-2" />
                    <span className="text-gray-700">Pending Mess</span>
                  </div>
                  <span className="font-semibold text-gray-800">{stats.pendingMessCount} tenants</span>
                </div>
                <div className="mt-2">
                  <Link 
                    to="/mess" 
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View details →
                  </Link>
                </div>
              </div>
            )}
            
            {stats.pendingRentCount === 0 && stats.pendingMessCount === 0 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-green-700">No pending payments for this month! 🎉</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Monthly Income Summary */}
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 lg:col-span-2">
          <h2 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
            <TrendingUp size={20} className="mr-2 text-blue-500" />
            Monthly Income Summary
          </h2>
          
          <div className="space-y-4">
            <div className="flex flex-col">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Rent Income</h3>
                  <p className="mt-1 text-2xl font-semibold text-gray-800">₹{stats.currentMonthRent}</p>
                </div>
                
                <div className="p-4 bg-teal-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Mess Income</h3>
                  <p className="mt-1 text-2xl font-semibold text-gray-800">₹{stats.currentMonthMess}</p>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
                <p className="mt-1 text-2xl font-semibold text-gray-800">
                  ₹{stats.currentMonthRent + stats.currentMonthMess}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Tenants */}
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Tenants</h2>
          <Link 
            to="/tenants" 
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View all
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTenants.length > 0 ? (
                recentTenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                      <div className="text-sm text-gray-500">{tenant.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{tenant.rooms?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(tenant.join_date), 'dd MMM yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tenant.leave_date ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Left
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/tenants/${tenant.id}`} className="text-blue-600 hover:text-blue-900">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No tenants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;