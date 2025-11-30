import { Component, ChangeDetectionStrategy, input, ElementRef, OnChanges, SimpleChanges, viewChild, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { MedicionDistancia } from './services/supabase.service';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule]
})
export class ChartComponent implements OnChanges {
  data = input.required<MedicionDistancia[]>();
  
  private chartContainer = viewChild<ElementRef<HTMLDivElement>>('chartContainer');
  private svg: any;

  constructor() {
    afterNextRender(() => {
      this.createChart();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.chartContainer()?.nativeElement) {
      this.createChart();
    }
  }

  private createChart(): void {
    const element = this.chartContainer()?.nativeElement;
    if (!element || !this.data() || this.data().length < 2) {
      d3.select(element).select('svg').remove();
      return;
    }
    
    // d3 expects data chronologically, but we store it newest-first.
    const chartData = [...this.data()].reverse();

    d3.select(element).select('svg').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = element.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    this.svg = d3.select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(chartData, d => new Date(d.created_at)) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, Math.max(50, d3.max(chartData, d => d.datos_sensor.distancia_cm) as number * 1.1)])
      .range([height, 0]);

    // X-Axis
    this.svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickSizeOuter(0))
      .call(g => g.selectAll('text').style('fill', '#9ca3af'))
      .call(g => g.selectAll('.domain').style('stroke', '#4b5563'))
      .call(g => g.selectAll('.tick line').style('stroke', '#4b5563'));

    // Y-Axis
    this.svg.append('g')
      .call(d3.axisLeft(y).tickSizeOuter(0))
      .call(g => g.selectAll('text').style('fill', '#9ca3af'))
      .call(g => g.selectAll('.domain').style('stroke', '#4b5563'))
      .call(g => g.selectAll('.tick line').style('stroke', '#4b5563'));
    
    // Y-Axis Label
    this.svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 5)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", "#d1d5db")
        .style("font-size", "12px")
        .text("Distance (cm)");

    // Gradient for the area
    const gradient = this.svg.append("defs")
      .append("linearGradient")
      .attr("id", "area-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", y(0))
      .attr("x2", 0).attr("y2", y(d3.max(chartData, d => d.datos_sensor.distancia_cm) as number));

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#1f2937").attr("stop-opacity", 0.5);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#38bdf8").attr("stop-opacity", 0.3);

    // Area Path
    this.svg.append('path')
      .datum(chartData)
      .attr('fill', 'url(#area-gradient)')
      .attr('stroke', 'none')
      .attr('d', d3.area<MedicionDistancia>()
        .x(d => x(new Date(d.created_at)))
        .y0(height)
        .y1(d => y(d.datos_sensor.distancia_cm))
        .curve(d3.curveMonotoneX)
      );

    // Line Path
    this.svg.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2.5)
      .attr('d', d3.line<MedicionDistancia>()
        .x(d => x(new Date(d.created_at)))
        .y(d => y(d.datos_sensor.distancia_cm))
        .curve(d3.curveMonotoneX)
      );

    // Data Point Circles
    this.svg.selectAll("dot")
        .data(chartData)
        .enter().append("circle")
        .attr("r", 4)
        .attr("cx", (d: MedicionDistancia) => x(new Date(d.created_at)))
        .attr("cy", (d: MedicionDistancia) => y(d.datos_sensor.distancia_cm))
        .style("fill", (d: MedicionDistancia) => {
            const dist = d.datos_sensor.distancia_cm;
            if (dist >= 30) return "#ef4444"; // red
            if (dist >= 26) return "#3b82f6"; // blue
            if (dist >= 16) return "#eab308"; // yellow
            return "#22c55e"; // green
        })
        .style("stroke", "#111827")
        .style("stroke-width", 2);

    // Warning Threshold Line
    const warningThreshold = 15;
    if ((y.domain()[1] || 0) > warningThreshold) {
        this.svg.append('line')
          .attr('x1', 0)
          .attr('y1', y(warningThreshold))
          .attr('x2', width)
          .attr('y2', y(warningThreshold))
          .attr('stroke', '#eab308') // yellow
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '5,5')
          .style('opacity', 0.8);

        this.svg.append('text')
          .attr('x', width - 5)
          .attr('y', y(warningThreshold) - 5)
          .attr('text-anchor', 'end')
          .style('fill', '#eab308')
          .style('font-size', '10px')
          .style('font-weight', 'bold')
          .text('Warning Threshold (15cm)');
    }

    // Observe Threshold Line
    const observeThreshold = 25;
    if ((y.domain()[1] || 0) > observeThreshold) {
        this.svg.append('line')
          .attr('x1', 0)
          .attr('y1', y(observeThreshold))
          .attr('x2', width)
          .attr('y2', y(observeThreshold))
          .attr('stroke', '#3b82f6') // blue
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '5,5')
          .style('opacity', 0.8);

        this.svg.append('text')
          .attr('x', width - 5)
          .attr('y', y(observeThreshold) - 5)
          .attr('text-anchor', 'end')
          .style('fill', '#3b82f6')
          .style('font-size', '10px')
          .style('font-weight', 'bold')
          .text('Observe Threshold (25cm)');
    }

    // Alert Threshold Line
    const alertThreshold = 30;
    if ((y.domain()[1] || 0) > alertThreshold) {
        this.svg.append('line')
          .attr('x1', 0)
          .attr('y1', y(alertThreshold))
          .attr('x2', width)
          .attr('y2', y(alertThreshold))
          .attr('stroke', '#ef4444') // red
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '5,5')
          .style('opacity', 0.8);

        this.svg.append('text')
          .attr('x', width - 5)
          .attr('y', y(alertThreshold) - 5)
          .attr('text-anchor', 'end')
          .style('fill', '#ef4444')
          .style('font-size', '10px')
          .style('font-weight', 'bold')
          .text('Alert Threshold (30cm)');
    }
  }
}