export default async function handler(req, res) {
  // 1. POST 요청이 아니면 차단
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, dayStem, relationship, concern, sajuData } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'Vercel 환경변수에 API 키가 없습니다.' });

  // 2. [핵심] 404 에러를 방지하기 위해 v1beta 주소를 직접 사용합니다.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `
    당신은 사주 상담가 '해담'입니다. 아래 정보를 바탕으로 따뜻하게 풀이하세요.
    내담자: ${name}, 일간: ${dayStem}, 고민: ${concern}, 명식: ${JSON.stringify(sajuData)}
    
    [조건]
    - 한자어 없이 자연의 비유(나무, 햇살 등)로 다정하게(~해요) 풀이할 것.
    - 반드시 아래 JSON 형식으로만 답변할 것. 다른 말은 절대 금지.
    {"nature": "...", "pros_cons": "...", "fortune_2026": "...", "advice": "..."}
  `;

  try {
    // 3. 구글 서버에 직접 데이터 전송
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error?.message || 'AI 호출 중 오류 발생');
    }

    // 4. 답변 추출 및 JSON 변환
    const text = result.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI가 올바른 형식을 주지 않았습니다.");

    res.status(200).json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    console.error("서버 에러:", error);
    res.status(500).json({ error: "분석 실패: " + error.message });
  }
}
