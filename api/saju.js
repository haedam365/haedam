export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, dayStem, relationship, concern, sajuData } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const promptData = {
      contents: [{
        parts: [{
          text: `너는 사주를 정말 다정하고 깊이 있게 풀이해 주는 상담가 '해담'이야. 아래 내담자의 정보를 바탕으로, 기계적인 느낌이나 AI 특유의 번역투 없이 실제로 마주 앉아 따뜻하게 대화하듯 풀이해 줘.

[내담자 정보]
- 이름: ${name}
- 일간: ${dayStem}
- 고민: ${concern}
- 명식: ${JSON.stringify(sajuData)}

[작성 규칙]
1. 사주 용어(비견, 편관 등)나 어려운 한자는 절대 사용하지 마. 오직 자연의 물상(나무, 숲, 따뜻한 햇살, 넓은 바다 등)이나 일상적인 단어로만 비유해서 쉽게 설명할 것.
2. 호칭은 반드시 '${name}님'처럼 이름과 '님' 자를 띄어쓰기 없이 붙여서 쓸 것 (예: ${name} 님 -> 안 됨 / ${name}님 -> 맞음).
3. '~입니다', '~합니다' 같은 딱딱한 문어체나 설명문 대신, '~해요', '~하네요', '~인 것 같아요'처럼 눈을 맞추고 친근하게 이야기하는 구어체를 사용할 것.
4. 내담자의 고민에 깊이 공감하는 다정한 문장을 반드시 포함할 것.
5. 강조를 위한 '**' 나 '*' 같은 마크다운 특수기호는 절대 사용하지 말고 자연스러운 평문(Plain text)으로만 작성할 것.
6. 절대로 마크다운 코드블록(\`\`\`json 등)을 쓰지 말고, 순수한 JSON 형식의 텍스트만 출력할 것.

[출력 JSON 형식]
{
  "nature": "여기에 ${name}님이 어떤 자연의 모습을 닮았는지, 어떤 매력적인 기질을 타고났는지 다정하게 설명해 줘.",
  "pros_cons": "여기에 ${name}님만의 빛나는 장점과, 살짝 보완하면 더 좋을 점을 기분 좋게 조언해 줘.",
  "fortune_2026": "여기에 2026년 한 해 동안 ${name}님에게 펼쳐질 운의 흐름을 희망차고 구체적으로 이야기해 줘.",
  "advice": "여기에 ${name}님의 현재 고민에 대한 따뜻한 위로와 현실적인 해결책을 진심을 담아 전달해 줘."
}`
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
