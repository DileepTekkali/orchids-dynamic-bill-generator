export function extractCityFromAddress(address: string): string {
  const lines = address.split('\n').map(l => l.trim()).filter(Boolean);
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (
      lowerLine.includes('town') ||
      lowerLine.includes('city') ||
      lowerLine.includes('village') ||
      lowerLine.includes('taluk') ||
      lowerLine.includes('mandal')
    ) {
      const cleanedLine = line.replace(/^(town|city|village|taluk|mandal)[:\-\s]*/i, '').trim();
      const parts = cleanedLine.split(/[,\-]/);
      return parts[0].trim();
    }
  }

  const allParts = address.split(/[,\n]+/).map(p => p.trim()).filter(Boolean);
  
  for (let i = allParts.length - 1; i >= 0; i--) {
    const part = allParts[i];
    if (/^\d{6}$/.test(part)) continue;
    if (/^(india|tamil nadu|kerala|karnataka|andhra pradesh|telangana|maharashtra|gujarat|rajasthan|punjab|haryana|uttar pradesh|madhya pradesh|bihar|west bengal|odisha|assam|jharkhand|chhattisgarh|uttarakhand|himachal pradesh|goa|manipur|meghalaya|mizoram|nagaland|tripura|sikkim|arunachal pradesh|jammu|kashmir|ladakh|delhi|chandigarh|puducherry|pondicherry|daman|diu|dadra|nagar haveli|andaman|nicobar|lakshadweep)$/i.test(part)) continue;
    if (/district/i.test(part)) continue;
    
    return part;
  }

  return allParts[Math.max(0, allParts.length - 3)] || 'CITY';
}

export function generateStamp(businessName: string, location: string): string {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  const size = 300;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, size, size);

  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size * 0.46;
  const innerRadius = size * 0.32;
  const stampColor = '#004b8d';

  ctx.strokeStyle = stampColor;

  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius - 6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = stampColor;

  const name = businessName.toUpperCase();
  const loc = location.toUpperCase();

  const textRadius = ((outerRadius - 6) + innerRadius) / 2;
  const arcLength = Math.PI * textRadius;

  const nameText = `★ ${name} ★`;
  const locText = `★ ${loc} ★`;

  const calculateFittingFontSize = (text: string, maxArcLength: number, startSize: number) => {
    let testSize = startSize;
    ctx.font = `bold ${testSize}px Arial, sans-serif`;
    let totalWidth = text.split('').reduce((sum, c) => sum + ctx.measureText(c).width, 0);
    
    while (totalWidth > maxArcLength * 0.92 && testSize > 6) {
      testSize -= 1;
      ctx.font = `bold ${testSize}px Arial, sans-serif`;
      totalWidth = text.split('').reduce((sum, c) => sum + ctx.measureText(c).width, 0);
    }
    return testSize;
  };

  const nameFontSize = calculateFittingFontSize(nameText, arcLength, 28);
  const locFontSize = calculateFittingFontSize(locText, arcLength, 28);
  const finalFontSize = Math.min(nameFontSize, locFontSize);

  drawTextAlongArc(ctx, nameText, centerX, centerY, textRadius, Math.PI, 0, true, finalFontSize);
  drawTextAlongArc(ctx, locText, centerX, centerY, textRadius, Math.PI, 2 * Math.PI, false, finalFontSize);

  addStampTexture(ctx, size, stampColor);

  return canvas.toDataURL('image/png');
}

function drawTextAlongArc(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  isTop: boolean,
  fontSize: number
) {
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const characters = text.split('');
  const charWidths = characters.map(c => ctx.measureText(c).width);
  const totalWidth = charWidths.reduce((sum, w) => sum + w, 0);
  const arcLength = Math.abs(endAngle - startAngle) * radius;

  const extraSpace = arcLength - totalWidth;
  const spacing = Math.max(0, Math.min(extraSpace / (characters.length + 1), fontSize * 0.15));

  const totalArcNeeded = (totalWidth + spacing * (characters.length - 1)) / radius;
  
  let currentAngle: number;
  if (isTop) {
    currentAngle = startAngle + (Math.abs(endAngle - startAngle) - totalArcNeeded) / 2;
  } else {
    currentAngle = startAngle - (Math.abs(endAngle - startAngle) - totalArcNeeded) / 2;
  }

  characters.forEach((char, i) => {
    const charWidth = charWidths[i];
    const charAngle = charWidth / radius;

    if (isTop) {
      currentAngle += charAngle / 2;
    } else {
      currentAngle -= charAngle / 2;
    }

    const x = centerX + Math.cos(currentAngle) * radius;
    const y = centerY + Math.sin(currentAngle) * radius;

    ctx.save();
    ctx.translate(x, y);
    if (isTop) {
      ctx.rotate(currentAngle + Math.PI / 2);
    } else {
      ctx.rotate(currentAngle - Math.PI / 2);
    }
    ctx.fillText(char, 0, 0);
    ctx.restore();

    if (isTop) {
      currentAngle += charAngle / 2 + spacing / radius;
    } else {
      currentAngle -= charAngle / 2 + spacing / radius;
    }
  });
}

function addStampTexture(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.globalCompositeOperation = 'destination-out';
  
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const s = Math.random() * 1.5;
    ctx.beginPath();
    ctx.arc(x, y, s, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'source-over';
}
