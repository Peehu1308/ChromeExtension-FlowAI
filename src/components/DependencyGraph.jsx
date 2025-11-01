import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function DependencyGraph({ data }) {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;
    const width = 600, height = 400;
    const svg = d3.select(ref.current)
      .attr("width", width)
      .attr("height", height)
      .style("background", "#fafafa");

    svg.selectAll("*").remove();

    // Convert your parsed file data to nodes + links
    const nodes = data.map((d) => ({ id: d.path || d.filePath }));
    const links = data.flatMap((d) =>
      (d.imports || []).map((i) => ({ source: d.path || d.filePath, target: i }))
    );

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g").selectAll("line")
      .data(links).enter().append("line")
      .attr("stroke", "#ccc");

    const node = svg.append("g").selectAll("circle")
      .data(nodes).enter().append("circle")
      .attr("r", 10)
      .attr("fill", "#4f46e5");

    const label = svg.append("g").selectAll("text")
      .data(nodes).enter().append("text")
      .text((d) => d.id.split("/").pop())
      .attr("font-size", 10)
      .attr("dy", -15);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      label.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });
  }, [data]);

  return <svg ref={ref}></svg>;
}
