import { useState } from 'react';
import { Gift, Users, Trophy, Clock, Check, AlertCircle, ExternalLink } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { api, Contest, RequiredChannel } from '../lib/api';
import { getTelegramUser, openChannel } from '../lib/telegram';

interface ContestCardProps {
  contest: Contest;
  onJoinSuccess?: () => void;
}

export default function ContestCard({ contest, onJoinSuccess }: ContestCardProps) {
  const user = getTelegramUser();
  const [participated, setParticipated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState<RequiredChannel[]>([]);
  const [showAd, setShowAd] = useState(false);
  const [checking, setChecking] = useState(false);

  const isExpired = new Date(contest.end_date).getTime() <= Date.now();

  const handleCaptchaVerify = () => {
    setCaptchaVerified(true);
    setShowCaptcha(false);
    handleJoin();
  };

  const handleJoin = async () => {
    if (!captchaVerified) {
      setShowCaptcha(true);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = checking && unsubscribed.length > 0
        ? await api.checkSubscription(contest.id, user.id)
        : await api.joinContest(contest.id, user.id);

      if (result.status === 'need_subscribe') {
        setUnsubscribed(result.unsubscribed_channels);
        setChecking(true);
        return;
      }
      if (result.status === 'joined') {
        setParticipated(true);
        if (contest.is_ad && contest.ad_text) {
          setShowAd(true);
        }
        onJoinSuccess?.();
      }
    } catch (e: any) {
      if (e.message.includes('Already')) {
        setParticipated(true);
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribeAndCheck = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.checkSubscription(contest.id, user.id);
      if (result.status === 'need_subscribe') {
        setUnsubscribed(result.unsubscribed_channels);
      }
      if (result.status === 'joined') {
        setParticipated(true);
        setUnsubscribed([]);
        if (contest.is_ad && contest.ad_text) {
          setShowAd(true);
        }
        onJoinSuccess?.();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-puchsia-500 to-purple-600 rounded-2xl opacity-30 group-hover:opacity-60 blur transition duration-500" />
      <div className="relative bg-gray-950 border border-purple-500/20 rounded-2xl overflow-hidden">
        {/* Header gradient */}
        <div className="h-2 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600" />

        <div className="p-5">
          {/* Title & Prize */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-bold text-white leading-tight flex-1 mr-3">{contest.title}</h3>
            <div className="flex items-center gap-1 bg-purple-500/20 border border-purple-500/30 rounded-lg px-2.5 py-1">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs font-semibold text-yellow-300">{contest.winner_count}</span>
            </div>
          </div>

          <p className="text-sm text-gray-400 mb-4 line-clamp-2">{contest.description}</p>

          {/* Prize */}
          <div className="flex items-center gap-2 bg-purple-900/30 border border-purple-500/20 rounded-xl p-3 mb-4">
            <Gift className="w-5 h-5 text-purple-400 shrink-0" />
            <span className="text-sm font-medium text-purple-200">{contest.prize}</span>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">{contest.participant_count}</span>
            </div>
            {isExpired && (
              <span className="text-xs text-red-400 font-medium">Завершён</span>
            )}
          </div>

          {/* Timer */}
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">Осталось</span>
            </div>
            <CountdownTimer endDate={contest.end_date} />
          </div>

          {/* Winners */}
          {contest.winners && contest.winners.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-300 uppercase tracking-wider">Победители</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {contest.winners.map((w, i) => (
                  <span key={i} className="bg-yellow-500/20 text-yellow-200 text-xs px-2 py-1 rounded-lg">
                    {w.users.username ? `@${w.users.username}` : w.users.first_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Unsubscribed channels */}
          {unsubscribed.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold text-red-300 uppercase tracking-wider">Подпишитесь на каналы</span>
              </div>
              <div className="flex flex-col gap-2">
                {unsubscribed.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => openChannel(ch.channel_username)}
                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg px-3 py-2 transition-colors text-left"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="text-sm text-red-200">{ch.channel_title || `@${ch.channel_username}`}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={handleSubscribeAndCheck}
                disabled={loading}
                className="w-full mt-3 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Проверка...' : 'Я подписался, проверить'}
              </button>
            </div>
          )}

          {/* Ad display */}
          {showAd && contest.ad_text && (
            <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-xl p-3 mb-4">
              <span className="text-xs text-fuchsia-400 uppercase tracking-wider font-semibold">Реклама</span>
              <p className="text-sm text-fuchsia-200 mt-1">{contest.ad_text}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-red-400 text-xs mb-3">{error}</p>
          )}

          {/* Captcha Modal */}
          {showCaptcha && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-6 mx-4 max-w-sm w-full">
                <h4 className="text-white font-semibold mb-4 text-center">Подтвердите, что вы не робот</h4>
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div
                    className="w-8 h-8 border-2 border-purple-500 rounded flex items-center justify-center cursor-pointer hover:bg-purple-500/20 transition-colors"
                    onClick={handleCaptchaVerify}
                  >
                    <Check className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-gray-300 text-sm">Я не робот</span>
                </div>
                <button
                  onClick={handleCaptchaVerify}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-2.5 rounded-xl transition-all duration-200"
                >
                  Подтвердить
                </button>
              </div>
            </div>
          )}

          {/* Join Button */}
          {!isExpired && !participated && unsubscribed.length === 0 && (
            <button
              onClick={handleJoin}
              disabled={loading}
              className="w-full relative overflow-hidden bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group/btn"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Gift className="w-4 h-4" />
                {loading ? 'Загрузка...' : 'Участвовать'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
            </button>
          )}

          {participated && !showAd && (
            <div className="w-full flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 font-medium py-3 rounded-xl">
              <Check className="w-4 h-4" />
              <span className="text-sm">Вы участвуете!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
