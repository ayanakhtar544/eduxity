'use client';

import React, { useState } from 'react';

export default function AdminNotificationPanel() {
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('Concept Clarity');
  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setStatusMsg(null);

    // DUMMY TOKENS FOR NOW. 
    // Production mein yeh tokens tumhare database (e.g., Supabase, Firebase) se aayenge jahan users ne login kiya hai.
    const allUsersTokens = [
      "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" // Replace with your actual phone token to test
    ];

    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle || 'New Smart Session Available! 🚀',
          message: customMessage || `Tap to master ${topic} for ${goal}.`,
          topic: topic,
          goal: goal,
          targetTokens: allUsersTokens, 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMsg({ text: "Notification fired successfully! 🔥", type: 'success' });
        // Optional: Reset form fields here if desired
      } else {
        setStatusMsg({ text: data.error || "Failed to send notification.", type: 'error' });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setStatusMsg({ text: "Network error occurred.", type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Push Notification Engine</h1>
        <p className="text-sm text-gray-500 mt-1">Broadcast learning sessions to all app users.</p>
      </div>

      <form onSubmit={handleSendNotification} className="space-y-6">
        
        {/* Core Payload Data */}
        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-4">
          <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">App Payload Data (Auto-fill)</h2>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Target Topic</label>
            <input 
              type="text" 
              required
              value={topic} 
              onChange={(e) => setTopic(e.target.value)} 
              placeholder="e.g., Thermodynamics"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Learning Goal</label>
            <select 
              value={goal} 
              onChange={(e) => setGoal(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="Concept Clarity">Concept Clarity</option>
              <option value="Exam Prep">Exam Prep</option>
              <option value="Quick Revision">Quick Revision</option>
            </select>
          </div>
        </div>

        {/* Display Text Customization */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Notification Display Text</h2>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Title (Optional)</label>
            <input 
              type="text" 
              value={customTitle} 
              onChange={(e) => setCustomTitle(e.target.value)} 
              placeholder="Leave blank for default title"
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Message Body (Optional)</label>
            <textarea 
              value={customMessage} 
              onChange={(e) => setCustomMessage(e.target.value)} 
              placeholder="Leave blank to auto-generate message based on topic"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-200 resize-none"
            />
          </div>
        </div>

        {/* Status Messages */}
        {statusMsg && (
          <div className={`p-4 rounded-lg font-medium text-sm ${statusMsg.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            {statusMsg.text}
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={!topic || isSending}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all
            ${topic && !isSending 
              ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]' 
              : 'bg-gray-400 cursor-not-allowed shadow-none'}`}
        >
          {isSending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Broadcasting...
            </span>
          ) : (
            'Broadcast to Users 🚀'
          )}
        </button>
      </form>
    </div>
  );
}