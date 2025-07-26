import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Building, Home } from 'lucide-react';

interface Block {
  id: string;
  name: string;
  totalFlats: number;
  createdAt: Date;
}

interface Flat {
  id: string;
  blockId: string;
  flatNumber: string;
  tenantId?: string;
  tenantName?: string;
  isOccupied: boolean;
  createdAt: Date;
}

export default function BlocksFlats() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('blocks');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'block' | 'flat'>('block');
  const [editingItem, setEditingItem] = useState<Block | Flat | null>(null);
  
  const [blockForm, setBlockForm] = useState({
    name: '',
    totalFlats: '',
  });

  const [flatForm, setFlatForm] = useState({
    blockId: '',
    flatNumber: '',
  });

  // FIXED: Wrapped fetchData in useCallback to fix dependency issue
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual Firebase calls
      const mockBlocks: Block[] = [
        { id: '1', name: 'Block A', totalFlats: 20, createdAt: new Date() },
        { id: '2', name: 'Block B', totalFlats: 15, createdAt: new Date() },
        { id: '3', name: 'Block C', totalFlats: 25, createdAt: new Date() },
      ];

      const mockFlats: Flat[] = [
        { id: '1', blockId: '1', flatNumber: 'A-101', isOccupied: true, tenantName: 'John Doe', createdAt: new Date() },
        { id: '2', blockId: '1', flatNumber: 'A-102', isOccupied: false, createdAt: new Date() },
        { id: '3', blockId: '1', flatNumber: 'A-103', isOccupied: true, tenantName: 'Jane Smith', createdAt: new Date() },
        { id: '4', blockId: '2', flatNumber: 'B-101', isOccupied: true, tenantName: 'Bob Johnson', createdAt: new Date() },
        { id: '5', blockId: '2', flatNumber: 'B-102', isOccupied: false, createdAt: new Date() },
      ];

      setBlocks(mockBlocks);
      setFlats(mockFlats);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since fetchData doesn't depend on any props or state

  // FIXED: Added fetchData to dependencies
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddBlock = () => {
    setModalType('block');
    setEditingItem(null);
    setBlockForm({ name: '', totalFlats: '' });
    setShowModal(true);
  };

  const handleAddFlat = () => {
    setModalType('flat');
    setEditingItem(null);
    setFlatForm({ blockId: '', flatNumber: '' });
    setShowModal(true);
  };

  const handleEditBlock = (block: Block) => {
    setModalType('block');
    setEditingItem(block);
    setBlockForm({ name: block.name, totalFlats: block.totalFlats.toString() });
    setShowModal(true);
  };

  const handleEditFlat = (flat: Flat) => {
    setModalType('flat');
    setEditingItem(flat);
    setFlatForm({ blockId: flat.blockId, flatNumber: flat.flatNumber });
    setShowModal(true);
  };

  const handleSubmitBlock = (e: React.FormEvent) => {
    e.preventDefault();
    // Add/update block logic
    console.log('Block form:', blockForm);
    setShowModal(false);
    // Refresh data
  };

  const handleSubmitFlat = (e: React.FormEvent) => {
    e.preventDefault();
    // Add/update flat logic
    console.log('Flat form:', flatForm);
    setShowModal(false);
    // Refresh data
  };

  const handleDeleteBlock = (blockId: string) => {
    if (confirm('Are you sure you want to delete this block?')) {
      // Delete block logic
      console.log('Delete block:', blockId);
    }
  };

  const handleDeleteFlat = (flatId: string) => {
    if (confirm('Are you sure you want to delete this flat?')) {
      // Delete flat logic
      console.log('Delete flat:', flatId);
    }
  };

  if (loading) {
    return (
      <div className="p-6 ml-64">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 ml-64">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Blocks & Flats Management</h1>
        <p className="text-gray-600">Manage your community's blocks and flat assignments</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('blocks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'blocks'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building className="h-4 w-4 mr-2" />
            Blocks
          </button>
          <button
            onClick={() => setActiveTab('flats')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'flats'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Home className="h-4 w-4 mr-2" />
            Flats
          </button>
        </nav>
      </div>

      {/* Blocks Tab */}
      {activeTab === 'blocks' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Blocks</h2>
            <button
              onClick={handleAddBlock}
              className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondary/90 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Block
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blocks.map((block) => {
              const blockFlats = flats.filter(flat => flat.blockId === block.id);
              const occupiedFlats = blockFlats.filter(flat => flat.isOccupied).length;
              const occupancyRate = blockFlats.length > 0 ? (occupiedFlats / blockFlats.length) * 100 : 0;

              return (
                <div key={block.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Building className="h-8 w-8 text-primary mr-3" />
                      <h3 className="text-lg font-semibold text-gray-900">{block.name}</h3>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditBlock(block)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Flats</span>
                      <span className="text-sm font-medium text-gray-900">{blockFlats.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Occupied</span>
                      <span className="text-sm font-medium text-gray-900">{occupiedFlats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Vacant</span>
                      <span className="text-sm font-medium text-gray-900">{blockFlats.length - occupiedFlats}</span>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Occupancy Rate</span>
                        <span className="text-sm font-medium text-gray-900">{occupancyRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-secondary h-2 rounded-full" 
                          style={{ width: `${occupancyRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Flats Tab */}
      {activeTab === 'flats' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Flats</h2>
            <button
              onClick={handleAddFlat}
              className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondary/90 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Flat
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Flat Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Block
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {flats.map((flat) => {
                    const block = blocks.find(b => b.id === flat.blockId);
                    return (
                      <tr key={flat.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Home className="h-5 w-5 text-gray-400 mr-3" />
                            <div className="text-sm font-medium text-gray-900">{flat.flatNumber}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{block?.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {flat.tenantName || 'Vacant'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            flat.isOccupied 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {flat.isOccupied ? 'Occupied' : 'Vacant'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEditFlat(flat)}
                            className="text-secondary hover:text-secondary/80"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFlat(flat.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingItem ? 'Edit' : 'Add'} {modalType === 'block' ? 'Block' : 'Flat'}
            </h2>

            {modalType === 'block' ? (
              <form onSubmit={handleSubmitBlock} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Block Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={blockForm.name}
                    onChange={(e) => setBlockForm({ ...blockForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent"
                    placeholder="e.g., Block A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Flats
                  </label>
                  <input
                    type="number"
                    value={blockForm.totalFlats}
                    onChange={(e) => setBlockForm({ ...blockForm, totalFlats: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent"
                    placeholder="20"
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondary/90"
                  >
                    {editingItem ? 'Update' : 'Add'} Block
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmitFlat} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Block *
                  </label>
                  <select
                    required
                    value={flatForm.blockId}
                    onChange={(e) => setFlatForm({ ...flatForm, blockId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent"
                  >
                    <option value="">Select Block</option>
                    {blocks.map((block) => (
                      <option key={block.id} value={block.id}>
                        {block.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flat Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={flatForm.flatNumber}
                    onChange={(e) => setFlatForm({ ...flatForm, flatNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-secondary focus:border-transparent"
                    placeholder="e.g., A-101"
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondary/90"
                  >
                    {editingItem ? 'Update' : 'Add'} Flat
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
