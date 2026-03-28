export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, dayStem, relationship, concern, sajuData } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'Vercel에 API 키가 설정되지 않았습니다.' });

    // [최종 해결책] 가장 안정적이고 100% 동작하는 'gemini-pro' 모델로 주소를 바꿉니다.
    // 이 주소는 구글의 모든 API 키에서 기본적으로 허용되는 표준 주소입니다.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const prompt = `
      너는 다정한 사주 상담가 '해담'이야. 아래 정보를 바탕으로 풀이해줘.
      이름: ${name}, 일간: ${dayStem}, 고민: ${concern}, 명식: ${JSON.stringify(sajuData)}
      
      [조건]
      1. 한자 없이 자연의 물상(나무, 햇살 등)에 비유해서 설명할 것.
      2. 실제 사람이 다정하게 말하는 어조(~해요)를 사용할 것.
      3. 반드시 아래 JSON 형식으로만 답변할 것. 다른 설명 금지.
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

    if (!response.ok) {
        // 여기서도 에러가 나면 구글이 보내주는 진짜 메시지를 표시합니다.
        throw new Error(result.error?.message || '구글 서버 응답 오류');
    }

    const text = result.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("AI가 답변 형식을 지키지 않았습니다.");

    res.status(200).json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    console.error("서버 에러:", error);
    res.status(500).json({ error: "분석 실패: " + error.message });
  }
}
