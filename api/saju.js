const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, dayStem, relationship, concern, sajuData } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: '서버에 API 키가 설정되지 않았습니다.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // 404 에러를 방지하기 위해 가장 안정적인 모델명을 사용합니다.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

    const prompt = `
      너는 사주 상담가 '해담'이야. 아래 정보를 바탕으로 따뜻하게 풀이해줘.
      이름: ${name}, 일간: ${dayStem}, 고민: ${concern}, 명식: ${JSON.stringify(sajuData)}
      
      [조건]
      1. 한자 없이 자연의 물상(나무, 햇살 등)에 비유해서 설명할 것.
      2. 실제 사람이 다정하게 말하는 어조(~해요)를 사용할 것.
      3. 반드시 아래 JSON 형식으로만 답변할 것. 다른 설명 금지.
      {"nature": "...", "pros_cons": "...", "fortune_2026": "...", "advice": "..."}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSON만 추출하는 안전한 로직
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI 답변 형식이 올바르지 않습니다.");
    
    res.status(200).json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    console.error("에러 발생:", error);
    res.status(500).json({ error: error.message });
  }
};
