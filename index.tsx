
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './src/app.component';
import { provideHttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    DatePipe
  ],
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
