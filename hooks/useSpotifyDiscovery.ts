import { useState, useEffect, useCallback } from 'react';
import { fetchAdvancedReleases } from '../lib/spotify';
import { Album, Track, FilterState } from '../types';

interface DiscoveryResult {
  data: (Album | Track)[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
}

export const useSpotifyDiscovery = (token: string | null, filters: FilterState): DiscoveryResult => {
  const [data, setData] = useState<(Album | Track)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Reset list when core filters change (Content Type, Genre, or Search Query)
  useEffect(() => {
    if (token) {
        reset();
    }
  }, [filters.contentType, filters.genre, filters.search, token]);

  // Effect to load initial data after reset or filter change
  useEffect(() => {
    if (token && data.length === 0 && !loading && hasMore) {
        loadReleases(0, true);
    }
  }, [token, filters, data.length]);

  const reset = () => {
      setData([]);
      setOffset(0);
      setHasMore(true);
      setError(null);
  };

  const loadReleases = useCallback(async (currentOffset = 0, isReset = false) => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAdvancedReleases(token, {
        offset: currentOffset,
        limit: 50,
        type: filters.contentType,
        genre: filters.genre,
        query: filters.search // Pass the search query
      });

      setData(prev => isReset ? result.items : [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setOffset(result.nextOffset);
    } catch (err) {
      console.error(err);
      setError("Falha ao carregar músicas. Tente reconectar ao Spotify.");
    } finally {
      setLoading(false);
    }
  }, [token, filters.contentType, filters.genre, filters.search]);

  const loadMore = () => {
    if (hasMore && !loading) {
      loadReleases(offset, false);
    }
  };

  return { data, loading, error, hasMore, loadMore, reset };
};