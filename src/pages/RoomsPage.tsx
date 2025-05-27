import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Home, Plus, Edit, Trash2, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

const RoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rent: 0
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('rooms')
        .insert([{
          name: formData.name,
          rent: formData.rent
        }]);
      
      if (error) throw error;
      
      toast.success('Room added successfully');
      setFormData({
        name: '',
        rent: 0
      });
      setShowAddForm(false);
      fetchRooms();
    } catch (error: any) {
      console.error('Error adding room:', error);
      if (error.code === '23505') {
        toast.error('A room with this name already exists');
      } else {
        toast.error('Failed to add room');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Rooms</h1>
        
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus size={18} className="mr-2" />
            Add Room
          </button>
        </div>
      </div>
      
      {/* Add Room Form */}
      {showAddForm && (
        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle>Add New Room</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddRoom} className="space-y-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Room Name/Number
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="e.g., Room 101"
                  />
                </div>
                
                <div>
                  <label htmlFor="rent" className="block text-sm font-medium text-gray-700">
                    Monthly Rent (₹)
                  </label>
                  <input
                    type="number"
                    id="rent"
                    required
                    min="0"
                    value={formData.rent}
                    onChange={(e) => setFormData({ ...formData, rent: parseInt(e.target.value) })}
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
                  Add Room
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      {/* Rooms List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.length > 0 ? (
            rooms.map((room) => (
              <Card key={room.id} className="transition-all duration-200 hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Home className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-800">{room.name}</h3>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center text-sm">
                      <CreditCard size={16} className="mr-2 text-gray-500" />
                      <span className="text-gray-700">Monthly Rent: ₹{room.rent}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 text-center">
              <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                <Home size={32} className="text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No rooms found</h3>
              <p className="mt-2 text-sm text-gray-500">Add a new room to get started</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus size={18} className="mr-2" />
                  Add Room
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoomsPage;