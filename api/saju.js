const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { name, dayStem, relationship, concern, sajuData } = req.body;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 자연의 물상 비유와 사람다운 문체를 강조한 프롬프트
    const prompt = `
    사주 정보를 바탕으로 내담자에게 편지를 쓰듯 따뜻하고 쉬운 문장으로 풀이해줘. 
    
    [지침]
    1. 자기소개 절대 금지: '경력 몇 년', '명리학 전문가 해담' 같은 표현은 절대 넣지 마.
    2. 한자어 최소화: 어려운 한자 용어 대신 누구나 이해할 수 있는 쉬운 한글 표현을 써.
    3. 자연 비유: 일간(${dayStem})과 사주 구성을 나무, 꽃, 강물, 바위, 햇살 등 자연의 모습에 빗대어 설명해.
    4. 사람다운 문체: 기계적인 분석이 아니라, 실제 사람이 고민을 들어주며 다독여주는 듯한 부드럽고 다정한 어조(~해요, ~일 거예요)를 사용해.
    5. 분량: 각 항목당 공백 포함 400자 이상 정성스럽게 작성해.

    [내담자 정보]
    - 이름: ${name}
    - 일간(본질): ${dayStem}
    - 연애상태: ${relationship}
    - 현재고민: ${concern}
    - 사주명식: ${JSON.stringify(sajuData)}

    [출력 형식 - 반드시 이 JSON 구조로만 답변]
    {
        "nature": "자연의 모습으로 본 성향과 기질 풀이",
        "pros_cons": "본인이 가진 고유한 빛깔(장점)과 조심하면 좋을 부분(단점)",
        "fortune_2026": "2026년 병오년에 찾아올 계절의 변화와 흐름",
        "advice": "현재 상태(${relationship})와 고민(${concern})에 대해 자연이 주는 다정한 조언"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        res.status(200).json(JSON.parse(text));
    } catch (error) {
        console.error("에러 발생:", error);
        res.status(500).json({ error: '풀이를 생성하는 중 오류가 발생했습니다.' });
    }
}
