import React, { useState, useEffect } from 'react';

import { AlertTriangle, MapPin, Users, FileText, Camera, Globe, Plus, Search, Filter, Edit, Trash2, X } from 'lucide-react';



const API_BASE = 'https://disaster-response-coordination-jd4y.onrender.com/api';


const DisasterResponseApp = () => {
  const [disasters, setDisasters] = useState([]);
  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const [reports, setReports] = useState([]);
  const [socialPosts, setSocialPosts] = useState([]);
  const [resources, setResources] = useState([]);
  const [officialUpdates, setOfficialUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('reports');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingReports, setLoadingReports] = useState(false);

  // Form states
  const [newDisaster, setNewDisaster] = useState({
    title: '',
    description: '',
    location_name: '',
    tags: ''
  });

  const [editDisaster, setEditDisaster] = useState({
    id: '',
    title: '',
    description: '',
    location_name: '',
    tags: ''
  });

  const [newReport, setNewReport] = useState({
    disaster_id: '',
    user_id: 'user123',
    content: '',
    image_url: ''
  });

  const [geocodeData, setGeocodeData] = useState({
    description: '',
    result: null
  });

  const [imageVerification, setImageVerification] = useState({
    base64Image: '',
    result: null
  });

  // Load disasters when component starts
  useEffect(() => {
    fetchDisasters();
  }, []);

  // Get all disasters from API
  const fetchDisasters = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/disasters`);
      const data = await response.json();
      setDisasters(data);
    } catch (error) {
      console.error('Error fetching disasters:', error);
    } finally {
      setLoading(false);
    }
  };

// Convert location name to coordinates using geocoding API
const geocodeLocationName = async (locationName) => {
  try {
    const response = await fetch(`${API_BASE}/disasters/geocode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: locationName })
    });
    if (!response.ok) throw new Error('Failed to geocode location');
    const data = await response.json();
    return data; // data should contain { lat, lng, location_name }
  } catch (error) {
    console.error('Geocode error:', error);
    return null;
  }
};

