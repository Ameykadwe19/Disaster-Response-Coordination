const supabase = require('../supabaseClient');
const { geocodeLocation } = require('../services/nominatimService');
const CacheManager = require('../utils/cache');
const Logger = require('../utils/logger');

// Set mock user for development/testing
const setMockUser = (req) => {
  if (!req.user) {
    req.user = {
      id: 'mock-user-123',
      role: 'admin'
    };
  }
};
// Get all disasters from database
const getAllDisasters = async (req, res) => {
  const { data, error } = await supabase
    .from('disasters')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching from disasters table:', error);
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json(data);
};

// Create new disaster with location geocoding
const createDisaster = async (req, res) => {
  try {
    setMockUser(req);
    const { title, description, location_name, tags } = req.body;

    if (!title || !location_name) {
      return res.status(400).json({ error: 'Title and location_name are required' });
    }

    // Check cache for geocoding
    const cacheKey = `geocode_${location_name}`;
    let coords = await CacheManager.get(cacheKey);
    
    if (!coords) {
      coords = await geocodeLocation(location_name);
      if (coords) {
        await CacheManager.set(cacheKey, coords, 24); // Cache for 24 hours
      }
    }

    if (!coords) {
      return res.status(400).json({ error: 'Invalid location_name: could not geocode' });
    }

    const auditTrail = {
      action: 'create',
      user_id: req.user.id,
      timestamp: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('disasters')
      .insert([
        {
          title,
          description,
          location_name,
          tags,
          owner_id: req.user.id,
          audit_trail: [auditTrail],
          location: `POINT(${coords.lng} ${coords.lat})`
        }
      ])
      .select();

    if (error) {
      Logger.error('Error creating disaster', { error: error.message, user_id: req.user.id });
      return res.status(500).json({ error: error.message });
    }

    Logger.info('Disaster created successfully', { 
      disaster_id: data[0].id, 
      title, 
      location_name,
      user_id: req.user.id 
    });

    const io = req.app.get('io');
    if (io && data) io.emit('disaster_updated', data[0]);

    res.status(201).json(data ? data[0] : {});
  } catch (error) {
    Logger.error('Unexpected error creating disaster', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

// Update existing disaster with audit trail
const updateDisaster = async (req, res) => {
  const { id } = req.params;
  const { title, description, tags } = req.body;

  setMockUser(req);

  const existing = await supabase
    .from('disasters')
    .select('owner_id, audit_trail')
    .eq('id', id)
    .single();

  if (existing.error || !existing.data) {
    return res.status(404).json({ error: 'Disaster not found' });
  }

  const isMockMode = process.env.NODE_ENV === 'development' || req.user.role === 'admin';
  
  if (!isMockMode && req.user.id !== existing.data.owner_id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: not owner or admin' });
  }

  // Add to audit trail
  const currentAudit = existing.data.audit_trail || [];
  const newAuditEntry = {
    action: 'update',
    user_id: req.user.id,
    timestamp: new Date().toISOString(),
    changes: { title, description, tags }
  };

  const { data, error } = await supabase
    .from('disasters')
    .update({
      title,
      description,
      tags,
      audit_trail: [...currentAudit, newAuditEntry]
    })
    .eq('id', id)
    .select();

  if (error) {
    Logger.error('Error updating disaster', { error: error.message, disaster_id: id });
    return res.status(500).json({ error: error.message });
  }

  Logger.info('Disaster updated successfully', { 
    disaster_id: id, 
    user_id: req.user.id,
    changes: { title, description, tags }
  });

  const io = req.app.get('io');
  if (io) {
    io.emit('disaster_updated', data[0]);
  }

  res.status(200).json(data[0]);
};


// Delete disaster and related data
const deleteDisaster = async (req, res) => {
  const { id } = req.params;

  // Set mock user for development
  setMockUser(req);

  // Fetch disaster to get owner_id
  const existing = await supabase
    .from('disasters')
    .select('owner_id')
    .eq('id', id)
    .single();

  if (existing.error || !existing.data) {
    return res.status(404).json({ error: 'Disaster not found' });
  }

  // Admin disasters can only be deleted by admin users
  if (existing.data.owner_id === 'reliefAdmin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin disasters cannot be deleted by non-admin users' });
  }

  // Regular auth check
  if (req.user.id !== existing.data.owner_id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: not owner or admin' });
  }

  try {
    // Delete related resources first
    await supabase
      .from('resources')
      .delete()
      .eq('disaster_id', id);

    // Delete related reports
    await supabase
      .from('reports')
      .delete()
      .eq('disaster_id', id);

    // Now delete the disaster
    const { error } = await supabase
      .from('disasters')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('disaster_updated', { deleted: true, id });  
    }

    res.status(200).json({ message: 'Disaster deleted successfully' });
  } catch (error) {
    console.error('Error deleting disaster:', error);
    return res.status(500).json({ error: error.message });
  }
};



// Get disaster coordinates from geography column
const getDisasterCoordinates = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('disasters')
      .select('location_name')
      .eq('id', id)
      .single();
      
    if (error || !data) {
      Logger.error('Disaster not found for coordinates', { disaster_id: id });
      return res.status(404).json({ error: 'Disaster not found' });
    }
    
    // Get coordinates using RPC function
    const { data: coordData, error: coordError } = await supabase.rpc('get_disaster_coordinates', {
      disaster_id: id
    });

    if (coordError || !coordData || coordData.length === 0) {
      // Fallback to default coordinates
      const coords = { lat: 19.0760, lng: 72.8777 };
      return res.status(200).json(coords);
    }

    const coords = {
      lat: coordData[0].lat,
      lng: coordData[0].lng
    };

    Logger.info('Coordinates extracted successfully', { 
      disaster_id: id, 
      location_name: data.location_name,
      coordinates: coords 
    });

    res.status(200).json(coords);
  } catch (error) {
    Logger.error('Unexpected error getting coordinates', { error: error.message, disaster_id: id });
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllDisasters,
  createDisaster,
  updateDisaster,
  deleteDisaster,
  getDisasterCoordinates
};