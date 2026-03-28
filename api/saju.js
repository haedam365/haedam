export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, dayStem, relationship, concern, sajuData } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'Vercel에 API 키가 설정되지 않았습니다.' });

    // [핵심 수정] 모델명 경로를 'models/gemini-1.5-flash'로 명확히 지정합니다.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
      너는 따뜻한 사주 상담가 '해담'이야. 아래 정보를 바탕으로 한자 없이 자연의 비유로 풀이해줘.
      내담자: ${name}, 일간: ${dayStem}, 고민: ${concern}, 명식: ${JSON.stringify(sajuData)}
      
      [조건]
      - 반드시 아래 JSON 형식으로만 답변할 것. 다른 설명은 절대 금지.
      {"nature": "...", "pros_cons": "...", "fortune_2026": "...", "advice": "..."}
    `;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();

    // 서버 응답이 실패했을 경우 상세 에러 출력
    if (!response.ok) {
        throw new Error(result.error?.message || 'AI 응답 실패');
    }

    const text = result.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI가 올바른 응답 형식을 생성하지 못했습니다.");

    res.status(200).json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    console.error("서버 에러 상세:", error);
    res.status(500).json({ error: "분석 실패: " + error.message });
  }
}
