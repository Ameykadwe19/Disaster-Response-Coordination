const supabase = require('../supabaseClient');
const Logger = require('../utils/logger');

// Get resources near disaster location with distance calculation
const getNearbyResources = async (req, res) => {
  const { id } = req.params;
  const { lat, lon } = req.query;
  
  try {
    if (lat && lon) {
      // Use PostGIS spatial query to find nearby resources
      const { data, error } = await supabase.rpc('get_nearby_resources', {
        user_lat: parseFloat(lat),
        user_lng: parseFloat(lon),
        radius_km: 10
      });
      
      if (error) throw error;
      
      // Format response with distance in km
      const formattedData = data.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        location_name: item.location_name,
        created_at: item.created_at,
        distance: item.distance_km ? item.distance_km.toFixed(2) : 'N/A'
      }));
      
      res.json(formattedData);
    } else {
      // Fallback to disaster-specific resources
      const { data, error } = await supabase
        .from('resources')
        .select('id, name, type, location_name, created_at')
        .or(`disaster_id.eq.${id},disaster_id.is.null`)
        .limit(10);

      if (error) throw error;
      
      const formattedData = data.map(item => ({
        ...item,
        distance: 'N/A'
      }));
      
      res.json(formattedData);
    }
  } catch (error) {
    Logger.error('Error getting resources', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getNearbyResources };