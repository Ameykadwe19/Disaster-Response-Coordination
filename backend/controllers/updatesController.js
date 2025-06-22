const axios = require('axios');
const cheerio = require('cheerio');
const CacheManager = require('../utils/cache');
const Logger = require('../utils/logger');

const RED_CROSS_URL = 'https://www.redcross.org/about-us/news-and-events.html';

const getOfficialUpdates = async (req, res) => {
  const { id } = req.params;
  const cacheKey = `official_updates_${id}`;
  const forceFetch = req.query.force === 'true';

  try {
    // Check Cache first
    if (!forceFetch) {
      const cached = await CacheManager.get(cacheKey);
      if (cached && cached.length) {
        Logger.info('Official updates served from cache', {
          disaster_id: id,
          update_count: cached.length
        });
        return res.status(200).json({ fromCache: true, updates: cached });
      }
    }

    const { data: html } = await axios.get(RED_CROSS_URL);
    const $ = cheerio.load(html);
    const updates = [];

    $('a[href*="/about-us/news-and-events/"]').slice(0, 5).each((_, el) => {
      const title = $(el).text().trim();
      const relativeLink = $(el).attr('href');
      const link = relativeLink?.startsWith('http')
        ? relativeLink
        : `https://www.redcross.org${relativeLink}`;

      if (title && link && title.length > 10) {
        updates.push({ title, link, source: 'Red Cross', published_at: new Date().toISOString() });
      }
    });

    // Cache for 2 hours
    await CacheManager.set(cacheKey, updates, 2);

    Logger.info('Official updates scraped successfully', {
      disaster_id: id,
      update_count: updates.length,
      source: 'Red Cross'
    });

    // WebSocket broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('official_updates', updates);
    }

    return res.status(200).json({ fromCache: false, updates });
  } catch (err) {
    Logger.error('Official updates scraping failed', {
      error: err.message,
      disaster_id: id,
      url: RED_CROSS_URL
    });
    return res.status(500).json({ error: 'Failed to fetch official updates' });
  }
};



module.exports = { getOfficialUpdates };
