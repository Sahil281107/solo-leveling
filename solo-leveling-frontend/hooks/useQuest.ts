'use client';
import { useState, useEffect, useCallback } from 'react';

export function useQuests() {
  const [dailyQuests, setDailyQuests] = useState<any[]>([]);
  const [weeklyQuests, setWeeklyQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuests = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [dailyRes, weeklyRes] = await Promise.all([
        fetch('http://localhost:5000/api/quests/daily', { headers }),
        fetch('http://localhost:5000/api/quests/weekly', { headers })
      ]);
      
      const dailyData = await dailyRes.json();
      const weeklyData = await weeklyRes.json();
      
      setDailyQuests(dailyData.quests || []);
      setWeeklyQuests(weeklyData.quests || []);
    } catch (error) {
      console.error('Failed to fetch quests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const completeQuest = async (questId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/quests/complete/${questId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        await fetchQuests(); // Refresh quests
      }
    } catch (error) {
      console.error('Failed to complete quest:', error);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  return {
    dailyQuests,
    weeklyQuests,
    loading,
    refetch: fetchQuests,
    completeQuest
  };
}