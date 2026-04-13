const $ = id => document.getElementById(id);

const baseProbs = [
  { token: 'pizza', prob: 0.25 },
  { token: 'sushi', prob: 0.18 },
  { token: 'pasta', prob: 0.12 },
  { token: 'tacos', prob: 0.10 },
  { token: 'burger', prob: 0.08 },
  { token: 'steak', prob: 0.07 },
  { token: 'curry', prob: 0.05 },
  { token: 'salad', prob: 0.04 },
  { token: 'ramen', prob: 0.03 },
  { token: 'chocolate', prob: 0.02 },
  { token: 'fruit', prob: 0.015 },
  { token: 'bread', prob: 0.012 },
  { token: 'rice', prob: 0.013 },
  { token: 'soup', prob: 0.01 },
  { token: 'ice', prob: 0.01 },
];

function applyTemperature(probs, temp) {
  if (temp === 0) {
    return probs.map((p, i) => ({ ...p, adjusted: i === 0 ? 1 : 0 }));
  }
  const logits = probs.map(p => Math.log(p.prob + 1e-10));
  const scaled = logits.map(l => l / temp);
  const maxS = Math.max(...scaled);
  const exps = scaled.map(s => Math.exp(s - maxS));
  const sum = exps.reduce((a, b) => a + b, 0);
  return probs.map((p, i) => ({ ...p, adjusted: exps[i] / sum }));
}

function updateSampling() {
  const tempSlider = $('temp-slider');
  const kSlider = $('topk-slider');
  const pSlider = $('topp-slider');
  const chart = $('sampling-chart');
  
  if (!tempSlider || !kSlider || !pSlider || !chart) return;

  const temp = parseFloat(tempSlider.value) / 100;
  const K = parseInt(kSlider.value);
  const P = parseFloat(pSlider.value) / 100;
  const mode = 'both'; // always use intersection of Top-K and Top-P

  $('temp-val').textContent = temp.toFixed(2);
  $('topk-val').textContent = K;
  $('topp-val').textContent = P.toFixed(2);

  const adjusted = applyTemperature(baseProbs, temp);
  
  const topKSet = new Set(adjusted.slice(0, K).map(p => p.token));
  
  let cumulative = 0;
  const topPSet = new Set();
  for (const item of adjusted) {
    topPSet.add(item.token);
    cumulative += item.adjusted;
    if (cumulative >= P) break;
  }

  chart.innerHTML = '';
  const maxProb = Math.max(...adjusted.map(a => a.adjusted));
  let includedCount = 0;
  let includedProb = 0;

  adjusted.forEach((item, i) => {
    let included = false;
    // Enforce intersection: token must be in both Top-K and Top-P
    included = topKSet.has(item.token) && topPSet.has(item.token);

    if (included) { includedCount++; includedProb += item.adjusted; }

    const wrapper = document.createElement('div');
    wrapper.className = 'bar-wrapper';
    const bar = document.createElement('div');
    bar.className = 'bar' + (included ? '' : ' dimmed');
    const h = maxProb > 0 ? (item.adjusted / maxProb) * 100 : 0;
    bar.style.height = h + '%';
    
    const hue = (i / adjusted.length) * 280;
    bar.style.background = included ? `hsl(${hue}, 70%, 55%)` : 'var(--border)';
    
    const valEl = document.createElement('div');
    valEl.className = 'bar-value';
    valEl.style.opacity = '1';
    valEl.style.top = '-20px';
    valEl.textContent = (item.adjusted * 100).toFixed(1) + '%';
    bar.appendChild(valEl);

    const label = document.createElement('div');
    label.className = 'bar-label';
    label.textContent = item.token;
    label.style.color = included ? 'var(--text)' : 'var(--text-dim)';
    
    wrapper.appendChild(bar);
    wrapper.appendChild(label);
    chart.appendChild(wrapper);
  });

  const info = $('sampling-info');
  if (info) {
    info.innerHTML = `<span style="color:var(--accent2)">${includedCount}</span> tokens available for sampling, covering <span style="color:var(--accent2)">${(includedProb * 100).toFixed(1)}%</span> of total probability.`;
  }
}

let sampledTokens = [];
function sampleToken() {
  const temp = parseFloat($('temp-slider').value) / 100;
  const K = parseInt($('topk-slider').value);
  const P = parseFloat($('topp-slider').value) / 100;
  const mode = 'both';
  
  const adjusted = applyTemperature(baseProbs, temp);
  
  const topKSet = new Set(adjusted.slice(0, K).map(p => p.token));
  let cumulativeP = 0;
  const topPSet = new Set();
  for (const item of adjusted) {
    topPSet.add(item.token);
    cumulativeP += item.adjusted;
    if (cumulativeP >= P) break;
  }

  const filtered = adjusted.filter(item => {
    // Always use intersection
    return topKSet.has(item.token) && topPSet.has(item.token);
  });

  if (filtered.length === 0) return;

  const sum = filtered.reduce((a, b) => a + b.adjusted, 0);
  let r = Math.random() * sum;
  let selected = filtered[filtered.length - 1].token;
  for (const item of filtered) {
    r -= item.adjusted;
    if (r <= 0) { selected = item.token; break; }
  }

  sampledTokens.push(selected);
  $('temp-sampled').innerHTML = '<span style="color:var(--text-dim)">Sampled sequence:</span> ' +
    sampledTokens.map(t => `<span style="background:var(--accent);color:#fff;padding:2px 8px;border-radius:4px;margin:2px;display:inline-block;font-size:0.85rem;">${t}</span>`).join(' ');
}

function resetSampled() { sampledTokens = []; $('temp-sampled').innerHTML = ''; }

try { updateSampling(); } catch(e) { console.error(e); }