// Create new disaster with geocoding
const createDisaster = async () => {
  try {
    // Validate required fields
    if (!newDisaster.title || !newDisaster.location_name) {
      console.error('Missing required fields: title or location_name');
      alert('Please enter both Disaster Title and Location Name');
      return;
    }

    // Get lat/lng from location_name
    const geo = await geocodeLocationName(newDisaster.location_name);
    if (!geo || !geo.lat || !geo.lng) {
      alert('Could not find coordinates for the given location');
      return;
    }

    // Process tags safely
    const processedTags = newDisaster.tags
      ? newDisaster.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    const payload = {
      title: newDisaster.title,
      description: newDisaster.description || '',
      location_name: newDisaster.location_name,
      tags: processedTags,
      owner_id: 'netrunnerX',
      latitude: geo.lat,
      longitude: geo.lng,
    };

    console.log('Sending payload:', payload);

    const response = await fetch(`${API_BASE}/disasters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'netrunnerX'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server error:', errorData);
      throw new Error(errorData.error || 'Error creating disaster');
    }

    const data = await response.json();
    console.log('Disaster created successfully:', data);

    // Reset form
    setNewDisaster({
      title: '',
      description: '',
      location_name: '',
      tags: '',
      latitude: '',
      longitude: ''
    });

    // Refresh disaster list
    fetchDisasters();

    // Close modal if needed
    setShowModal(false);

  } catch (error) {
    console.error('Error creating disaster:', error.message);
    alert('Failed to create disaster: ' + error.message);
  }
};



const updateDisaster = async () => {
  try {
    const response = await fetch(`http://localhost:5000/api/disasters/${editDisaster.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'netrunnerX'// Not needed if using mockAuth middleware
      },
      body: JSON.stringify({
        ...editDisaster,
        tags: editDisaster.tags.split(',').map(tag => tag.trim())
      })
    });

    if (!response.ok) throw new Error('Error updating disaster');

    const updated = await response.json();
    setDisasters(prev => prev.map(d => (d.id === updated.id ? updated : d)));
    setSelectedDisaster(updated);
    setEditDisaster({ id: '', title: '', description: '', location_name: '', tags: '' });
    setShowModal(false);
  } catch (error) {
    console.error('Error updating disaster:', error);
    console.log('Update called:', req.body);
  }
};


 const deleteDisaster = async (disasterId) => {
  // Find the disaster to check owner
  const disaster = disasters.find(d => d.id === disasterId);
  
  // Check if it's an admin disaster
  if (disaster?.owner_id === 'reliefAdmin') {
    alert('⚠️ Admin disasters can only be deleted by admin users. Please contact an administrator.');
    return;
  }

  if (!window.confirm('Are you sure you want to delete this disaster?')) return;

  try {
    console.log('Deleting disaster with ID:', disasterId);
    console.log('API_BASE:', API_BASE);
    console.log('Full URL:', `${API_BASE}/disasters/${disasterId}`);
    
    const response = await fetch(`${API_BASE}/disasters/${disasterId}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': 'netrunnerX'
      }
    });

    console.log('Delete response:', response);
    console.log('Delete response status:', response.status);
    console.log('Delete response ok:', response.ok);
    
    if (response.ok) {
      // Update UI immediately
      setDisasters(prev => prev.filter(d => d.id !== disasterId));
      if (selectedDisaster?.id === disasterId) {
        setSelectedDisaster(null);
      }
      console.log('Disaster deleted successfully');
    } else {
      const errorText = await response.text();
      console.error('Delete failed - Status:', response.status, 'Error:', errorText);
      alert(`Delete failed: ${response.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.error('Network/other error:', error);
    alert(`Error: ${error.message}`);
  }
};


  const fetchReports = async (disasterId) => {
    try {
      setLoadingReports(true);
      const response = await fetch(`${API_BASE}/reports/${disasterId}`);
      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  const createReport = async () => {
    try {
      const response = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport)
      });
      const data = await response.json();
      setReports(prev => [data.report, ...prev]);
      setNewReport({ disaster_id: '', user_id: 'user123', content: '', image_url: '' });
      setShowModal(false);
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  const fetchSocialPosts = async (disasterId) => {
    try {
      const response = await fetch(`${API_BASE}/disasters/${disasterId}/social-media`);
      const data = await response.json();
      setSocialPosts(data);
    } catch (error) {
      console.error('Error fetching social posts:', error);
    }
  };

  // Get nearby resources for selected disaster
  const fetchResources = async (disasterId, lat, lon) => {
    try {
      console.log('Fetching resources for:', { disasterId, lat, lon });
      const response = await fetch(`${API_BASE}/disasters/${disasterId}/resources?lat=${lat}&lon=${lon}`);
      const data = await response.json();
      console.log("Fetched Resources:", data);
      setResources(data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const fetchOfficialUpdates = async (disasterId) => {
    try {
      const response = await fetch(`${API_BASE}/disasters/${disasterId}/official-updates`);
      const data = await response.json();
      setOfficialUpdates(data.updates || []);
    } catch (error) {
      console.error('Error fetching official updates:', error);
    }
  };

  const geocodeDescription = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/disasters/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: geocodeData.description })
      });
      const data = await response.json();
      setGeocodeData(prev => ({ ...prev, result: data }));
    } catch (error) {
      console.error('Error geocoding:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyImage = async (disasterId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/disasters/${disasterId}/verify-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'netrunnerX'
        },
        body: JSON.stringify({ base64Image: imageVerification.base64Image })
      });
      const data = await response.json();
      setImageVerification(prev => ({ ...prev, result: data }));
    } catch (error) {
      console.error('Error verifying image:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
        const allowedTypes = ['image/png', 'image/jpeg'];
  if (!allowedTypes.includes(file.type)) {
    alert('❌ Unsupported file type. Only PNG and JPEG images are allowed.');
    return;
  }


      const reader = new FileReader();
      reader.onload = (event) => {
        setImageVerification(prev => ({ ...prev, base64Image: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const selectDisaster = async (disaster) => {
    setSelectedDisaster(disaster);
    fetchReports(disaster.id);
    fetchSocialPosts(disaster.id);
    fetchOfficialUpdates(disaster.id);
    
    // Get coordinates from disaster location
    if (disaster.latitude && disaster.longitude) {
      fetchResources(disaster.id, disaster.latitude, disaster.longitude);
    } else {
      // Fetch coordinates from Supabase geography column
      try {
        const response = await fetch(`${API_BASE}/disasters/${disaster.id}/coordinates`);
        const coords = await response.json();
        if (coords.lat && coords.lng) {
          fetchResources(disaster.id, coords.lat, coords.lng);
        } else {
          console.log('No coordinates available for disaster:', disaster.title);
          setResources([]);
        }
      } catch (error) {
        console.error('Error fetching coordinates:', error);
        setResources([]);
      }
    }
  };

  const openModal = (type, disaster = null) => {
    setModalType(type);
    setShowModal(true);
    if (type === 'report' && selectedDisaster) {
      setNewReport(prev => ({ ...prev, disaster_id: selectedDisaster.id }));
    }
    if (type === 'edit' && disaster) {
      setEditDisaster({
        id: disaster.id,
        title: disaster.title,
        description: disaster.description,
        location_name: disaster.location_name,
        tags: disaster.tags ? disaster.tags.join(', ') : ''
      });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setEditDisaster({ id: '', title: '', description: '', location_name: '', tags: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-red-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Disaster Response System</h1>
          </div>
          <button
            onClick={() => openModal('disaster')}
            className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Disaster</span>
          </button>
        </div>
      </header>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Disasters List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold">Active Disasters</h2>
                  <button
                    onClick={fetchDisasters}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded"
                    title="Refresh disasters"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search disasters..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search className="h-4 w-4 text-gray-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading disasters...</p>
                </div>
              ) : disasters.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No disasters found</p>
                  <button 
                    onClick={() => openModal('disaster')}
                    className="mt-2 text-red-600 hover:text-red-800 text-sm"
                  >
                    Create your first disaster report
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {disasters
                    .filter(disaster => 
                      disaster.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      disaster.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      disaster.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map((disaster) => (
                    <div
                      key={disaster.id}
                      className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
                        selectedDisaster?.id === disaster.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => selectDisaster(disaster)}
                    >
                      <div className="mb-3">
                        <h3 className="font-semibold text-gray-900 mb-1">{disaster.title}</h3>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{disaster.location_name}</span>
                        </div>
                        {disaster.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {disaster.description.length > 80 
                              ? `${disaster.description.substring(0, 80)}...` 
                              : disaster.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {disaster.tags?.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {disaster.tags?.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{disaster.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                          {disaster.created_at ? new Date(disaster.created_at).toLocaleDateString() : 'Recently added'}
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal('edit', disaster);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                            title="Edit disaster"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDisaster(disaster.id);
                            }}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete disaster"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Geocoding Tool */}
            <div className="bg-white rounded-lg shadow-md p-4 mt-6">
              <h3 className="text-lg font-semibold mb-3">Location Extractor</h3>
              <textarea
                value={geocodeData.description}
                onChange={(e) => setGeocodeData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter disaster description to extract location..."
                className="w-full p-3 border rounded-lg resize-none"
                rows="3"
              />
              <button
                onClick={geocodeDescription}
                disabled={!geocodeData.description || loading}
                className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Extract Location
              </button>
              {geocodeData.result && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p><strong>Location:</strong> {geocodeData.result.location_name}</p>
                  <p><strong>Coordinates:</strong> {geocodeData.result.lat}, {geocodeData.result.lng}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Details */}
          <div className="lg:col-span-2">
            {selectedDisaster ? (
              <div className="space-y-6">
                {/* Disaster Details */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedDisaster.title}</h2>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal('edit', selectedDisaster)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => openModal('report')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Report</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-3">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedDisaster.location_name}</span>
                  </div>
                  <p className="text-gray-700 mb-4">{selectedDisaster.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDisaster.tags?.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-md">
                  <div className="border-b border-gray-200">
                    <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8 px-4 sm:px-6">
                      {[
                        { key: 'reports', label: 'Reports', icon: FileText },
                        { key: 'social', label: 'Social Media', icon: Users },
                        { key: 'resources', label: 'Resources', icon: MapPin },
                        { key: 'updates', label: 'Official Updates', icon: Globe },
                        { key: 'verify', label: 'Image Verification', icon: Camera }
                      ].map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setActiveTab(key)}
                          className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                            activeTab === key
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="p-6">
                    {/* Reports Tab */}
                    {activeTab === 'reports' && (
                      <div className="space-y-4">
                        {loadingReports ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-gray-600">Loading reports...</p>
                          </div>
                        ) : reports.length === 0 ? (
                          <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 mb-2">No reports available</p>
                            <button
                              onClick={() => openModal('report')}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              Add the first report
                            </button>
                          </div>
                        ) : (
                          reports.map((report) => (
                            <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                              <p className="text-gray-900 mb-3">{report.content}</p>
                              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  report.verification_status === 'verified' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {report.verification_status || 'pending'}
                                </span>
                                <span>{new Date(report.created_at).toLocaleDateString()}</span>
                              </div>
                              {report.image_url && (
                                <img 
                                  src={report.image_url} 
                                  alt="Report" 
                                  className="mt-3 max-w-xs rounded-lg shadow-sm" 
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Social Media Tab */}
                    {activeTab === 'social' && (
                      <div className="space-y-4">
                        {socialPosts.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No social media posts found</p>
                        ) : (
                          socialPosts.map((post, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <p className="text-gray-900 mb-2">{post.post}</p>
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>@{post.user}</span>
                                <span>{post.location}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {post.tags.map((tag, tagIndex) => (
                                  <span
                                    key={tagIndex}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Resources Tab */}
                    {activeTab === 'resources' && (
                      <div className="space-y-4">
                        {resources.length === 0 ? (
                          <div className="text-center py-8">
                            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 mb-1">No resources found within 10km</p>
                            <p className="text-xs text-gray-400">Resources are searched using geospatial ST_DWithin query</p>
                          </div>
                        ) : (
                          <>
                            <div className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded-lg">
                              <MapPin className="h-4 w-4 inline mr-1" />
                              Found {resources.length} resources within 10km radius (ST_DWithin query)
                            </div>
                            {resources.map((resource, index) => (
                              <div key={resource.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-semibold text-gray-900">{resource.name}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    resource.type === 'shelter' ? 'bg-blue-100 text-blue-800' :
                                    resource.type === 'medical' ? 'bg-red-100 text-red-800' :
                                    resource.type === 'food' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {resource.type}
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600 mb-1">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  <span>{resource.location_name}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500">
                                    📍 Distance: {resource.distance || 'N/A'} km
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {resource.created_at && new Date(resource.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}

                    {/* Official Updates Tab */}
                    {activeTab === 'updates' && (
                      <div className="space-y-4">
                        {officialUpdates.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No official updates available</p>
                        ) : (
                          officialUpdates.map((update, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-2">{update.title}</h4>
                              <a
                                href={update.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Read More →
                              </a>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                  {activeTab === 'verify' && (
  <div className="space-y-4">
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">

      {/* Upload Input Styled */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept="image/*"
            id="upload"
            onChange={handleImageUpload}
            className="hidden"
          />
          <label
            htmlFor="upload"
            className="cursor-pointer bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Choose File
          </label>
          <span className="text-sm text-gray-600">
            {imageVerification.base64Image ? 'File selected' : 'No file chosen'}
          </span>
        </div>
      </div>

      {/* Image Preview */}
      {imageVerification.base64Image && (
        <div className="mb-4">
          <img
            src={imageVerification.base64Image}
            alt="Preview"
            className="max-w-full max-h-64 rounded-lg shadow"
          />
        </div>
      )}

      {/* Verify Button */}
      <button
        onClick={() => verifyImage(selectedDisaster.id)}
        disabled={!imageVerification.base64Image || loading}
        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? 'Verifying...' : 'Verify Image'}

      </button>
    </div>

    {/* Verification Result */}
    {imageVerification.result && (
      
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-medium mb-2">Verification Result:</h4>
        <p className="text-gray-700">{imageVerification.result.verification}</p>
        <p className="text-sm text-gray-600 mt-2">
          Disaster-related: {imageVerification.result.isDisaster ? 'Yes' : 'No'}
        </p>
      </div>
    )}
  </div>
)}

                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Select a Disaster</h3>
                <p className="text-gray-600">Choose a disaster from the list to view details and manage reports.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            {modalType === 'disaster' && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Create New Disaster</h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Disaster Title *</label>
                    <input
                      type="text"
                      placeholder="Enter disaster title"
                      value={newDisaster.title}
                      onChange={(e) => setNewDisaster(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      placeholder="Describe the disaster situation"
                      value={newDisaster.description}
                      onChange={(e) => setNewDisaster(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Mumbai, Maharashtra"
                      value={newDisaster.location_name}
                      onChange={(e) => setNewDisaster(prev => ({ ...prev, location_name: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <input
                      type="text"
                      placeholder="flood, emergency, rescue (comma separated)"
                      value={newDisaster.tags}
                      onChange={(e) => setNewDisaster(prev => ({ ...prev, tags: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas</p>
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={createDisaster}
                    disabled={loading || !newDisaster.title?.trim() || !newDisaster.location_name?.trim()}
                    className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {loading ? 'Creating...' : 'Create Disaster'}
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {modalType === 'edit' && (
              <>
                <h3 className="text-lg font-semibold mb-4">Edit Disaster</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Disaster Title"
                    value={editDisaster.title}
                    onChange={(e) => setEditDisaster(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                  />
                  <textarea
                    placeholder="Description"
                    value={editDisaster.description}
                    onChange={(e) => setEditDisaster(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 border rounded-lg resize-none"
                    rows="3"
                  />
                  <input
                    type="text"
                    placeholder="Location Name"
                    value={editDisaster.location_name}
                    onChange={(e) => setEditDisaster(prev => ({ ...prev, location_name: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Tags (comma separated)"
                    value={editDisaster.tags}
                    onChange={(e) => setEditDisaster(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={updateDisaster}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    Update Disaster
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {modalType === 'report' && (
              <>
                <h3 className="text-lg font-semibold mb-4">Add New Report</h3>
                <div className="space-y-4">
                  <textarea
                    placeholder="Report content"
                    value={newReport.content}
                    onChange={(e) => setNewReport(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full p-3 border rounded-lg resize-none"
                    rows="4"
                  />
                  <input
                    type="url"
                    placeholder="Image URL (optional)"
                    value={newReport.image_url}
                    onChange={(e) => setNewReport(prev => ({ ...prev, image_url: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={createReport}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                  >
                    Add Report
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DisasterResponseApp; 