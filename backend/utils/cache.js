const supabase = require('../supabaseClient');

class CacheManager {
  static async get(key) {
    try {
      const { data, error } = await supabase
        .from('cache')
        .select('value, expires_at')
        .eq('key', key)
        .single();

      if (error || !data) return null;

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        await this.delete(key);
        return null;
      }

      return data.value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key, value, ttlHours = 1) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + ttlHours);

      const { error } = await supabase
        .from('cache')
        .upsert({
          key,
          value,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  static async delete(key) {
    try {
      await supabase.from('cache').delete().eq('key', key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  static async clearImageCache() {
    try {
      await supabase.from('cache').delete().like('key', 'gemini_image_%');
      console.log('Image verification cache cleared');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
}

module.exports = CacheManager;

// Clear image cache on startup for fresh testing
setTimeout(() => {
  CacheManager.clearImageCache();
  console.log('🧹 Image verification cache cleared for fresh testing');
}, 1000);