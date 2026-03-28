export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, dayStem, relationship, concern, sajuData } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });

    // [필살기] v1 주소를 사용하고 모델명을 가장 단순하게 호출합니다.
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = {
      contents: [{
        parts: [{
          text: `너는 사주 상담가 '해담'이야. 이름:${name}, 일간:${dayStem}, 고민:${concern}, 명식:${JSON.stringify(sajuData)} 정보를 바탕으로 다정하게 풀이해줘. 반드시 JSON으로만 답해: {"nature": "...", "pros_cons": "...", "fortune_2026": "...", "advice": "..."}`
        }]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt)
    });

    const result = await response.json();

    if (!response.ok) {
      // 만약 여기서도 Not Found가 뜨면, 구글 계정에서 API 사용 승인이 덜 된 것일 수 있습니다.
      throw new Error(result.error?.message || '구글 서버 응답 오류');
    }

    const text = result.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    res.status(200).json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    res.status(500).json({ error: "분석 실패: " + error.message });
  }
}
