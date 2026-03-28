export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, dayStem, relationship, concern, sajuData } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });

    // [진짜 원인 해결] 2026년 현재 구글이 지원하는 최신 모델인 'gemini-2.5-flash'를 사용해야 합니다.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const promptData = {
      contents: [{
        parts: [{
          text: `너는 따뜻한 사주 상담가 '해담'이야. 이름:${name}, 일간:${dayStem}, 고민:${concern}, 명식:${JSON.stringify(sajuData)} 정보를 바탕으로 다정하게 풀이해줘. 반드시 JSON으로만 답해: {"nature": "...", "pros_cons": "...", "fortune_2026": "...", "advice": "..."}`
        }]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promptData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || '구글 서버 연결 실패');
    }

    const text = result.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("AI 응답 형식이 올바르지 않습니다.");
    
    res.status(200).json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    res.status(500).json({ error: "분석 실패: " + error.message });
  }
}
