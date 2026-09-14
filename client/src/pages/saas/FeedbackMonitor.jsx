import React, { useState, useEffect } from 'react';
import { feedbackAPI } from '../../services/api';
import { MessageSquare, Star, User, Calendar } from 'lucide-react';

export default function FeedbackMonitor() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({ total: 0, averageRating: 5.0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const res = await feedbackAPI.getFeedbacks();
      setFeedbacks(res.data.feedbacks || []);
      setStats(res.data.stats || { total: 0, averageRating: 5.0 });
    } catch (err) {
      console.error('Failed to load feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-amber-400" />
            Guest Reviews & Culinary Feedback
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time ratings submitted by diners directly from digital menu and receipt links.
          </p>
        </div>

        <div className="flex items-center gap-4 p-3 rounded-2xl bg-black/40 border border-white/10 text-xs">
          <div>
            <span className="text-slate-400">Total Reviews:</span>{' '}
            <strong className="text-white">{stats.total}</strong>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Average:</span>{' '}
            <strong className="text-amber-400 text-sm">{stats.averageRating}★</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {feedbacks.map((f) => (
          <div
            key={f.id}
            className="p-5 rounded-3xl bg-restoza-dark-900 border border-white/10 flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                    {f.customerName ? f.customerName[0].toUpperCase() : 'G'}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">{f.customerName || 'Valued Guest'}</h4>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(f.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: f.overallRating || 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-300 italic leading-relaxed">
                "{f.comment || 'Exceptional experience, delicious meals.'}"
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span>Food: <strong className="text-amber-300">{f.foodRating}/5</strong></span>
              <span>Service: <strong className="text-amber-300">{f.serviceRating}/5</strong></span>
            </div>
          </div>
        ))}

        {feedbacks.length === 0 && (
          <p className="col-span-full text-center py-12 text-slate-400 text-xs">
            No guest reviews submitted yet.
          </p>
        )}
      </div>

    </div>
  );
}
