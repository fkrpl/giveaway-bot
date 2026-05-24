import { useEffect, useState } from 'react';
import { Plus, Trash2, CreditCard as Edit3, Users, Trophy, BarChart3, Send, ChevronDown, ChevronUp, X, Save, Megaphone, Link, Eye } from 'lucide-react';
import { api, Contest, Stats } from '../lib/api';
import { getTelegramUser, initTelegramWebApp } from '../lib/telegram';

type Tab = 'contests' | 'create' | 'broadcast' | 'stats';

interface ContestForm {
  title: string;
  description: string;
  prize: string;
  winner_count: number;
  end_date: string;
  is_ad: boolean;
  ad_text: string;
  image_url: string;
}

const emptyForm: ContestForm = {
  title: '', description: '', prize: '', winner_count: 1,
  end_date: '', is_ad: false, ad_text: '', image_url: '',
};

export default function Admin() {
  const user = getTelegramUser();
  const [tab, setTab] = useState<Tab>('contests');
  const [contests, setContests] = useState<Contest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [form, setForm] = useState<ContestForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [channels, setChannels] = useState<{ contestId: string; username: string; title: string }[]>([]);
  const [broadcastText, setBroadcastText] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedContest, setExpandedContest] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const loadContests = async () => {
    try {
      const data = await api.getContests();
      setContests(data);
    } catch (e: any) {
      showMessage('error', e.message);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch {}
  };

  useEffect(() => {
    initTelegramWebApp();
    loadContests();
    loadStats();
  }, []);

  const handleCreateContest = async () => {
    if (!form.title || !form.prize || !form.end_date) {
      showMessage('error', 'Заполните обязательные поля');
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        await api.updateContest(editingId, form);
        showMessage('success', 'Конкурс обновлён');
      } else {
        const contest = await api.createContest({ ...form, admin_telegram_id: user.id });
        for (const ch of channels) {
          await api.addChannel(contest.id, ch.username, ch.title, user.id);
        }
        showMessage('success', 'Конкурс создан');
      }
      setForm(emptyForm);
      setEditingId(null);
      setChannels([]);
      setTab('contests');
      loadContests();
      loadStats();
    } catch (e: any) {
      showMessage('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить конкурс?')) return;
    try {
      await api.deleteContest(id, user.id);
      showMessage('success', 'Конкурс удалён');
      loadContests();
      loadStats();
    } catch (e: any) {
      showMessage('error', e.message);
    }
  };

  const handleEdit = (c: Contest) => {
    setEditingId(c.id);
    setForm({
      title: c.title, description: c.description, prize: c.prize,
      winner_count: c.winner_count, end_date: c.end_date.slice(0, 16),
      is_ad: c.is_ad, ad_text: c.ad_text, image_url: c.image_url,
    });
    setChannels(c.required_channels.map(ch => ({
      contestId: c.id, username: ch.channel_username, title: ch.channel_title,
    })));
    setTab('create');
  };

  const handleSelectWinners = async (contestId: string) => {
    setLoading(true);
    try {
      await api.selectWinners(contestId, user.id);
      showMessage('success', 'Победители выбраны!');
      loadContests();
    } catch (e: any) {
      showMessage('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewParticipants = async (contestId: string) => {
    try {
      const data = await api.getParticipants(contestId, user.id);
      setParticipants(data);
      setExpandedContest(expandedContest === contestId ? null : contestId);
    } catch (e: any) {
      showMessage('error', e.message);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) {
      showMessage('error', 'Введите текст рассылки');
      return;
    }
    setLoading(true);
    try {
      const result = await api.broadcast(user.id, broadcastText);
      showMessage('success', `Отправлено ${result.sent} из ${result.total} пользователям`);
      setBroadcastText('');
    } catch (e: any) {
      showMessage('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const addChannelField = () => {
    setChannels([...channels, { contestId: editingId || '', username: '', title: '' }]);
  };

  const removeChannelField = (idx: number) => {
    setChannels(channels.filter((_, i) => i !== idx));
  };

  const updateChannelField = (idx: number, field: 'username' | 'title', value: string) => {
    const updated = [...channels];
    updated[idx] = { ...updated[idx], [field]: value };
    setChannels(updated);
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'contests', label: 'Конкурсы', icon: Eye },
    { id: 'create', label: editingId ? 'Редактировать' : 'Создать', icon: Plus },
    { id: 'broadcast', label: 'Рассылка', icon: Send },
    { id: 'stats', label: 'Статистика', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-purple-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-fuchsia-600/6 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-purple-500/10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Админ панель</h1>
              <p className="text-[10px] text-gray-500">Управление конкурсами</p>
            </div>
          </div>
          {/* Tab bar */}
          <div className="flex gap-1 bg-gray-900 rounded-xl p-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => { if (t.id !== 'create' || !editingId) { setEditingId(null); setForm(emptyForm); setChannels([]); } setTab(t.id); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  tab === t.id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Message toast */}
      {message && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm font-medium shadow-lg transition-all ${
          message.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
        }`}>
          {message.text}
        </div>
      )}

      <main className="relative max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* --- CONTESTS TAB --- */}
        {tab === 'contests' && (
          <>
            {contests.length === 0 && (
              <div className="text-center py-16">
                <Megaphone className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Нет конкурсов</p>
              </div>
            )}
            {contests.map(c => (
              <div key={c.id} className="bg-gray-900 border border-purple-500/10 rounded-xl overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-white">{c.title}</h3>
                        {c.is_ad && <span className="text-[10px] bg-fuchsia-500/20 text-fuchsia-300 px-1.5 py-0.5 rounded">РЕКЛАМА</span>}
                        {!c.is_active && <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">ЗАВЕРШЁН</span>}
                      </div>
                      <p className="text-xs text-gray-500">{c.prize}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(c)} className="p-1.5 rounded-lg hover:bg-purple-500/10 text-purple-400 transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.participant_count}</span>
                    <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{c.winner_count}</span>
                  </div>

                  {c.is_active && (
                    <button
                      onClick={() => handleSelectWinners(c.id)}
                      disabled={loading}
                      className="w-full bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-300 text-xs font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trophy className="w-3.5 h-3.5 inline mr-1" />
                      Выбрать победителей
                    </button>
                  )}

                  <button
                    onClick={() => handleViewParticipants(c.id)}
                    className="w-full mt-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Участники
                    {expandedContest === c.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Participants list */}
                {expandedContest === c.id && (
                  <div className="border-t border-purple-500/10 p-4 bg-gray-900/50">
                    {participants.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center">Нет участников</p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {participants.map((p: any) => (
                          <div key={p.id} className="flex items-center gap-2 text-xs text-gray-400">
                            <Users className="w-3 h-3 text-purple-400" />
                            <span>{p.users?.username ? `@${p.users.username}` : p.users?.first_name || 'User'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* --- CREATE/EDIT TAB --- */}
        {tab === 'create' && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white">
              {editingId ? 'Редактировать конкурс' : 'Новый конкурс'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Название *</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-gray-900 border border-purple-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none transition-colors"
                  placeholder="Название конкурса"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Описание</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-gray-900 border border-purple-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none transition-colors resize-none"
                  rows={3}
                  placeholder="Описание конкурса"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Приз *</label>
                <input
                  value={form.prize}
                  onChange={e => setForm({ ...form, prize: e.target.value })}
                  className="w-full bg-gray-900 border border-purple-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none transition-colors"
                  placeholder="Что разыгрывается"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Победителей</label>
                  <input
                    type="number"
                    min={1}
                    value={form.winner_count}
                    onChange={e => setForm({ ...form, winner_count: parseInt(e.target.value) || 1 })}
                    className="w-full bg-gray-900 border border-purple-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Окончание *</label>
                  <input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={e => setForm({ ...form, end_date: e.target.value })}
                    className="w-full bg-gray-900 border border-purple-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Ad toggle */}
              <div className="bg-gray-900 border border-purple-500/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-fuchsia-400" />
                    <span className="text-sm text-white font-medium">Рекламный конкурс</span>
                  </div>
                  <button
                    onClick={() => setForm({ ...form, is_ad: !form.is_ad })}
                    className={`w-10 h-6 rounded-full transition-colors duration-200 ${form.is_ad ? 'bg-purple-600' : 'bg-gray-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 mt-1 ${form.is_ad ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
                {form.is_ad && (
                  <textarea
                    value={form.ad_text}
                    onChange={e => setForm({ ...form, ad_text: e.target.value })}
                    className="w-full bg-gray-800 border border-purple-500/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500 outline-none transition-colors resize-none mt-2"
                    rows={2}
                    placeholder="Текст рекламы (показывается после участия)"
                  />
                )}
              </div>

              {/* Required Channels */}
              <div className="bg-gray-900 border border-purple-500/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Link className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-white font-medium">Обязательные каналы</span>
                  </div>
                  <button
                    onClick={addChannelField}
                    className="text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    + Добавить
                  </button>
                </div>
                {channels.map((ch, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input
                      value={ch.username}
                      onChange={e => updateChannelField(idx, 'username', e.target.value)}
                      className="flex-1 bg-gray-800 border border-purple-500/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500 outline-none transition-colors"
                      placeholder="@username"
                    />
                    <input
                      value={ch.title}
                      onChange={e => updateChannelField(idx, 'title', e.target.value)}
                      className="flex-1 bg-gray-800 border border-purple-500/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500 outline-none transition-colors"
                      placeholder="Название"
                    />
                    <button onClick={() => removeChannelField(idx)} className="text-red-400 hover:text-red-300 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {channels.length === 0 && (
                  <p className="text-xs text-gray-600 text-center">Нет обязательных каналов</p>
                )}
              </div>
            </div>

            <button
              onClick={handleCreateContest}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-purple-500 hover:to-fuchsia-400 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Сохранение...' : editingId ? 'Обновить конкурс' : 'Создать конкурс'}
            </button>

            {editingId && (
              <button
                onClick={() => { setEditingId(null); setForm(emptyForm); setChannels([]); }}
                className="w-full bg-gray-800 text-gray-400 py-2.5 rounded-xl text-sm"
              >
                Отмена
              </button>
            )}
          </div>
        )}

        {/* --- BROADCAST TAB --- */}
        {tab === 'broadcast' && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-400" />
              Массовая рассылка
            </h2>
            <p className="text-xs text-gray-500">Сообщение будет отправлено всем пользователям платформы</p>
            <textarea
              value={broadcastText}
              onChange={e => setBroadcastText(e.target.value)}
              className="w-full bg-gray-900 border border-purple-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none transition-colors resize-none"
              rows={6}
              placeholder="Текст рассылки (поддерживается HTML)..."
            />
            <button
              onClick={handleBroadcast}
              disabled={loading || !broadcastText.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-purple-500 hover:to-fuchsia-400 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Отправка...' : 'Отправить всем'}
            </button>
          </div>
        )}

        {/* --- STATS TAB --- */}
        {tab === 'stats' && stats && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              Статистика
            </h2>
            {[
              { label: 'Всего конкурсов', value: stats.total_contests, color: 'purple' },
              { label: 'Активных', value: stats.active_contests, color: 'green' },
              { label: 'Пользователей', value: stats.total_users, color: 'blue' },
              { label: 'Участий', value: stats.total_participants, color: 'fuchsia' },
            ].map((s, i) => (
              <div key={i} className="bg-gray-900 border border-purple-500/10 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm text-gray-400">{s.label}</span>
                <span className={`text-lg font-bold ${
                  s.color === 'purple' ? 'text-purple-400' :
                  s.color === 'green' ? 'text-green-400' :
                  s.color === 'blue' ? 'text-blue-400' : 'text-fuchsia-400'
                }`}>{s.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="h-8" />
      </main>
    </div>
  );
}
