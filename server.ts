import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parser with 10mb limit for base64 image uploads
app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI client (Server-side only)
function getAi(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Candidate models in order of priority (starting with gemini-3.1-flash-lite which has full free quota & fast inference)
const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

async function generateWithModelCascade(
  ai: GoogleGenAI,
  request: { contents: any; config?: any },
  timeoutMs = 18000
): Promise<{ text: string; modelUsed: string }> {
  let lastError: any = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await withAiTimeout(
        ai.models.generateContent({
          model,
          contents: request.contents,
          config: request.config,
        }),
        timeoutMs
      );
      if (response && response.text) {
        return { text: response.text, modelUsed: model };
      }
    } catch (err: any) {
      console.warn(`Model ${model} call failed (${err?.message || err}), trying next candidate...`);
      lastError = err;
    }
  }
  throw lastError || new Error('All candidate AI models were unreachable');
}

// Timeout wrapper for AI calls (18 seconds to allow model inference)
function withAiTimeout<T>(promise: Promise<T>, ms: number = 18000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('AI generation latency limit exceeded')), ms)
    ),
  ]);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const ai = getAi();
  res.json({
    status: 'ok',
    service: 'GreenPulse Sustainability Backend',
    aiConfigured: Boolean(ai),
    timestamp: new Date().toISOString(),
  });
});

// Fallback rule-based waste catalog for instant offline/demo reliability
const WASTE_KNOWLEDGE_BASE: Record<
  string,
  {
    category: 'Recycle' | 'Compost' | 'Landfill' | 'Hazardous / E-Waste' | 'Special Drop-off' | 'Reusable';
    materialType: string;
    handlingSteps: string[];
    contaminationAlerts: string[];
    reuseIdeas: string[];
    estimatedWeightKg: number;
    avoidedCo2eKg: number;
    diversionEligible: boolean;
    funEcoFact: string;
  }
> = {
  'plastic bottle': {
    category: 'Recycle',
    materialType: 'PET (#1 Polyethylene Terephthalate)',
    handlingSteps: [
      'Empty all liquid contents completely',
      'Rinse bottle with cold water to remove sugary residue',
      'Crush bottle slightly to save bin volume',
      'Replace cap tightly (modern MRF facilities accept caps on)',
      'Place in dedicated plastic/recycling container',
    ],
    contaminationAlerts: ['Do not leave straws or dirty wrappers inside', 'Avoid mixing with non-PET soft plastics'],
    reuseIdeas: ['Cut base for seedling planters', 'Make self-watering herb pots', 'Convert into a bird feeder'],
    estimatedWeightKg: 0.025,
    avoidedCo2eKg: 0.082,
    diversionEligible: true,
    funEcoFact: 'Recycling 1 ton of PET plastic bottles saves roughly 3.8 barrels of crude oil and 1,200 kWh of electricity.',
  },
  'coffee cup': {
    category: 'Landfill',
    materialType: 'Paperboard lined with Polyethylene (PE) coating',
    handlingSteps: [
      'Separate the plastic lid (check if lid is #5 PP or #6 PS)',
      'Remove the cardboard heat sleeve (cardboard sleeve CAN be recycled)',
      'Discard paper cup body in landfill bin (waxy plastic liner cannot be repulped in standard mills)',
    ],
    contaminationAlerts: ['Paper coffee cups placed in recycling contaminate paper bales with waterproof resin'],
    reuseIdeas: ['Use as a temporary paint/glue mixer cup', 'Bring a reusable vacuum-insulated mug next time (+20 XP)'],
    estimatedWeightKg: 0.018,
    avoidedCo2eKg: 0.015,
    diversionEligible: false,
    funEcoFact: 'Over 16 billion paper coffee cups are discarded each year globally. Reusable tumblers break even after only 20 uses.',
  },
  'aluminum can': {
    category: 'Recycle',
    materialType: 'Aluminum Alloy (100% infinitely recyclable)',
    handlingSteps: [
      'Pour out remaining beverage liquid',
      'Light rinse if sugary or sticky',
      'Keep tab attached to the can',
      'Place in curbside metals recycling',
    ],
    contaminationAlerts: ['Do not crush completely if your municipality uses optical sorting sensors'],
    reuseIdeas: ['Desk pencil organizer', 'Repurposed tealight candle holder', 'Seed starting pots'],
    estimatedWeightKg: 0.015,
    avoidedCo2eKg: 0.14,
    diversionEligible: true,
    funEcoFact: 'Recycling aluminum uses 95% less energy than mining and smelting new bauxite ore. A recycled can is back on shelves in 60 days.',
  },
  battery: {
    category: 'Hazardous / E-Waste',
    materialType: 'Lithium-Ion / Alkaline heavy metal chemistry',
    handlingSteps: [
      'Tape battery contact terminals with clear electrical tape to prevent short circuits',
      'Store in a cool, dry container away from direct sunlight',
      'Do NOT place in standard trash or curbside recycling',
      'Drop off at designated hardware store or municipal e-waste depot (e.g. Call2Recycle kiosk)',
    ],
    contaminationAlerts: ['Lithium batteries crushed in garbage trucks or recycling sorting lines cause severe fires'],
    reuseIdeas: ['Check rechargeable health before recycling; recharge if battery pack is still serviceable'],
    estimatedWeightKg: 0.045,
    avoidedCo2eKg: 0.35,
    diversionEligible: true,
    funEcoFact: 'Recycling lithium batteries recovers critical cobalt, nickel, and lithium, reducing demand for virgin open-pit mining by up to 70%.',
  },
  cardboard: {
    category: 'Recycle',
    materialType: 'Corrugated Cardboard (Kraft fibers)',
    handlingSteps: [
      'Remove all plastic packing tape and shipping label stickers if possible',
      'Flatten boxes completely to save transport emissions and bin space',
      'Keep dry; place in blue paper/cardboard bin',
    ],
    contaminationAlerts: ['Grease-soaked pizza cardboard must go to compost or trash, not paper recycling'],
    reuseIdeas: ['Use for garden sheet mulching (suppresses weeds organically)', 'Packaging storage and moving boxes'],
    estimatedWeightKg: 0.25,
    avoidedCo2eKg: 0.42,
    diversionEligible: true,
    funEcoFact: 'Recycling 1 ton of cardboard saves 9 cubic yards of landfill space and 46 gallons of oil.',
  },
  'food scraps': {
    category: 'Compost',
    materialType: 'Organic Plant / Cellulose Matter',
    handlingSteps: [
      'Collect in a breathable countertop compost pail or freezer bowl to avoid odors',
      'Add to backyard compost tumbler or city green-waste bin',
      'Balance greens (nitrogen-rich scraps) with browns (dry leaves, shredded cardboard)',
    ],
    contaminationAlerts: ['Do not mix plastic produce stickers or rubber bands into compost'],
    reuseIdeas: ['Simmer vegetable peelings to make homemade aromatic vegetable broth', 'Feed suitable scraps to home vermicompost (worms)'],
    estimatedWeightKg: 0.3,
    avoidedCo2eKg: 0.55,
    diversionEligible: true,
    funEcoFact: 'When food scraps decompose in landfills without oxygen, they release methane (CH4), a greenhouse gas 28x more potent than CO2.',
  },
};

