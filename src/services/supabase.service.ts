
import { Injectable, signal } from '@angular/core';
import { supabase } from '../supabase.client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface MedicionData {
  distancia_cm: number;
  alerta: boolean;
}

export interface MedicionDistancia {
  id: number;
  created_at: string;
  device_id: string;
  datos_sensor: MedicionData;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private channel: RealtimeChannel | null = null;

  async getInitialMeasurements(limit: number = 10): Promise<MedicionDistancia[]> {
    const { data, error } = await supabase
      .from('mediciones_distancia')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching initial data:', error);
      throw error;
    }
    return data || [];
  }

  listenToChanges(callback: (payload: MedicionDistancia) => void): () => Promise<"ok" | "timed out" | "error"> {
    if (this.channel) {
        this.unsubscribe();
    }
    
    this.channel = supabase
      .channel('mediciones_distancia_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mediciones_distancia' },
        (payload) => {
          callback(payload.new as MedicionDistancia);
        }
      )
      .subscribe();

    return () => this.unsubscribe();
  }

  unsubscribe(): Promise<"ok" | "timed out" | "error"> {
    if (this.channel) {
      return this.channel.unsubscribe();
    }
    return Promise.resolve("ok");
  }
}
