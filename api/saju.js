export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, dayStem, relationship, concern, sajuData } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'Vercel에 API 키가 설정되지 않았습니다.' });

    // [수정 포인트] 모델 명칭 뒤에 '-latest'를 붙여서 최신 버전임을 명시합니다.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const prompt = `
      너는 따뜻한 사주 상담가 '해담'이야. 아래 정보를 바탕으로 한자 없이 자연의 비유로 풀이해줘.
      내담자: ${name}, 일간: ${dayStem}, 고민: ${concern}, 명식: ${JSON.stringify(sajuData)}
      반드시 JSON으로만 답해: {"nature": "...", "pros_cons": "...", "fortune_2026": "...", "advice": "..."}
    `;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();

    if (!response.ok) {
        // 여기서 만약 또 모델을 못 찾는다면, 'gemini-pro'로 강제 전환하도록 유도합니다.
        throw new Error(result.error?.message || 'AI 응답 실패');
    }

    const text = result.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    res.status(200).json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    res.status(500).json({ error: "분석 실패: " + error.message });
  }
}
