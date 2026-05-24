const API_BASE = '/api';

async function fetchApi(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  prize: string;
  winner_count: number;
  end_date: string;
  is_active: boolean;
  is_ad: boolean;
  ad_text: string;
  image_url: string;
  created_at: string;
  participant_count: number;
  required_channels: RequiredChannel[];
  winners?: Winner[];
}

export interface RequiredChannel {
  id: string;
  contest_id: string;
  channel_username: string;
  channel_title: string;
}

export interface Winner {
  id: string;
  users: {
    telegram_id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
}

export interface Stats {
  total_contests: number;
  active_contests: number;
  total_users: number;
  total_participants: number;
}

export const api = {
  getContests: () => fetchApi('/contests') as Promise<Contest[]>,
  getContest: (id: string) => fetchApi(`/contests/${id}`) as Promise<Contest>,
  createContest: (data: any) => fetchApi('/contests', { method: 'POST', body: JSON.stringify(data) }),
  updateContest: (id: string, data: any) => fetchApi(`/contests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContest: (id: string, adminId: number) => fetchApi(`/contests/${id}?admin_telegram_id=${adminId}`, { method: 'DELETE' }),
  joinContest: (contestId: string, telegramId: number) =>
    fetchApi(`/contests/${contestId}/join`, { method: 'POST', body: JSON.stringify({ contest_id: contestId, telegram_id: telegramId }) }),
  checkSubscription: (contestId: string, telegramId: number) =>
    fetchApi(`/contests/${contestId}/check-subscription`, { method: 'POST', body: JSON.stringify({ contest_id: contestId, telegram_id: telegramId }) }),
  selectWinners: (contestId: string, adminId: number) =>
    fetchApi(`/contests/${contestId}/select-winners`, { method: 'POST', body: JSON.stringify({ contest_id: contestId, admin_telegram_id: adminId }) }),
  getParticipants: (contestId: string, adminId: number) =>
    fetchApi(`/contests/${contestId}/participants?admin_telegram_id=${adminId}`),
  addChannel: (contestId: string, channelUsername: string, channelTitle: string, adminId: number) =>
    fetchApi(`/channels?admin_telegram_id=${adminId}`, { method: 'POST', body: JSON.stringify({ contest_id: contestId, channel_username: channelUsername, channel_title: channelTitle }) }),
  removeChannel: (channelId: string, adminId: number) =>
    fetchApi(`/channels/${channelId}?admin_telegram_id=${adminId}`, { method: 'DELETE' }),
  registerUser: (telegramId: number, username: string, firstName: string, lastName: string) =>
    fetchApi('/users/register', { method: 'POST', body: JSON.stringify({ telegram_id: telegramId, username, first_name: firstName, last_name: lastName }) }),
  checkParticipation: (contestId: string, telegramId: number) =>
    fetchApi(`/users/check-participation?contest_id=${contestId}&telegram_id=${telegramId}`),
  broadcast: (adminId: number, content: string) =>
    fetchApi('/broadcast', { method: 'POST', body: JSON.stringify({ admin_telegram_id: adminId, content }) }),
  getStats: () => fetchApi('/stats') as Promise<Stats>,
};
