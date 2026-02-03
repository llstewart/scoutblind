/**
 * Web Worker for Lead Intel Analysis
 * Runs in a background thread to survive tab switches better than main thread
 */

// Handle messages from main thread
self.onmessage = async function(e) {
  const { type, payload } = e.data;

  if (type === 'START_ANALYSIS') {
    await runAnalysis(payload);
  } else if (type === 'ABORT') {
    // Worker will be terminated by main thread
    self.close();
  }
};

async function runAnalysis({ endpoint, businesses, niche, location }) {
  try {
    // Notify that we're starting
    self.postMessage({ type: 'STARTED', payload: { total: businesses.length } });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businesses,
        niche,
        location,
      }),
    });

    if (!response.ok) {
      // Try to parse error response
      try {
        const errorData = await response.json();
        self.postMessage({ type: 'ERROR', payload: errorData });
      } catch {
        self.postMessage({ type: 'ERROR', payload: { error: 'Analysis failed' } });
      }
      return;
    }

    // Process streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      self.postMessage({ type: 'ERROR', payload: { error: 'No response body' } });
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let completeSent = false; // Track if we already sent COMPLETE

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'status') {
              self.postMessage({
                type: 'STATUS',
                payload: {
                  phase: data.phase,
                  totalPhases: data.totalPhases,
                  message: data.message,
                  isBackground: data.isBackground || false,
                }
              });
            } else if (data.type === 'progress') {
              self.postMessage({
                type: 'PROGRESS',
                payload: {
                  completed: data.completed,
                  total: data.total,
                  message: data.message,
                  phase: data.phase,
                  hasMore: data.hasMore,
                }
              });
            } else if (data.type === 'first_page_complete') {
              self.postMessage({
                type: 'FIRST_PAGE_COMPLETE',
                payload: {
                  completed: data.completed,
                  total: data.total,
                  message: data.message,
                  hasMore: data.hasMore,
                }
              });
            } else if (data.type === 'business') {
              self.postMessage({
                type: 'BUSINESS_COMPLETE',
                payload: {
                  business: data.business,
                  progress: data.progress,
                }
              });
            } else if (data.type === 'error') {
              self.postMessage({
                type: 'STREAM_ERROR',
                payload: { message: data.message }
              });
            } else if (data.type === 'complete') {
              if (!completeSent) {
                self.postMessage({ type: 'COMPLETE' });
                completeSent = true;
              }
            }
          } catch (parseError) {
            console.error('[Worker] Failed to parse SSE data:', parseError);
          }
        }
      }
    }

    // Only send COMPLETE if we haven't already (fallback for streams without explicit complete)
    if (!completeSent) {
      self.postMessage({ type: 'COMPLETE' });
    }

  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      payload: { error: error.message || 'Analysis failed' }
    });
  }
}