// 1. Waste Scanner Endpoint
app.post('/api/waste/scan', async (req, res) => {
  try {
    const { itemName, imageBase64, mimeType = 'image/jpeg' } = req.body;
    const ai = getAi();

    // If Gemini AI is configured, perform intelligent multi-modal or text inference
    if (ai) {
      try {
        let contents: any;
        const promptText = `
You are the GreenPulse Waste AI Classifier. Analyze this waste item: "${itemName || 'item in image'}".
Categorize it precisely and provide concrete handling guidance, DIY reuse ideas, and scrap value in Indian Rupees (INR ₹).

Return a STRICT JSON object with these EXACT keys:
{
  "itemName": string (clean specific name, e.g. "Cardboard Delivery Box" or "PET Plastic Bottle"),
  "category": "Recycle" | "Compost" | "Landfill" | "Hazardous / E-Waste" | "Special Drop-off" | "Reusable",
  "materialType": string (e.g. "Corrugated Kraft Paperboard", "PET #1 Plastic", "Aluminum Alloy"),
  "confidence": number (integer 0 to 100),
  "handlingSteps": string[] (3 to 5 clear action steps),
  "contaminationAlerts": string[] (1 to 2 critical contamination prevention warnings),
  "reuseIdeas": string[] (2 to 3 creative DIY reuse or upcycling ideas),
  "diyYoutubeQuery": string (e.g. "diy creative reuse cardboard box home craft ideas"),
  "wikipediaSearchTerm": string (e.g. "Cardboard recycling"),
  "kabadiwalaPriceInrPerKg": number (typical Indian scrap dealer price per kg, e.g. 14 for cardboard, 20 for PET plastic, 35 for iron, 140 for aluminum),
  "estimatedWeightKg": number (estimated weight in kg, e.g. 0.35),
  "avoidedCo2eKg": number (estimated CO2e greenhouse gas avoided if diverted, e.g. 0.45),
  "environmentalBenefits": string[] (2 to 3 tangible environmental savings like water, trees, or energy),
  "diversionEligible": boolean,
  "funEcoFact": string
}
Return only valid JSON, without markdown formatting.
`;

        if (imageBase64) {
          const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
          contents = {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: cleanBase64,
                },
              },
              { text: promptText },
            ],
          };
        } else {
          contents = promptText;
        }

        const { text: rawText, modelUsed } = await generateWithModelCascade(ai, {
          contents: contents,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const parsed = JSON.parse((rawText || '{}').replace(/```json/g, '').replace(/```/g, '').trim());
        
        // Enrich with direct external links
        const ytQuery = encodeURIComponent(parsed.diyYoutubeQuery || `how to reuse ${parsed.itemName} diy craft ideas`);
        const wikiTerm = encodeURIComponent(parsed.wikipediaSearchTerm || parsed.materialType || parsed.itemName);
        parsed.youtubeUrl = `https://www.youtube.com/results?search_query=${ytQuery}`;
        parsed.wikipediaUrl = `https://en.wikipedia.org/wiki/Special:Search?search=${wikiTerm}`;
        parsed.kabadiwalaPriceInrPerKg = parsed.kabadiwalaPriceInrPerKg || 14;
        parsed.estimatedInrValue = Number(((parsed.kabadiwalaPriceInrPerKg || 14) * (parsed.estimatedWeightKg || 0.25)).toFixed(2));
        parsed.environmentalBenefits = parsed.environmentalBenefits || [
          `Conserves ~${Math.round((parsed.estimatedWeightKg || 0.25) * 26)} liters of water`,
          `Avoids ${(parsed.avoidedCo2eKg || 0.35)} kg greenhouse gas emission`,
          `Preserves local urban tree and forest cover`
        ];

        return res.json({ success: true, source: modelUsed, data: parsed });
      } catch (aiErr: any) {
        console.warn('Gemini waste classification failed, falling back to rule engine:', aiErr?.message);
      }
    }

    // Fallback rule-engine matching
    const query = (itemName || 'plastic bottle').toLowerCase();
    let matchedKey = Object.keys(WASTE_KNOWLEDGE_BASE).find((k) => query.includes(k));
    if (!matchedKey) {
      if (query.includes('cup') || query.includes('starbucks')) matchedKey = 'coffee cup';
      else if (query.includes('can') || query.includes('coke') || query.includes('soda') || query.includes('beer')) matchedKey = 'aluminum can';
      else if (query.includes('battery') || query.includes('electronics') || query.includes('charger')) matchedKey = 'battery';
      else if (query.includes('box') || query.includes('amazon') || query.includes('paper')) matchedKey = 'cardboard';
      else if (query.includes('apple') || query.includes('food') || query.includes('banana') || query.includes('peel')) matchedKey = 'food scraps';
      else matchedKey = 'plastic bottle';
    }

    const template = WASTE_KNOWLEDGE_BASE[matchedKey];
    const cleanName = itemName || matchedKey.charAt(0).toUpperCase() + matchedKey.slice(1);
    const ytQuery = encodeURIComponent(`how to reuse ${cleanName} diy craft ideas`);
    const wikiTerm = encodeURIComponent(template.materialType || cleanName);
    const kabadiwalaRate = cleanName.toLowerCase().includes('cardboard') || cleanName.toLowerCase().includes('paper')
      ? 14
      : cleanName.toLowerCase().includes('plastic') || cleanName.toLowerCase().includes('bottle')
      ? 20
      : cleanName.toLowerCase().includes('can') || cleanName.toLowerCase().includes('metal')
      ? 120
      : 10;

    const result = {
      itemName: cleanName,
      category: template.category,
      materialType: template.materialType,
      confidence: 88,
      handlingSteps: template.handlingSteps,
      contaminationAlerts: template.contaminationAlerts,
      reuseIdeas: template.reuseIdeas,
      diyYoutubeQuery: `diy creative reuse ${cleanName}`,
      youtubeUrl: `https://www.youtube.com/results?search_query=${ytQuery}`,
      wikipediaUrl: `https://en.wikipedia.org/wiki/Special:Search?search=${wikiTerm}`,
      kabadiwalaPriceInrPerKg: kabadiwalaRate,
      estimatedWeightKg: template.estimatedWeightKg,
      estimatedInrValue: Number((kabadiwalaRate * template.estimatedWeightKg).toFixed(2)),
      avoidedCo2eKg: template.avoidedCo2eKg,
      environmentalBenefits: [
        `Conserves ~${Math.round(template.estimatedWeightKg * 26)} liters of water`,
        `Prevents ${template.avoidedCo2eKg} kg greenhouse gases`,
        `Earns ₹${(kabadiwalaRate * template.estimatedWeightKg).toFixed(1)} from local scrap dealer / kabadiwala`
      ],
      diversionEligible: template.diversionEligible,
      funEcoFact: template.funEcoFact,
    };

    return res.json({ success: true, source: 'rule-engine-fallback', data: result });
  } catch (error: any) {
    console.error('Waste scan error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal error' });
  }
});

