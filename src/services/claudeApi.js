const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are an expert sports scientist and personal trainer. Based on the user's body analysis data, fitness goals, experience level, available equipment, and any limitations, generate a complete weekly workout routine. Be specific with exercises, sets, reps, rest times, and tempo. Include warm-up and cool-down. Explain WHY each exercise is chosen based on their body proportions. Respond ONLY in valid JSON matching this schema:
{
  "weeklySchedule": [
    {
      "day": "string",
      "focus": "string",
      "warmup": [{ "exercise": "string", "duration": "string" }],
      "exercises": [
        {
          "name": "string",
          "sets": "number",
          "reps": "string",
          "rest": "string",
          "tempo": "string",
          "notes": "string",
          "whyThisExercise": "string"
        }
      ],
      "cooldown": [{ "exercise": "string", "duration": "string" }]
    }
  ],
  "nutritionTips": ["string"],
  "weeklyProgressionPlan": "string",
  "estimatedSessionDuration": "string"
}`;

export async function generateRoutine(userInfo, analysisData) {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'your-api-key-here') {
    throw new Error('Please set your Anthropic API key in the .env file (VITE_ANTHROPIC_API_KEY)');
  }

  const userMessage = `
Here is my body analysis and profile data. Generate a personalized weekly workout routine.

**Personal Info:**
- Name: ${userInfo.name}
- Age: ${userInfo.age}
- Gender: ${userInfo.gender}
- Height: ${userInfo.height} ${userInfo.heightUnit}
- Weight: ${userInfo.weight} ${userInfo.weightUnit}
- Fitness Goals: ${userInfo.fitnessGoals.join(', ')}
- Experience Level: ${userInfo.experienceLevel}
- Injuries/Limitations: ${userInfo.injuries || 'None'}
- Equipment Available: ${userInfo.equipment.join(', ')}

**Body Analysis:**
- Body Type: ${analysisData.bodyType}
- Frame Size: ${analysisData.frameSize}
- Shoulder-to-Hip Ratio: ${analysisData.metrics.shoulderToHipRatio}
- Torso-to-Leg Ratio: ${analysisData.metrics.torsoToLegRatio}
- Limb-to-Torso Ratio: ${analysisData.metrics.limbToTorsoRatio}
- Shoulder Width: ${Math.round(analysisData.metrics.shoulderWidth)} cm
- Hip Width: ${Math.round(analysisData.metrics.hipWidth)} cm
- Torso Length: ${Math.round(analysisData.metrics.torsoLength)} cm
- Leg Length: ${Math.round(analysisData.metrics.legLength)} cm

**Proportional Notes:**
${analysisData.proportionalNotes.map((n) => `- ${n}`).join('\n')}

Generate a complete, personalized weekly routine based on all this data. Return ONLY valid JSON.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content[0].text;

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse routine from API response');

  return JSON.parse(jsonMatch[0]);
}
