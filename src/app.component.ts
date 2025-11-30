import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SupabaseService, MedicionDistancia } from './services/supabase.service';
import { ChartComponent } from './chart.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ChartComponent]
})
export class AppComponent implements OnInit, OnDestroy {
  private supabaseService = inject(SupabaseService);
  public datePipe = inject(DatePipe);

  measurements = signal<MedicionDistancia[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  latestMeasurement = computed(() => this.measurements()?.[0] ?? null);
  
  private unsubscribeFromChanges: (() => Promise<any>) | null = null;

  async ngOnInit(): Promise<void> {
    try {
      this.error.set(null);
      this.isLoading.set(true);
      // Fetch last 50 measurements for the chart
      const initialData = await this.supabaseService.getInitialMeasurements(50);
      this.measurements.set(initialData);
      
      this.unsubscribeFromChanges = this.supabaseService.listenToChanges((newMeasurement) => {
        this.measurements.update(currentMeasurements => {
          const updated = [newMeasurement, ...currentMeasurements];
          // Keep the list at 50 items
          if (updated.length > 50) {
            updated.pop();
          }
          return updated;
        });
      });

    } catch (err) {
      this.error.set('Failed to load distance measurements. Please check your connection and configuration.');
      console.error(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.unsubscribeFromChanges) {
      this.unsubscribeFromChanges();
    }
  }

  getDistanceStatus(distancia: number | undefined) {
    if (distancia === undefined) {
        return { text: 'Unknown', cardClass: 'bg-gray-800', textColorClass: 'text-gray-400', pillClass: 'bg-gray-700', level: 'unknown' };
    }
    if (distancia > 25) { // Red
        return { text: 'Alert', cardClass: 'bg-red-600', textColorClass: 'text-red-100', pillClass: 'bg-red-900/50', level: 'alert' };
    }
    if (distancia >= 16) { // Yellow
        return { text: 'Warning', cardClass: 'bg-yellow-500', textColorClass: 'text-yellow-100', pillClass: 'bg-yellow-900/50', level: 'warning' };
    }
    // Green
    return { text: 'Safe', cardClass: 'bg-green-600', textColorClass: 'text-green-100', pillClass: 'bg-green-900/50', level: 'safe' };
  }

  formatTimestamp(timestamp: string): string {
    return this.datePipe.transform(timestamp, 'medium') || 'Invalid Date';
  }
}