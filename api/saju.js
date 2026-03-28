export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, dayStem, relationship, concern, sajuData } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });

    // [최종 해결책] v1 주소와 gemini-1.5-flash 모델의 조합입니다. 
    // 이 조합은 현재 구글에서 가장 안정적으로 지원하는 표준입니다.
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
      너는 사주 상담가 '해담'이야. 아래 정보를 바탕으로 따뜻하게 풀이해줘.
      이름: ${name}, 일간: ${dayStem}, 고민: ${concern}, 명식: ${JSON.stringify(sajuData)}
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
        // 구글이 주는 에러 메시지를 그대로 화면에 띄워 원인을 파악합니다.
        throw new Error(result.error?.message || '구글 서버 응답 오류');
    }

    const text = result.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("AI 답변 형식이 올바르지 않습니다.");
    
    res.status(200).json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    res.status(500).json({ error: "분석 실패: " + error.message });
  }
}
