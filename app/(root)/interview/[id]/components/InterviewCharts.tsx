"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

interface Props {
  chartData: {
    name: string;
    score: number;
  }[];

  radarData: {
    subject: string;
    A: number;
    fullMark: number;
  }[];
}

export default function InterviewCharts({
  chartData,
  radarData,
}: Props) {
  return (
    <>
      <div className="max-w-5xl mx-auto mb-10">
        <h2 className="text-xl font-semibold mb-4">
          Skill Breakdown
        </h2>

        <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#ccc" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="score"
                fill="#22c55e"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mb-10">
        <h2 className="text-xl font-semibold mb-4">
          AI Skill Radar
        </h2>

        <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <Radar
                dataKey="A"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}