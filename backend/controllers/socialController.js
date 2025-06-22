const supabase = require('../supabaseClient');
const CacheManager = require('../utils/cache');
const Logger = require('../utils/logger');

// Mock posts (example data)
const mockPosts = [
  {
    post: "#floodrelief Need food in Andheri East",
    user: "citizen1",
    tags: ["flood", "urgent"],
    location: "Mumbai",
    timestamp: new Date().toISOString()
  },
  {
    post: "Water entering homes near Powai Lake #mumbaiflood",
    user: "mumbai_user",
    tags: ["flood"],
    location: "Mumbai",
    timestamp: new Date().toISOString()
  },
  {
    post: "Earthquake shocks felt in Delhi NCR",
    user: "quakewatch",
    tags: ["earthquake"],
    location: "Delhi",
    timestamp: new Date().toISOString()
  },
  {
    post: "Volunteers needed in Thane for flood cleanup",
    user: "local_hero",
    tags: ["flood"],
    location: "Thane",
    timestamp: new Date().toISOString()
  }
];

// GET /disasters/:id/social-media
const getSocialMediaReports = async (req, res) => {
  const { id } = req.params;

  try {
    // Check cache first
    const cacheKey = `social_media_${id}`;
    let filteredPosts = await CacheManager.get(cacheKey);

    if (!filteredPosts) {
      // Fetch the disaster from Supabase
      const { data: disaster, error } = await supabase
        .from('disasters')
        .select('location_name')
        .eq('id', id)
        .single();

      if (error || !disaster) {
        Logger.error('Disaster not found for social media lookup', { disaster_id: id });
        return res.status(404).json({ error: 'Disaster not found' });
      }

      const location = disaster.location_name.toLowerCase();

      // Filter posts that match the disaster location
      filteredPosts = mockPosts.filter((post) => {
        const postLocation = post.location.toLowerCase();
        return postLocation.includes(location) || location.includes(postLocation);
      });

      // Cache for 1 hour
      await CacheManager.set(cacheKey, filteredPosts, 1);
    }

    Logger.info('Social media reports fetched', {
      disaster_id: id,
      post_count: filteredPosts.length,
      cached: !!await CacheManager.get(cacheKey)
    });

    // Emit WebSocket update
    const io = req.app.get('io');
    if (io) {
      io.emit('social_media_updated', filteredPosts);
    }

    return res.status(200).json(filteredPosts);
  } catch (error) {
    Logger.error('Error fetching social media reports', {
      error: error.message,
      disaster_id: id
    });
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getSocialMediaReports
};
