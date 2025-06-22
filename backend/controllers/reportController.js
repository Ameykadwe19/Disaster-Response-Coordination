const { v4: uuidv4 } = require('uuid');
const supabase = require('../supabaseClient');

// POST /api/reports
const createReport = async (req, res) => {
  try {
    const { disaster_id, user_id, content, image_url, verification_status } = req.body;

    if (!disaster_id || !user_id || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          id: uuidv4(),
          disaster_id,
          user_id,
          content,
          image_url,
          verification_status: verification_status || 'pending'
        }
      ])
      .select();

    if (error) throw error;

    return res.status(201).json({ report: data[0] });
  } catch (err) {
    console.error('❌ Error creating report:', err.message || err);
    return res.status(500).json({ error: 'Failed to create report' });
  }
};

// GET /api/reports/:disasterId
const getReportsByDisaster = async (req, res) => {
  const { disasterId } = req.params;

  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('disaster_id', disasterId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ reports: data });
  } catch (err) {
    console.error('❌ Error fetching reports:', err.message || err);
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

module.exports = {
  createReport,
  getReportsByDisaster
};
