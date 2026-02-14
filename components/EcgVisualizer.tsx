
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface EcgVisualizerProps {
  heartRate?: number;
  urgency?: string;
}

export const EcgVisualizer: React.FC<EcgVisualizerProps> = ({ heartRate = 72, urgency }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = 120;
    const margin = { top: 10, right: 0, bottom: 10, left: 0 };

    const x = d3.scaleLinear().domain([0, 100]).range([0, width]);
    const y = d3.scaleLinear().domain([-1.5, 2]).range([height - margin.bottom, margin.top]);

    // Create the waveform path data
    // Simulating P, QRS, T
    const cycle = [
      [0, 0], [10, 0], [15, 0.2], [20, 0], // P
      [22, 0], [24, -0.2], [26, 1.5], [28, -0.4], [30, 0], // QRS
      [45, 0.4], [55, 0], // T
      [100, 0]
    ];

    const line = d3.line<any>()
      .x(d => x(d[0]))
      .y(d => y(d[1]))
      .curve(d3.curveMonotoneX);

    const path = svg.append("path")
      .datum(cycle)
      .attr("fill", "none")
      .attr("stroke", urgency === 'CRITICAL' ? "#ef4444" : "#10b981")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Grid lines for medical look
    svg.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(d3.axisBottom(x).ticks(20).tickSize(height).tickFormat(() => ""));

    svg.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(d3.axisLeft(y).ticks(10).tickSize(-width).tickFormat(() => ""));

    // Animate scanning line
    const scanLine = svg.append("line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("opacity", 0.3);

    const animate = () => {
      scanLine
        .transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .attr("x1", width)
        .attr("x2", width)
        .on("end", () => {
          scanLine.attr("x1", 0).attr("x2", 0);
          animate();
        });
    };
    animate();

  }, [heartRate, urgency]);

  return (
    <div className="w-full bg-slate-900 rounded-lg p-2 border border-slate-800 overflow-hidden">
      <svg ref={svgRef} className="w-full h-[120px]"></svg>
    </div>
  );
};
