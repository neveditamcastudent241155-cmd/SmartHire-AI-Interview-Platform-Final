"use client";

import { useEffect, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const [interviews, setInterviews] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // later connect Firestore
      const res = await fetch("/api/interviews"); 
      const data = await res.json();
      setInterviews(data);
    };

    fetchData();
  }, []);

  const total = interviews.length;

  const avgScore =
    interviews.reduce((acc, i) => acc + (i.overall || 0), 0) / (total || 1);

  return (
    <div className="min-h-screen p-6 bg-black text-white">

      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-6">
        📊 Performance Dashboard
      </h1>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <div className="bg-gray-900 p-4 rounded-xl">
          Total Interviews: {total}
        </div>

        <div className="bg-gray-900 p-4 rounded-xl">
          Average Score: {avgScore.toFixed(1)}/10
        </div>

        <div className="bg-gray-900 p-4 rounded-xl">
          Last Interview: {interviews[0]?.date || "N/A"}
        </div>
      </div>

      {/* HISTORY */}
      <div className="bg-gray-900 p-6 rounded-xl mb-10">
        <h2 className="text-xl font-semibold mb-4">
          📅 Interview History
        </h2>

        {interviews.map((i, index) => (
          <div key={index} className="border-b border-gray-700 py-2">
            <p>📌 {i.role}</p>
            <p className="text-gray-400">
              {i.date} | Score: {i.overall}/10
            </p>
          </div>
        ))}
      </div>

      {/* GRAPH */}
      <div className="bg-gray-900 p-6 rounded-xl">
        <h2 className="text-xl mb-4">📊 Performance Trend</h2>

        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={interviews.map((i) => ({
            subject: i.role,
            A: i.overall
          }))}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis domain={[0, 10]} />
            <Radar dataKey="A" stroke="#22c55e" fill="#22c55e" />
          </RadarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}