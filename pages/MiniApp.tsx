import { useEffect, useState } from 'react';
import { Gift, Sparkles, RefreshCw } from 'lucide-react';
import ContestCard from '../components/ContestCard';
import { api, Contest } from '../lib/api';
import { getTelegramUser, initTelegramWebApp } from '../lib/telegram';

export default function MiniApp() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadContests = async () => {
    try {
      setLoading(true);
      const data = await api.getContests();
      setContests(data);
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initTelegramWebApp();
    const user = getTelegramUser();
    if (user.id) {
      api.registerUser(user.id, user.username || '', user.first_name || '', user.last_name || '').catch(() => {});
    }
    loadContests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-fuchsia-600/8 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-purple-500/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold bg-gradient-to-r from-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
                Giveaway
              </h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Конкурсы</p>
            </div>
          </div>
          <button
            onClick={loadContests}
            disabled={loading}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="relative max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs text-purple-300 font-medium">Активные конкурсы</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            Выигрывайте <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">призы</span>
          </h2>
          <p className="text-sm text-gray-500">Участвуйте в розыгрышах и забирайте награды</p>
        </div>

        {/* Loading */}
        {loading && contests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
            <p className="text-sm text-gray-500">Загрузка конкурсов...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={loadContests} className="mt-2 text-xs text-red-300 underline">Повторить</button>
          </div>
        )}

        {/* Contest Cards */}
        {!loading && contests.length === 0 && (
          <div className="text-center py-20">
            <Gift className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Пока нет активных конкурсов</p>
          </div>
        )}

        {contests.map((c) => (
          <ContestCard key={c.id} contest={c} onJoinSuccess={loadContests} />
        ))}

        {/* Bottom padding for mobile */}
        <div className="h-8" />
      </main>
    </div>
  );
}
