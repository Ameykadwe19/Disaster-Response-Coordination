const supabase = require('../supabaseClient');
const Logger = require('../utils/logger');

// Get nearby resources within radius (km)
const getNearbyResources = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('id, name, type, location_name, created_at')
      .limit(10);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get disasters within polygon area
const getDisastersInArea = async (req, res) => {
  const { coordinates } = req.body;

  if (!coordinates || !Array.isArray(coordinates)) {
    return res.status(400).json({ error: 'Polygon coordinates required' });
  }

  try {
    const { data, error } = await supabase.rpc('get_disasters_in_polygon', {
      polygon_coords: coordinates
    });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    Logger.error('Error getting disasters in area', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

// Get spatial reference systems
const getSpatialRefSys = async (req, res) => {
  const { srid } = req.params;

  try {
    let query = supabase.from('spatial_ref_sys').select('*');
    
    if (srid) {
      query = query.eq('srid', srid);
    } else {
      query = query.limit(10);
    }

    const { data, error } = query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    Logger.error('Error getting spatial reference systems', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getNearbyResources,
  getDisastersInArea,
  getSpatialRefSys
};