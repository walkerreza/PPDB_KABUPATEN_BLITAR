// Performance monitoring utilities
export const initializePerformanceMonitoring = () => {
  if ('PerformanceObserver' in window) {
    // Monitor LCP (Largest Contentful Paint)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
      // Send to analytics if needed
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Monitor CLS (Cumulative Layout Shift)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          console.log('Current CLS:', clsValue);
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });

    // Monitor INP (Interaction to Next Paint)
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.interactionId) {
          const duration = entry.duration;
          console.log('INP Duration:', duration);
        }
      }
    }).observe({ entryTypes: ['interaction'] });

    // Monitor FID (First Input Delay)
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        console.log('FID:', entry.processingStart - entry.startTime);
      }
    }).observe({ entryTypes: ['first-input'] });
  }
};

// Utility to measure component render time
export const measureComponentRender = (componentName) => {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    console.log(`${componentName} render time:`, endTime - startTime);
  };
};

// Utility to track custom performance metrics
export const trackCustomMetric = (metricName, value) => {
  if ('performance' in window) {
    performance.mark(`${metricName}-start`);
    
    // Your code here
    
    performance.mark(`${metricName}-end`);
    performance.measure(metricName, `${metricName}-start`, `${metricName}-end`);
    
    const measurements = performance.getEntriesByName(metricName);
    console.log(`${metricName}:`, measurements[measurements.length - 1].duration);
  }
};
