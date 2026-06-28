/**
 * ============================================================================
 * OFFICIAL HACKATHON TELEMETRY PIPELINE ENGINE (dataStream.js)
 * ============================================================================
 */

(function() {
  let memoryPool = [];
  let isInitialized = false;

  const randomRange = (min, max) => Math.random() * (max - min) + min;

  /**
   * Native, highly-optimized CSV Parser
   * Formats the static vendor spreadsheet matrix into a high-performance memory array.
   */
  const parseCSV = (csvText) => {
    console.log("⚡ [Pipeline Engine] Parsing Official Hackathon CSV into Memory Pool...");
    const lines = csvText.trim().split('\n');
    
    // Auto-detect comma or tab separation based on the headers
    const headers = lines[0].split('\t').length > lines[0].split(',').length 
      ? lines[0].split('\t').map(h => h.trim()) 
      : lines[0].split(',').map(h => h.trim());
    
    const parsedData = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // Handle both standard CSV and TSV clean strings
      const values = lines[i].includes('\t') ? lines[i].split('\t') : lines[i].split(','); 
      
      if (values.length === headers.length) {
        let rowObject = { internal_uid: `uid-row-${i}` }; // Primary key for unique DOM tracking
        
        headers.forEach((header, index) => {
          let rawVal = values[index];
          let val = rawVal !== undefined && rawVal !== null ? rawVal.trim() : '';
          
          // Cast values to strict types for proper sorting and mathematical operations
          if (['employee_count', 'annual_revenue_usd', 'customer_count', 'founded_year', 'robots_deployed', 'annual_savings_usd', 'budget_usd', 'roi_percent', 'employee_hours_saved'].includes(header)) {
            rowObject[header] = parseInt(val, 10) || 0;
          } else if (header === 'market_share_percent') {
            rowObject[header] = parseFloat(val) || 0.00;
          } else {
            rowObject[header] = val; // Metadata strings (Yes/No, Country, URLs)
          }
        });
        parsedData.push(rowObject);
      }
    }
    return parsedData;
  };

  window.__rpaStreamCallbacks = window.__rpaStreamCallbacks || [];

  /**
   * Global Stream Initialization Hook
   * Exposed to the window scope to anchor directly to custom front-end viewports.
   */
  window.initializeRpaStream = async function(callback, csvUrl = '/rpa_database_2026.csv') {
    if (typeof callback !== 'function') {
      console.error("❌ [Pipeline Error] initializeRpaStream requires a callback function execution loop.");
      return;
    }

    if (!window.__rpaStreamCallbacks.includes(callback)) {
      window.__rpaStreamCallbacks.push(callback);
    }

    const unsubscribe = () => {
      window.__rpaStreamCallbacks = window.__rpaStreamCallbacks.filter(cb => cb !== callback);
    };

    if (isInitialized) {
      console.log("📡 [Pipeline Engine] Appended callback to already initialized stream.");
      return unsubscribe;
    }

    try {
      console.log(`📦 [Pipeline Engine] Fetching schema baseline from target destination: ${csvUrl}`);
      const response = await fetch(csvUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP network error! status: ${response.status}`);
      }

      const csvText = await response.text();
      memoryPool = parseCSV(csvText);
      isInitialized = true;
      
      console.log(`✅ [Pipeline Engine] Successfully mapped ${memoryPool.length} rows directly into RAM.`);
      console.log("🚀 [Pipeline Engine] Starting high-frequency 200ms background execution firehose...");

      // Telemetry firehose tick rate matching strict hackathon runtime constraints
      setInterval(() => {
        if (memoryPool.length === 0) return;

        // Fluctuates an active cluster of records every cycle (5 to 50 updates per tick)
        const batchSize = Math.floor(randomRange(5, 50)); 
        const incomingBatch = [];

        for (let i = 0; i < batchSize; i++) {
          const targetIndex = Math.floor(randomRange(0, memoryPool.length));
          const row = { ...memoryPool[targetIndex] }; // Shallow clone to decouple references

          const isAnomaly = Math.random() > 0.95; // 5% chance of critical macro shifts
          
          if (isAnomaly) {
            // Massive macro volatility injection
            row.annual_revenue_usd += Math.floor(randomRange(-5000000, 5000000));
            row.customer_count += Math.floor(randomRange(-50, 50));
            row.market_share_percent = parseFloat((row.market_share_percent + randomRange(-0.05, 0.05)).toFixed(4));
            
            // Sync with our project's RPA fields so they mutate in tandem
            if (row.annual_savings_usd !== undefined) {
              row.annual_savings_usd = Math.max(0, row.annual_savings_usd + Math.floor(randomRange(-100000, 100000)));
            }
            if (row.robots_deployed !== undefined) {
              row.robots_deployed = Math.max(1, row.robots_deployed + Math.floor(randomRange(-2, 3)));
            }
          } else {
            // High-frequency standard operational telemetry noise
            row.annual_revenue_usd += Math.floor(randomRange(-50000, 100000));
            row.employee_count += Math.floor(randomRange(-2, 5));
            row.customer_count += Math.floor(randomRange(-1, 3));

            // Sync with our project's RPA fields so they mutate in tandem
            if (row.annual_savings_usd !== undefined) {
              row.annual_savings_usd = Math.max(0, row.annual_savings_usd + Math.floor(randomRange(-5000, 15000)));
            }
            if (row.robots_deployed !== undefined) {
              row.robots_deployed = Math.max(1, row.robots_deployed + (Math.random() > 0.85 ? Math.floor(randomRange(-1, 2)) : 0));
            }
          }

          // Real-time mutations for RPA fields as per requirements
          
          // 1. Mutate project_status (Transitions: Active <-> Failed <-> Pending <-> Completed)
          const statuses = ['Active', 'Failed', 'Pending', 'Completed'];
          if (!row.project_status || !statuses.includes(row.project_status)) {
            row.project_status = 'Active';
          }
          // Shift status with a 30% probability on each tick
          if (Math.random() > 0.7) {
            const currentStatus = row.project_status;
            const otherStatuses = statuses.filter(s => s !== currentStatus);
            row.project_status = otherStatuses[Math.floor(randomRange(0, otherStatuses.length))];
          }

          // 2. Mutate annual_savings_usd (Savings ±10%)
          if (row.annual_savings_usd === undefined || row.annual_savings_usd === null || isNaN(row.annual_savings_usd) || row.annual_savings_usd <= 0) {
            row.annual_savings_usd = Math.floor(randomRange(50000, 250000));
          }
          const savingsDeltaPercent = randomRange(-0.10, 0.10);
          row.annual_savings_usd = Math.max(1000, Math.round(row.annual_savings_usd * (1 + savingsDeltaPercent)));

          // 3. Mutate robots_deployed (change by ±1 or ±2)
          if (row.robots_deployed === undefined || row.robots_deployed === null || isNaN(row.robots_deployed) || row.robots_deployed < 1) {
            row.robots_deployed = Math.floor(randomRange(1, 12));
          }
          const robotsDelta = Math.random() > 0.5 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          row.robots_deployed = Math.max(1, row.robots_deployed + robotsDelta);

          // 4. Mutate roi_percent (ROI ±5%)
          if (row.roi_percent === undefined || row.roi_percent === null || isNaN(row.roi_percent)) {
            row.roi_percent = parseFloat(randomRange(20, 200).toFixed(2));
          }
          const roiDelta = randomRange(-5, 5);
          row.roi_percent = parseFloat((row.roi_percent + roiDelta).toFixed(2));

          // Strict downstream constraints: sanitize limits before pushing to components
          row.annual_revenue_usd = Math.max(0, row.annual_revenue_usd);
          row.employee_count = Math.max(1, row.employee_count);
          row.customer_count = Math.max(0, row.customer_count);
          row.market_share_percent = parseFloat(Math.max(0, row.market_share_percent).toFixed(4));

          // Reflect metrics mutation in state cache
          memoryPool[targetIndex] = row;
          incomingBatch.push(row);
        }

        // Blast payload batch array to all registered client-side callbacks
        window.__rpaStreamCallbacks.forEach(cb => {
          try {
            cb(incomingBatch);
          } catch (e) {
            console.error("❌ [Pipeline Callback Error] Failed to propagate batch:", e);
          }
        });
      }, 200);

      return unsubscribe;

    } catch (error) {
      console.error("❌ [Pipeline Critical Crash] Could not initialize telemetry stream:", error);
    }
  };
})();
