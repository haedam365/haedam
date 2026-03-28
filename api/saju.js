const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
  // 1. POST 요청인지 확인
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '잘못된 요청 방식입니다.' });
  }

  try {
    const { name, dayStem, relationship, concern, sajuData } = req.body;

    // 2. API 키가 있는지 확인
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: '서버에 API 키가 설정되지 않았습니다. Vercel 환경변수를 확인하세요.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 3. 프롬프트 작성
    const prompt = `
      당신은 따뜻한 사주 상담가 '해담'입니다. 
      다음 정보를 바탕으로 내담자 ${name}님에게 다정한 편지 형식으로 풀이하세요.
      - 일간(본질): ${dayStem}
      - 고민: ${concern}
      - 연애상태: ${relationship}
      - 사주데이터: ${JSON.stringify(sajuData)}

      [규칙]
      - 한자 용어는 절대 쓰지 말고 쉬운 우리말로 풀이하세요.
      - 자연의 비유(나무, 햇살, 바다 등)를 풍부하게 사용하세요.
      - 반드시 아래 JSON 형식으로만 답변하세요. 다른 말은 덧붙이지 마세요.
      {"nature": "...", "pros_cons": "...", "fortune_2026": "...", "advice": "..."}
    `;

    // 4. AI에게 요청
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

    // 5. 결과 전송
    res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("AI 상세 에러:", error);
    res.status(500).json({ error: '분석 실패: ' + error.message });
  }
};