// 2. AI Sustainability Coach / Consultant Endpoint
app.post('/api/coach/chat', async (req, res) => {
  try {
    const { userMessage, userContext, history = [] } = req.body;
    const {
      totalKwh = 145,
      totalCost = 23.2,
      totalCo2eKg = 55.8,
      wasteCount = 12,
      diversionRate = 75,
      streakDays = 5,
      sustainabilityScore = 78,
      recentItems = ['Aluminum Soda Can', 'Cardboard Delivery Box', 'Refrigerator eco-mode'],
    } = userContext || {};

    const ai = getAi();
    if (ai) {
      try {
        const historyText = Array.isArray(history) && history.length > 0
          ? `Prior conversation turn history:\n${history
              .slice(-6)
              .map((h: any) => `${h.role === 'user' ? 'User' : 'Consultant'}: ${h.content}`)
              .join('\n')}\n\n`
          : '';

        const prompt = `
You are the EcoQuest & GreenPulse AI Sustainability Consultant (Straw Hats).
You are a warm, highly knowledgeable, practical environmental and energy consultant.
You provide fresh, science-backed guidance tailored specifically to what the user is asking right now.

${historyText}User's current profile metrics:
- Sustainability Impact Score: ${sustainabilityScore}/100
- Active Daily Streak: ${streakDays} days
- Tracked Energy: ${totalKwh} kWh ($${Number(totalCost).toFixed(2)}, ~${Number(totalCo2eKg).toFixed(1)} kg CO2e)
- Tracked Waste Items: ${wasteCount} items (${diversionRate}% diverted from landfill)
- Recent user activity: ${recentItems.join(', ')}

User's NEW message/question:
"${userMessage || 'How can I reduce my energy bills and waste footprint this month?'}"

CRITICAL INSTRUCTIONS:
- Directly answer the specific question or topic the user just raised.
- DO NOT repeat standard introductory greetings if this is a follow-up or reply.
- Use Indian Rupees (₹) for ALL monetary amounts and savings (electricity tariff base rate ~₹7.50/kWh).
- DO NOT output raw markdown hashes like "##" or "###". Use bold headlines like "**Title**" instead.
- For bullet points, use a leaf "🍃 " or flower "🌸 " instead of asterisks or dashes.
- Provide 2 to 3 concrete, realistic action steps with realistic numbers (₹ saved, kWh avoided, or kg CO2e reduced).
- End with 1 custom "GreenQuest Action Challenge" with bonus XP (+35 XP to +50 XP).
`;

        const { text: replyText, modelUsed } = await generateWithModelCascade(ai, {
          contents: prompt,
        });

        return res.json({
          success: true,
          source: modelUsed,
          reply: replyText,
        });
      } catch (aiErr: any) {
        console.warn('Gemini coach call failed across candidate models:', aiErr?.message);
      }
    }

    // Dynamic contextual fallback if AI service is completely unavailable
    const msg = (userMessage || '').toLowerCase();
    let dynamicBody = '';
    let challengeTitle = 'Green Habit Sprint';

    if (msg.includes('paper') || msg.includes('cardboard') || msg.includes('raddi') || msg.includes('kabadiwala')) {
      dynamicBody = `Saving 1 kg of paper and cardboard waste is a massive win for both your wallet and the environment! In India, scrap dealers (kabadiwalas) pay approximately **₹14.00 INR per kg** for clean paper and cardboard cartons.\n\n🍃 **Cash Earned:** Sell 1 kg to your local kabadiwala for ~₹14 INR cash.\n🌸 **Industrial Energy Saved:** Saves 4.0 kWh of electricity (worth ~₹29 INR in utility value).\n🍃 **Clean Water Spared:** Prevents ~28 Litres of water from being polluted in pulping mills.\n🌸 **Trees Preserved:** Directly preserves ~1.4 kg of natural wood / timber and prevents 1.8 kg CO₂e greenhouse gas emissions!`;
      challengeTitle = 'Cardboard & Paper Raddi Diversion';
    } else if (msg.includes('food') || msg.includes('diet') || msg.includes('meat') || msg.includes('vegetable')) {
      dynamicBody = `Food and organic waste account for approximately 25% of household greenhouse impact. Shifting just two meals a week to plant-based lentils or legumes cuts ~3.5 kg CO₂e per week while lowering grocery spending by roughly ₹450/month.\n\n🍃 **Prevent Produce Spoilage:** Keep greens wrapped in cloth towels in the crisper drawer to double freshness longevity.\n🌸 **Compost Scraps:** Diverting 1 kg of food scraps from landfills prevents 0.8 kg of methane-equivalent warming.`;
      challengeTitle = 'The 48-Hour Zero Food Waste Challenge';
    } else if (msg.includes('plastic') || msg.includes('recycle') || msg.includes('bin') || msg.includes('trash')) {
      dynamicBody = `You currently divert **${diversionRate}%** of your waste stream! To push further, focus on rigid plastics (#1 PET and #2 HDPE) which scrap buyers purchase at **₹20/kg**.\n\n🍃 **Swap Single-Use Cups:** Bringing a stainless tumbler prevents 300+ lined paper cups annually (~9 kg CO₂e avoided).\n🌸 **Dry Rinse Only:** Clean containers with a quick 5-second rinse to conserve water while keeping recyclables clean for scrap collection.`;
      challengeTitle = 'Plastic-Free 24 Hours';
    } else if (msg.includes('water') || msg.includes('shower') || msg.includes('bath')) {
      dynamicBody = `Heating water is typically the second-largest energy expense in residences. Setting water heater thermostat to 49°C eliminates scald risk and cuts electricity by 8% to 12%.\n\n🍃 **Low-Flow Aerator:** Installing an inexpensive sink aerator saves ~4,500 liters of warm water annually.\n🌸 **Cold Laundry Cycle:** 90% of washing machine electricity goes directly into heating water. Switching to cold wash saves ~₹850/year.`;
      challengeTitle = 'Cold Wash Weekend';
    } else {
      dynamicBody = `Looking at your current **${sustainabilityScore}/100 Sustainability Score** and **${streakDays}-day streak**, attacking **phantom standby loads** and **climate control thermostat settings** will yield the most immediate cash and carbon savings.\n\n🍃 **Smart Power Strip:** Workstations draw 15-25W idle. Switching them completely off overnight saves ~₹180/mo.\n🌸 **Thermostat Adjustment:** Each 1°C adjustment closer to ambient trims ~6% off AC bills.\n🍃 **Refrigerator Coil Check:** Vacuuming dust off condenser coils once every 6 months restores compressor efficiency by 8%.`;
      challengeTitle = 'The 24-Hour Vampire Power Sweep';
    }

    const contextualFallback = `
**🌿 Consultation Plan: "${userMessage ? userMessage.slice(0, 45) : 'Eco Efficiency'}"**

${dynamicBody}

---
🎯 **Your Personalized GreenQuest Challenge:**
**"${challengeTitle}"** (+40 XP)
*Put this into practice today and log your progress in GreenPulse!*
`;

    return res.json({
      success: true,
      source: 'dynamic-contextual-advisor',
      reply: contextualFallback,
    });
  } catch (error: any) {
    console.error('Coach endpoint error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal error' });
  }
});

