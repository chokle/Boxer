import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

router.post("/analyze", async (req, res) => {
  const {
    title,
    match_context,
    opponent_style,
    match_description,
    boxer_profile,
    images,
    has_video,
  } = req.body;

  if (!match_description || !boxer_profile) {
    res.status(400).json({ error: "match_description and boxer_profile are required" });
    return;
  }

  const hasImages = Array.isArray(images) && images.length > 0;

  const systemPrompt = `You are an elite boxing coach AI with expertise in technical analysis of boxing performance.
You analyze match descriptions${hasImages ? ", images, and video footage" : ""} and provide detailed, actionable coaching feedback.
${hasImages ? "When images are provided, analyze the visible technique, stance, positioning, and any observable form issues.\n" : ""}Always respond with valid JSON matching the specified schema.
Your scoring is rigorous: 70+ is good, 80+ is excellent, 90+ is elite.`;

  const mediaContext = hasImages
    ? `\nMEDIA: ${images.length} image(s) provided — analyze visual technique in the attached image(s).`
    : has_video
      ? "\nMEDIA: A video recording of the session was uploaded. Consider this as supplementary evidence when evaluating the text description."
      : "";

  const userPrompt = `Analyze the following boxing performance and provide scores and tactical feedback.

BOXER PROFILE:
- Name: ${boxer_profile.name || "Unknown"}
- Stance: ${boxer_profile.stance || "Orthodox"}
- Experience: ${boxer_profile.experience_level || "Intermediate"}
- Weight Class: ${boxer_profile.weight_class || "Unknown"}

MATCH CONTEXT: ${match_context || "training"}
OPPONENT STYLE: ${opponent_style || "balanced"}
MATCH TITLE: ${title || "Session"}
${mediaContext}

MATCH DESCRIPTION / OBSERVATIONS:
${match_description}

Return a JSON object with this exact structure:
{
  "overall_score": <0-100>,
  "stance_score": <0-100>,
  "offense_score": <0-100>,
  "defense_score": <0-100>,
  "footwork_score": <0-100>,
  "combination_score": <0-100>,
  "stance_feedback": "<2-3 sentences on stance and guard>",
  "offense_feedback": "<2-3 sentences on punching offense>",
  "defense_feedback": "<2-3 sentences on defensive technique>",
  "footwork_feedback": "<2-3 sentences on movement and footwork>",
  "combination_feedback": "<2-3 sentences on combinations and flow>",
  "tactical_summary": "<3-4 sentence overall tactical assessment>",
  "key_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvement_areas": ["<area 1>", "<area 2>", "<area 3>"],
  "shot_accuracy": <0-100 percentage>,
  "punches_thrown": <estimated integer>,
  "punches_landed": <estimated integer>,
  "drills": [
    {
      "category": "<footwork|offense|defense|stamina|combination>",
      "name": "<drill name>",
      "description": "<what to do and why>",
      "duration": "<e.g. 3 x 3-minute rounds>",
      "difficulty": "<Easy|Medium|Hard>",
      "focus_area": "<specific technique being trained>",
      "reps": "<e.g. 10 reps per side>"
    }
  ]
}`;

  try {
    type ContentPart =
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail: "high" | "low" | "auto" } };

    const userContent: ContentPart[] = [{ type: "text", text: userPrompt }];

    if (hasImages) {
      for (const b64 of images.slice(0, 5)) {
        const dataUrl = b64.startsWith("data:")
          ? b64
          : `data:image/jpeg;base64,${b64}`;
        userContent.push({
          type: "image_url",
          image_url: { url: dataUrl, detail: "high" },
        });
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 2500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: hasImages ? userContent : userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: "Invalid AI response format" });
      return;
    }

    const analysis = JSON.parse(jsonMatch[0]);
    res.json({ success: true, analysis });
  } catch (err) {
    req.log.error({ err }, "Failed to analyze match");
    res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

export default router;
