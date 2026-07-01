import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      questionEn,
      optionsEn = [],
      targetLanguages,
    }: {
      questionEn: string;
      optionsEn?: string[];
      targetLanguages: string[];
    } = body;

    if (!questionEn?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Question text is required',
        },
        { status: 400 }
      );
    }

    if (!targetLanguages || targetLanguages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Target languages are required',
        },
        { status: 400 }
      );
    }

    // ==========================
    // Environment Variables
    // ==========================
    const freeLlmUrl = process.env.FREELLM_URL;
    const apiKey = process.env.FREELLM_API;

    if (!freeLlmUrl) {
      throw new Error(
        'FREELLM_URL environment variable is missing.'
      );
    }

    const systemPrompt = `
You are a professional translator for agricultural surveys.

Translate accurately.

Return ONLY a valid raw JSON object.

Do NOT return markdown.
Do NOT return explanation.
Do NOT wrap inside \`\`\`json.
`;

    const userPrompt = `
Translate the following agricultural survey question into:

${targetLanguages.join(", ")}

Question:
"${questionEn}"

Options:
${
  optionsEn.length
    ? optionsEn.map((o, i) => `${i + 1}. ${o}`).join("\n")
    : "(None)"
}

Return ONLY this JSON:

{
${targetLanguages
  .map(
    (lang) => `
"${lang}": {
  "question": "translated question",
  "options": [
    ${
      optionsEn.length
        ? optionsEn.map(() => `"translated option"`).join(", ")
        : ""
    }
  ]
}`
  )
  .join(",")}
}
`;

    const response = await fetch(freeLlmUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey
          ? {
              Authorization: `Bearer ${apiKey}`,
            }
          : {}),
      },
      body: JSON.stringify({
        model: "auto",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error(errorText);

      return NextResponse.json(
        {
          success: false,
          error: "FreeLLMAPI request failed.",
          details: errorText,
        },
        {
          status: response.status,
        }
      );
    }

    const result = await response.json();

    const content =
      result?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: "Model returned empty response.",
        },
        {
          status: 500,
        }
      );
    }

    let cleanContent = content;

    if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/^```[a-zA-Z]*\n?/, "");
      cleanContent = cleanContent.replace(/```$/, "");
      cleanContent = cleanContent.trim();
    }

    try {
      const translations = JSON.parse(cleanContent);

      return NextResponse.json({
        success: true,
        data: translations,
      });
    } catch (err) {
      console.error(err);

      return NextResponse.json(
        {
          success: false,
          error: "Model did not return valid JSON.",
          rawOutput: content,
        },
        {
          status: 500,
        }
      );
    }
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Unknown server error",
      },
      {
        status: 500,
      }
    );
  }
}