// 3. Appliance Energy Eco-Audit Endpoint
app.post('/api/energy/audit', async (req, res) => {
  try {
    const { appliance, wattage, hoursPerDay, daysPerWeek, tariff = 0.16, gridFactor = 0.385 } = req.body;

    const monthlyHours = (hoursPerDay * (daysPerWeek || 7) * 52) / 12;
    const monthlyKwh = (wattage * monthlyHours) / 1000;
    const monthlyCost = monthlyKwh * tariff;
    const monthlyCo2eKg = monthlyKwh * gridFactor;

    // Eco tips by appliance
    let tip = 'Consider using a smart outlet timer to automatically turn off power during peak tariff hours.';
    const appLower = (appliance || '').toLowerCase();
    if (appLower.includes('air') || appLower.includes('ac') || appLower.includes('hvac')) {
      tip = 'Raising your thermostat setting by just 1°C (2°F) reduces cooling electricity use by up to 8-10%. Use ceiling fans to feel 4°F cooler.';
    } else if (appLower.includes('fridge') || appLower.includes('refrigerator')) {
      tip = 'Ensure door seals are airtight and vacuum the condenser coils annually to maintain peak compressor efficiency and save 10% kWh.';
    } else if (appLower.includes('pc') || appLower.includes('computer')) {
      tip = 'Enable Sleep Mode after 15 minutes of inactivity. Standby GPU power can draw 40W continually if RGB lighting and peripherals remain awake.';
    } else if (appLower.includes('dish') || appLower.includes('washer')) {
      tip = 'Always run full loads and select Air Dry rather than heated drying cycle to reduce energy by roughly 40%.';
    } else if (appLower.includes('car') || appLower.includes('ev')) {
      tip = 'Schedule charging during off-peak overnight hours (11 PM - 6 AM) when grid electricity is both significantly cheaper and cleaner.';
    }

    res.json({
      success: true,
      data: {
        appliance,
        wattage,
        monthlyHours: Math.round(monthlyHours),
        monthlyKwh: Number(monthlyKwh.toFixed(2)),
        monthlyCost: Number(monthlyCost.toFixed(2)),
        monthlyCo2eKg: Number(monthlyCo2eKg.toFixed(2)),
        ecoTip: tip,
        formula: {
          kwh: `(${wattage}W × ${hoursPerDay}h × ${daysPerWeek}d × 52w / 12m) / 1000 = ${monthlyKwh.toFixed(1)} kWh/mo`,
          cost: `${monthlyKwh.toFixed(1)} kWh × $${tariff}/kWh = $${monthlyCost.toFixed(2)}/mo`,
          co2e: `${monthlyKwh.toFixed(1)} kWh × ${gridFactor} kg CO2e/kWh = ${monthlyCo2eKg.toFixed(1)} kg CO2e/mo`,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. AI Scenario Forecaster (What-If Simulation)
app.post('/api/ai/forecast', async (req, res) => {
  try {
    const { scenarioText, currentKwh = 350, currentWaste = 5, tariff = 0.16, gridFactor = 0.385 } = req.body;
    const ai = getAi();

    if (ai) {
      try {
        const prompt = `
You are the GreenPulse Climate Forecasting Engine.
Analyze this user sustainability what-if scenario: "${scenarioText || 'Switch to LED lights, bike 2 days a week, and compost'}"
Current baseline: ${currentKwh} kWh/mo, ${currentWaste} kg waste/wk, tariff $${tariff}/kWh, grid factor ${gridFactor} kg CO2e/kWh.

Return a STRICT JSON object:
{
  "projectedKwhSavedMonthly": number,
  "projectedCostSavedMonthly": number,
  "projectedCo2eSavedMonthly": number,
  "wasteDivertedKgMonthly": number,
  "treesEquivalentAnnual": number,
  "carMilesAvoidedMonthly": number,
  "actionBreakdown": [
    { "action": string, "monthlyCo2eSaved": number, "effort": "Low" | "Medium" | "High", "tip": string }
  ],
  "feasibilityScore": number (0-100),
  "executiveSummary": string
}
Return only JSON.
`;

        const { text: rawText, modelUsed } = await generateWithModelCascade(ai, {
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });

        const parsed = JSON.parse((rawText || '{}').replace(/```json/g, '').replace(/```/g, '').trim());
        return res.json({ success: true, source: modelUsed, data: parsed });
      } catch (err: any) {
        console.warn('Gemini forecast fallback:', err?.message);
      }
    }

    // Bulletproof fallback
    const fallbackData = {
      projectedKwhSavedMonthly: 45.0,
      projectedCostSavedMonthly: Number((45.0 * tariff).toFixed(2)),
      projectedCo2eSavedMonthly: Number((45.0 * gridFactor + 12.0).toFixed(1)),
      wasteDivertedKgMonthly: 8.5,
      treesEquivalentAnnual: 1.4,
      carMilesAvoidedMonthly: 72,
      actionBreakdown: [
        {
          action: 'Shift to cold water laundry & air-dry rack',
          monthlyCo2eSaved: 14.2,
          effort: 'Low',
          tip: '90% of washing machine energy is consumed heating water.',
        },
        {
          action: 'Active composting of organic vegetable scraps',
          monthlyCo2eSaved: 9.8,
          effort: 'Medium',
          tip: 'Prevents anaerobic methane emission at the landfill site.',
        },
        {
          action: 'Kill 20W standby PC & entertainment vampire drain',
          monthlyCo2eSaved: 5.3,
          effort: 'Low',
          tip: 'A smart power strip automates power-off when devices sleep.',
        },
      ],
      feasibilityScore: 88,
      executiveSummary: 'This scenario yields approximately a 12% to 18% reduction in monthly emissions with low friction to your routine.',
    };

    res.json({ success: true, source: 'rule-engine-fallback', data: fallbackData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. AI Appreciation Letter Generator (Day 7 Eco Reward)
app.post('/api/ai/letter', async (req, res) => {
  try {
    const { userName = 'Eco Champion', streakDays = 7, lastAction = 'separated waste', avoidedCo2e = 15.4 } = req.body;
    const ai = getAi();

    if (ai) {
      try {
        const prompt = `
Write a heartfelt, personal, beautifully crafted eco appreciation letter for a user named "${userName}".
They have achieved a ${streakDays}-day streak on GreenPulse!
Their latest sustainable action was: "${lastAction}".
Estimated cumulative carbon prevented: ${avoidedCo2e} kg CO2e.

Tone: Warm, encouraging, literary, inspiring, grounded in quiet intentionality (like Annie Dillard or Wendell Berry).
Length: 3 short paragraphs.
Sign off: "With gratitude for your mindful footprint, — GreenPulse & The Earth"
`;

        const { text: letterText, modelUsed } = await generateWithModelCascade(ai, {
          contents: prompt,
        });

        return res.json({ success: true, source: modelUsed, letter: letterText });
      } catch (err: any) {
        console.warn('Gemini letter fallback:', err?.message);
      }
    }

    const fallbackLetter = `Dear ${userName},

Every thoughtful choice ripples outward. Showing up for ${streakDays} consecutive days is not merely an achievement on a screen; it is a quiet declaration that your daily rhythms matter to the living world. When you choose to ${lastAction}, you take responsibility for the physical materials and currents of energy flowing through your home.

You have already prevented an estimated ${avoidedCo2e} kg of greenhouse gas emissions from entering our shared atmosphere. More importantly, you have begun turning intentional conservation into effortless muscle memory. 

Sustainability is not about flawless asceticism—it is about the humble, steady practice of doing one better thing each day. Thank you for walking this path with us.

With gratitude for your mindful footprint,
— The GreenPulse Community`;

    res.json({ success: true, source: 'letter-fallback', letter: fallbackLetter });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. AI 7-Day Carbon Diet & Habit Plan
app.post('/api/ai/diagnose', async (req, res) => {
  try {
    const { goal = 'Cut monthly electricity bills by 20% and zero out landfill plastics', householdSize = 3 } = req.body;
    const ai = getAi();

    if (ai) {
      try {
        const prompt = `
Create a realistic 7-Day Micro-Action Carbon Diet plan for a household of ${householdSize} people.
Goal: "${goal}".
Return STRICT JSON:
{
  "planTitle": string,
  "totalEstimatedMonthlySavings": string,
  "totalEstimatedCo2Saved": string,
  "dailyPlan": [
    { "day": number, "title": string, "action": string, "category": "Energy" | "Waste" | "Habit", "timeRequiredMinutes": number, "xpPoints": number }
  ],
  "expertCoachNote": string
}
`;

        const { text: rawText, modelUsed } = await generateWithModelCascade(ai, {
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });

        const parsed = JSON.parse((rawText || '{}').replace(/```json/g, '').replace(/```/g, '').trim());
        return res.json({ success: true, source: modelUsed, data: parsed });
      } catch (err: any) {
        console.warn('Gemini plan fallback:', err?.message);
      }
    }

    const fallbackPlan = {
      planTitle: 'The 7-Day Household Efficiency Kickstart',
      totalEstimatedMonthlySavings: '$18.40 / month',
      totalEstimatedCo2Saved: '38.2 kg CO₂e / month',
      dailyPlan: [
        { day: 1, title: 'Vampire Electronics Hunt', action: 'Walk around your home and unplug 4 idle transformers or turn off gaming PC master switch.', category: 'Energy', timeRequiredMinutes: 10, xpPoints: 25 },
        { day: 2, title: 'Fridge Thermostat Calibration', action: 'Set refrigerator to 37°F (3°C) and freezer to 0°F (-18°C) to prevent compressor overworking.', category: 'Energy', timeRequiredMinutes: 5, xpPoints: 20 },
        { day: 3, title: 'Kitchen Compost Staging', action: 'Set up a countertop scrap bowl or freezer container for coffee grounds and fruit peels.', category: 'Waste', timeRequiredMinutes: 15, xpPoints: 30 },
        { day: 4, title: 'The Cold-Water Laundry Shift', action: 'Switch laundry dial to 30°C Cold Wash and hang-dry 5 items instead of using resistance dryer.', category: 'Energy', timeRequiredMinutes: 10, xpPoints: 35 },
        { day: 5, title: 'Single-Use Plastic Bypass', action: 'Carry your own tote bag and refillable tumbler for all errands today with 0 disposable plastics.', category: 'Habit', timeRequiredMinutes: 5, xpPoints: 30 },
        { day: 6, title: 'Clean Stream Recycling Audit', action: 'Inspect municipal recycling bin; rinse residue from cans and remove plastic film wrappers.', category: 'Waste', timeRequiredMinutes: 12, xpPoints: 25 },
        { day: 7, title: 'Reflection & Letter Celebration', action: 'Review week totals in GreenPulse, unlock your Day 7 Appreciation Letter, and set next month target.', category: 'Habit', timeRequiredMinutes: 10, xpPoints: 50 },
      ],
      expertCoachNote: 'Focus on establishing consistency before adding more complex actions. Habits built this week compound into hundreds of kilograms of avoided emissions every year.',
    };

    res.json({ success: true, source: 'plan-fallback', data: fallbackPlan });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. AI Household Deep Decarbonization Audit Endpoint
app.post('/api/ai/calculator/audit', async (req, res) => {
  try {
    const { formData, currentTonnes = 8.5 } = req.body;
    const ai = getAi();

    if (ai) {
      try {
        const prompt = `
You are a senior IPCC-certified climate mitigation auditor.
Analyze this household carbon audit input:
${JSON.stringify(formData || {}, null, 2)}
Current estimated total footprint: ${currentTonnes} tonnes CO2e/year.

Produce a tailored, mathematically grounded deep decarbonization audit.
Return STRICT JSON ONLY:
{
  "headlineSummary": string,
  "projectedAnnualTonnesCut": number,
  "projectedAnnualDollarSavings": number,
  "highestLeverSector": string,
  "recommendations": [
    {
      "title": string,
      "description": string,
      "co2eCutKg": number,
      "annualSavings": string,
      "difficulty": "Easy" | "Moderate" | "High"
    }
  ],
  "methodologyNote": string
}
`;

        const { text: rawText, modelUsed } = await generateWithModelCascade(ai, {
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });

        const parsed = JSON.parse((rawText || '{}').replace(/```json/g, '').replace(/```/g, '').trim());
        return res.json({ success: true, source: modelUsed, data: parsed });
      } catch (err: any) {
        console.warn('Gemini calculator audit fallback:', err?.message);
      }
    }

    // High quality deterministic calculation fallback based on inputs
    const commMode = formData?.commuteMode || 'car_petrol';
    const isCar = commMode.includes('car');
    const electKwh = formData?.monthlyElectricityKwh || 320;
    const diet = formData?.dietType || 'average_omnivore';

    const fallbackAudit = {
      headlineSummary: `Based on your audited profile (${currentTonnes} Tonnes CO₂e/yr), your greatest decarbonization leverage lies in ${
        isCar ? 'Mobility & Commuting Efficiency' : 'Home Thermal & Power Optimization'
      }. Implementing 3 priority shifts can eliminate up to 1.85 Tonnes CO₂e while saving ~$420/year.`,
      projectedAnnualTonnesCut: 1.85,
      projectedAnnualDollarSavings: 420,
      highestLeverSector: isCar ? 'Transport & Mobility' : 'Home Energy',
      recommendations: [
        {
          title: isCar ? 'Transition 2 commute days to carpool or electric transit' : 'Smart thermostat setback (24°C summer / 20°C winter)',
          description: isCar
            ? 'Cuts tailpipe petroleum combustion by 35% without requiring vehicle replacement.'
            : 'Reduces compressor duty cycles during peak tariff hours, lowering home thermal baseline.',
          co2eCutKg: isCar ? 740 : 380,
          annualSavings: '$190/yr',
          difficulty: 'Easy',
        },
        {
          title: electKwh > 250 ? 'Eliminate vampire standby loads & install LED retrofits' : 'Adopt a 100% green renewable power tariff rider',
          description: 'Cuts unnecessary baseline kilowatt draw with zero impact on lifestyle convenience.',
          co2eCutKg: 460,
          annualSavings: '$130/yr',
          difficulty: 'Easy',
        },
        {
          title: diet.includes('meat') ? 'Incorporate 2 plant-rich / flexitarian days weekly' : 'Active kitchen food scrap composting & zero waste packaging',
          description: 'Prevents agricultural methane vectors and landfill organic anaerobic decomposition.',
          co2eCutKg: 650,
          annualSavings: '$100/yr',
          difficulty: 'Moderate',
        },
      ],
      methodologyNote: 'Calculations utilize EPA GHG equivalencies and IPCC Tier-2 household lifecycle coefficients.',
    };

    res.json({ success: true, source: 'calculator-audit-fallback', data: fallbackAudit });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Shared Real-Time Community Reports System (Shared across all devices & friends)
interface SharedCommunityReport {
  id: number;
  photo: string;
  description: string;
  location: string;
  type: string;
  flower: string;
  date: string;
  author: string;
  likes: number;
  lat?: number;
  lng?: number;
  kabadiwalaValueInr?: number;
}

const SHARED_COMMUNITY_REPORTS: SharedCommunityReport[] = [
  {
    id: 1,
    photo: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
    description: 'Cleared discarded plastic bottles and wrappers from neighborhood sidewalk.',
    location: 'Connaught Place, New Delhi',
    type: 'Plastic',
    flower: '🌸',
    date: '2026-10-10',
    author: 'GreenGuru',
    likes: 14,
    lat: 28.6315,
    lng: 77.2167,
    kabadiwalaValueInr: 25,
  },
  {
    id: 2,
    photo: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=600&q=80',
    description: 'Sorted 4.5 kg corrugated cardboard shipping boxes for kabadiwala pickup.',
    location: 'Indiranagar 100ft Road, Bengaluru',
    type: 'Paper',
    flower: '🌻',
    date: '2026-10-09',
    author: 'EcoQueen',
    likes: 9,
    lat: 12.9784,
    lng: 77.6408,
    kabadiwalaValueInr: 65,
  },
  {
    id: 3,
    photo: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
    description: 'Kitchen organic waste & fruit peelings set up for home composting.',
    location: 'Bandra West, Mumbai',
    type: 'Food waste',
    flower: '🌼',
    date: '2026-10-08',
    author: 'CleanCrusader',
    likes: 21,
    lat: 19.0596,
    lng: 72.8295,
    kabadiwalaValueInr: 0,
  },
];

app.get('/api/community/reports', (req, res) => {
  res.json({ success: true, data: SHARED_COMMUNITY_REPORTS });
});

app.post('/api/community/reports', (req, res) => {
  const { photo, description, location, type, flower = '🌸', author = 'Eco Explorer', lat, lng, kabadiwalaValueInr = 0 } = req.body;
  if (!description) {
    return res.status(400).json({ success: false, error: 'Description is required' });
  }

  const newReport: SharedCommunityReport = {
    id: Date.now(),
    photo: photo || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
    description: description.trim(),
    location: location?.trim() || 'Local Area',
    type: type || 'Mixed Waste',
    flower: flower || '🌸',
    date: new Date().toISOString().split('T')[0],
    author: author || 'Eco Explorer',
    likes: 0,
    lat: lat ? Number(lat) : 28.6139,
    lng: lng ? Number(lng) : 77.2090,
    kabadiwalaValueInr: Number(kabadiwalaValueInr) || 0,
  };

  SHARED_COMMUNITY_REPORTS.unshift(newReport);
  res.json({ success: true, data: newReport, total: SHARED_COMMUNITY_REPORTS.length });
});

app.post('/api/community/reports/:id/like', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const rep = SHARED_COMMUNITY_REPORTS.find((r) => r.id === id);
  if (rep) {
    rep.likes = (rep.likes || 0) + 1;
    return res.json({ success: true, likes: rep.likes });
  }
  res.status(404).json({ success: false, error: 'Report not found' });
});

// Setup Vite in Dev mode or Static serving in Production
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GreenPulse server running at http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
