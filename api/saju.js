export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, dayStem, relationship, concern, sajuData } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });

  // 404 에러를 피하기 위해 구글의 v1beta API 주소를 직접 호출합니다.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `
    당신은 사주 상담가 '해담'입니다. 아래 정보를 바탕으로 따뜻하게 풀이하세요.
    내담자: ${name}, 일간: ${dayStem}, 고민: ${concern}, 명식: ${JSON.stringify(sajuData)}
    
    [필수 조건]
    1. 한자 없이 자연의 물상(나무, 햇살, 바다 등)에 비유해서 설명할 것.
    2. 실제 사람이 다정하게 말하는 어조(~해요)를 사용할 것.
    3. 반드시 아래 JSON 형식으로만 답변할 것. 다른 말은 절대 금지.
    {"nature": "...", "pros_cons": "...", "fortune_2026": "...", "advice": "..."}
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error?.message || 'AI 호출 실패');
    }

    const text = result.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI 답변 형식이 올바르지 않습니다.");

    res.status(200).json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    console.error("서버 에러:", error);
    res.status(500).json({ error: "분석 실패: " + error.message });
  }
}
