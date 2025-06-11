import { useState } from 'react';
import axios from 'axios';
import { Search, Music, Play, Loader2, Heart } from 'lucide-react';

const App = () => {
  const [mood, setMood] = useState('');
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generatePlaylist = async () => {
    if (!mood.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:4560/api/generate-playlist', {
        mood: mood.trim() 
      });

      setPlaylist(response.data);

    } catch (err) {
      if (err.response) {
        console.error('Error Response:', err.response.data);
        setError(err.response.data.message || 'An error occurred while generating the playlist.');
      } else if (err.request) {
        console.error('Error Request:', err.request);
        setError('The server is not responding. Please try again later.');
      } else {
        console.error('Error Message:', err.message);
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Music className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-800">MoodBeatsAI</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              What's your vibe today?
            </h2>
            <p className="text-slate-600">
              Describe your mood and let AI curate the perfect playlist for you
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="e.g., nostalgic on a rainy evening..."
                className="w-full px-4 py-4 pr-12 text-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && generatePlaylist()}
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
            
            <button
              onClick={generatePlaylist}
              disabled={loading || !mood.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-4 px-6
              rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating your playlist...
                </>
              ) : (
                <>
                  <Music className="w-5 h-5" />
                  Generate Playlist
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <p className="text-red-700 text-center">{error}</p>
          </div>
        )}

        {playlist && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="w-6 h-6 text-blue-600" />
              <h3 className="text-2xl font-bold text-slate-800">
                Your Mood Playlist
              </h3>
            </div>
            
            <p className="text-slate-600 mb-6 text-lg leading-relaxed">
              Found {playlist.tracks?.length || 0} tracks that match your vibe
            </p>

            <div className="space-y-4">
              {playlist.tracks?.map((track, index) => (
                <TrackCard key={track.id || index} track={track} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const TrackCard = ({ track }) => {
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
      <div className="flex-shrink-0">
        {track.albumArt ? (
          <img src={track.albumArt} alt={`${track.albumName} cover`} className="w-16 h-16 rounded-lg object-cover" />
        ) : (
          <div className="w-16 h-16 bg-slate-300 rounded-lg flex items-center justify-center">
            <Music className="w-6 h-6 text-slate-500" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-slate-800 truncate">{track.name}</h4>
        <p className="text-slate-600 truncate">{track.artists}</p>
        {track.albumName && <p className="text-sm text-slate-500 truncate">{track.albumName}</p>}
      </div>
      {track.duration && <div className="text-sm text-slate-500 flex-shrink-0">{formatDuration(track.duration)}</div>}
      <div className="flex-shrink-0">
        {track.url ? (
          <a href={track.url} target="_blank" rel="noopener noreferrer"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors">
            <Play className="w-5 h-5" />
          </a>
        ) : (
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-300">
            <Play className="w-5 h-5 text-slate-500" />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
