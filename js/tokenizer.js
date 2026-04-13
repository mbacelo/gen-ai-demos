const $ = id => document.getElementById(id);
const tokenColors = [
  '#6c63ff','#00c9a7','#ff6b6b','#ffd93d','#4ecdc4',
  '#a78bfa','#f472b6','#fb923c','#38bdf8','#34d399',
  '#e879f9','#facc15','#f87171','#22d3ee','#818cf8'
];

function simpleTokenize(text) {
  if (!text) return [];
  const tokens = [];
  const regex = /([A-Za-z]+(?:'[a-z]+)?|[0-9]+(?:\.[0-9]+)?|[^A-Za-z0-9\s]|\s+)/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const t = m[0];
    if (t.length > 6 && /^[A-Za-z]+$/.test(t)) {
      const mid = Math.ceil(t.length * 0.55);
      tokens.push(t.slice(0, mid), t.slice(mid));
    } else {
      tokens.push(t);
    }
  }
  return tokens;
}

function tokenize() {
  const text = $('token-input').value;
  const tokens = simpleTokenize(text);
  const output = $('token-output');
  output.innerHTML = '';
  
  const tokenMap = new Map();
  let colorIdx = 0;

  tokens.forEach((t, i) => {
    if (!tokenMap.has(t)) {
      tokenMap.set(t, tokenColors[colorIdx % tokenColors.length]);
      colorIdx++;
    }
    const color = tokenMap.get(t);

    const span = document.createElement('span');
    span.className = 'token';
    span.textContent = t.replace(/ /g, '\u00B7').replace(/\n/g, '\u21B5');
    span.style.background = color + '22';
    span.style.borderColor = color + '66';
    span.title = `Token #${i + 1} (${t})`;
    output.appendChild(span);
  });

  const chars = text.length;
  const numTokens = tokens.length;
  $('stat-chars').textContent = chars.toLocaleString();
  $('stat-tokens').textContent = numTokens.toLocaleString();
  $('stat-ratio').textContent = numTokens > 0 ? (chars / numTokens).toFixed(2) : '0';

  const sel = $('token-model');
  const opt = sel.options[sel.selectedIndex];
  const priceIn = parseFloat(opt.dataset.in);
  const cost = (numTokens / 1_000_000) * priceIn;
  $('stat-cost').textContent = '$' + cost.toFixed(6);
}

$('token-input').addEventListener('input', tokenize);
tokenize();
