import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionEn, optionsEn, targetLanguages } = body as {
      questionEn: string;
      optionsEn?: string[];
      targetLanguages: string[];
    };

    if (!questionEn) {
      return NextResponse.json({ success: false, error: 'Question text is required' }, { status: 400 });
    }
    if (!targetLanguages || !Array.isArray(targetLanguages) || targetLanguages.length === 0) {
      return NextResponse.json({ success: false, error: 'Target languages are required' }, { status: 400 });
    }

    const freeLlmUrl = process.env.FREELLMURL;
    const apiKey = process.env.FREELLM_API;

    const systemPrompt = `You are a professional translator for agricultural surveys. You translate surveys to help farmers understand the questions perfectly.
You must output a raw, valid JSON object and absolutely nothing else. No markdown wrap, no explanations, no text before or after the JSON.`;

    const userPrompt = `Translate the following agricultural survey question and its choice options into these languages: ${targetLanguages.join(', ')}.

English Question:
"${questionEn}"

Options to translate in the exact same order:
${optionsEn && optionsEn.length > 0 ? optionsEn.map((opt, i) => `${i + 1}. ${opt}`).join('\n') : '(None)'}

You must return a raw JSON object matching the following structure:
{
  ${targetLanguages.map(lang => `"${lang}": {
    "question": "translated question text in ${lang}",
    "options": [${optionsEn && optionsEn.length > 0 ? optionsEn.map(() => `"translated option text"`).join(', ') : ''}]
  }`).join(',\n  ')}
}

Translate accurately and output ONLY the JSON object. Do not include markdown code block formatting like \`\`\`json.`;

    const response = await fetch(freeLlmUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'auto',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('FreeLLMAPI translation error:', errText);
      return NextResponse.json({ success: false, error: 'Failed to translate via FreeLLMAPI' }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json({ success: false, error: 'Received empty response from translation model' }, { status: 500 });
    }

    // Clean markdown code blocks if the model wrapped the JSON
    let cleanContent = content;
    if (cleanContent.startsWith('```')) {
      // Find the first newline to strip the tag (e.g. ```json)
      const firstNewlineIdx = cleanContent.indexOf('\n');
      if (firstNewlineIdx !== -1) {
        cleanContent = cleanContent.substring(firstNewlineIdx).trim();
      }
      // Strip trailing ```
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.substring(0, cleanContent.length - 3).trim();
      }
    }

    try {
      const translations = JSON.parse(cleanContent);
      return NextResponse.json({ success: true, data: translations });
    } catch (parseErr) {
      console.error('Failed to parse translation JSON:', cleanContent, parseErr);
      return NextResponse.json({ success: false, error: 'Model output was not valid JSON. Please try again.', rawOutput: content }, { status: 500 });
    }

  } catch (error) {
    const err = error as Error;
    console.error('Translation endpoint error:', err);
    return NextResponse.json({ success: false, error: err.message || 'An error occurred during translation' }, { status: 500 });
  }
}
