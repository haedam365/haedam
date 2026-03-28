const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { name, dayStem, relationship, concern, sajuData } = req.body;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // 가장 안정적인 1.5 플래시 모델로 변경
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    사주 정보를 바탕으로 내담자에게 편지를 쓰듯 따뜻하고 쉬운 문장으로 풀이해줘. 
    
    [지침]
    1. 자기소개 절대 금지: 이름이나 경력 등 본인 소개는 일절 하지 마.
    2. 한자어 사용 금지: 어려운 용어 대신 쉬운 우리말 표현만 사용해.
    3. 자연 비유: ${dayStem}의 기운을 나무, 꽃, 강물, 바위, 햇살 등 자연의 물상에 빗대어 설명해.
    4. 친절한 어조: 실제 사람이 다정하게 이야기해주는 듯한 어조(~해요)를 사용해.
    5. 분량: 각 항목당 250자 내외로 핵심을 담아 작성해.

    [내담자 정보]
    - 이름: ${name}
    - 일간: ${dayStem}
    - 상태: ${relationship}
    - 고민: ${concern}
    - 명식: ${JSON.stringify(sajuData)}

    [출력 형식 - 반드시 JSON 구조로만 답변]
    {
        "nature": "자연의 모습으로 본 성향과 기질",
        "pros_cons": "본인이 가진 고유한 빛깔과 조심할 점",
        "fortune_2026": "2026년 병오년에 찾아올 계절의 변화와 흐름",
        "advice": "현재 고민에 대해 자연이 주는 다정한 조언"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        res.status(200).json(JSON.parse(text));
    } catch (error) {
        console.error("에러:", error);
        res.status(500).json({ error: 'AI 연결 시간 초과 또는 오류가 발생했습니다.' });
    }
}
